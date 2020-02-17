const partial = fn => (...pargs) => (...args) => (fn instanceof Function) ? fn.apply(null, [...pargs, ...args]) : undefined;
const partialRight = fn => (...pargs) => (...args) => (fn instanceof Function) ? fn.apply(null, [...args, ...pargs.reverse()]) : undefined;
const curry = fn => {
   return function curried(...args) {
      if (args.length >= func.length) {
         return fn.apply(this, args);
      } else {
         return function (...args2) {
            return curried.apply(this, args.concat(args2));
         }
      }
   };
}

function rangeElement(index, n, initial, final) {
   return index * (final - initial) / (n - 1) + initial;
}
function range(n, initial, final, cycles = 1) {
   return [...Array(n*cycles)].map((_, i) =>  rangeElement(i%n, ...arguments));
}

let sol, sphHelix;
let pListSol, pListSphHelix;
let drawCylFuncs, drawCylFuncsH;
let drawArrowFuncs, drawArrowFuncsH;
/// P5JS ///
let canvas;
function setup() {
   // +x: right, +y: downw, +z: towards
   canvas = createCanvas(windowWidth, windowHeight, WEBGL);

   function fromToRotation(fromVec, toVec, camMatrix = true, epsilon = .01) {
      // returns a 2D (3 by 3) rotation matrix
      // adapted from http://cs.brown.edu/research/pubs/pdfs/1999/Moller-1999-EBA.pdf
      // Moller & Hughes, 1999: 'Efficiently Building a Matrix to Rotate One Vector to Another'
      if (epsilon < 0 || epsilon > 1) {
         throw new Error('epsilon must be between 0 and 1');
      }

      // vectors must be normalized
      const from = fromVec.copy().normalize();
      const to = toVec.copy().normalize();
      let R = [...Array(3)].map(() => [...Array(3)]);

      const c = p5.Vector.dot(from, to);
      if (Math.abs(c) > 1 - epsilon) {
         /* "from" and "to"-vector almost parallel */
         // set x equal to coordinate axis most nearly orthogonal to 'from' vector, which is the axis corresponding to the 'from' coordinate with minimum absolute value
         let x = from.array().map(val => Math.abs(val));
         if (x[0] < x[1]) {
            if (x[0] < x[2]) {
               x = createVector(1, 0, 0);
            } else {
               x = createVector(0, 0, 1);
            }
         } else {
            if (x[1] < x[2]) {
               x = createVector(0, 1, 0);
            } else {
               x = createVector(0, 0, 1);
            }
         }

         const u = p5.Vector.sub(x, from);
         const v = p5.Vector.sub(x, to);

         // NOTE: dot(vec, vec) === |vec|**2
         const uu = p5.Vector.dot(u, u);
         const vv = p5.Vector.dot(v, v);

         // without check, c1 || c2 will equal Infinity when 'from' and 'to' vectors are orthogonal such that u || v is the zero vector (and therefore dot(u,u) === 0 || dot(v,v) === 0), respectively
         const c1 = (uu === 0) ? 1 : 2 / uu;
         const c2 = (vv === 0) ? 1 : 2 / vv;
         const c3 = c1 * c2 * p5.Vector.dot(u, v);

         const uArr = u.array();
         const vArr = v.array();
         for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
               const delta = (i === j) ? 1 : 0;
               R[i][j] = delta - c1 * uArr[i] * uArr[j] - c2 * vArr[i] * vArr[j] + c3 * vArr[i] * uArr[j];
            }
         }
      } else {
         /* the most common case, unless "from"="to", or "from"=-"to" */

         // without check, c will equal Infinity when 'from' and 'to' vectors are antiparallel (and therefore dot(from, to) === 0)
         const h = ((1 + c) === 0) ? 1 : 1 / (1 + c);
         const v = p5.Vector.cross(from, to);

         // R[0][0] = h * v.x * v.x + c;
         // R[0][1] = h * v.x * v.y - v.z;
         // R[0][2] = h * v.x * v.z + v.y;
         // R[1][0] = h * v.y * v.x + v.z;
         // R[1][1] = h * v.y * v.y + c;
         // R[1][2] = h * v.y * v.z - v.x;
         // R[2][0] = h * v.z * v.x - v.y;
         // R[2][1] = h * v.z * v.y + v.x;
         // R[2][2] = h * v.z * v.z + c;
         const vArr = v.array();
         for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
               const sign = ((i + 1) % 3 === j) ? -1 : 1;
               const delta = (i === j) ? c : vArr[3 - i - j];
               R[i][j] = h * vArr[i] * vArr[j] + sign * delta;
            }
         }
      }

      // [R[0][0], R[0][1], R[0][2], 0,
      //  R[1][0], R[1][1], R[1][2], 0,
      //  R[2][0], R[2][1], R[2][2], 0,
      //  0,       0,       0,       1]
      return (camMatrix) ? [...R[0], 0, ...R[1], 0, ...R[2], 0, 0, 0, 0, 1] : R;
   }

   class Particle {
      constructor(x = 0, y = 0, z = 0, r = 5, props = {}) {
         this.x = x;
         this.y = y;
         this.z = z;
         this.r = r;
         this.props = props;

         this.size = 3;
      }

      *[Symbol.iterator]() {
         yield this.x;
         yield this.y;
         yield this.z;
      }

      toVector() {
         return createVector(...this);
      }

      render(pre, post) {
         push();
         if (pre instanceof Function) pre(this);

         translate(...this);
         // sphere(this.r);

         if (post instanceof Function) post(this);
         pop();
      }
   }

   class LineElement {
      constructor(vInitial, vFinal, props = {}) {
         this.vInitial = vInitial;
         this.vFinal = vFinal
         this.props = props;

         // vector from origin to position of current element (average of vInitial and vFinal)
         this.pos = p5.Vector.add(this.vInitial, this.vFinal).div(2);
         // vector from vInitial to vFinal
         this.dl = p5.Vector.sub(this.vFinal, this.vInitial);

         // rotation matrix with lazy getter
         this._rotationMatrix;
      }

      get rotationMatrix() {
         // cylinders point in +y direction by default
         return this._rotationMatrix || fromToRotation(this.dl, createVector(0, 1, 0));
      }

      drawCylinder(radius = 2, rotateCenter = true) {
         push();

         translate(this.pos);
         if (!rotateCenter) {
            translate(0, this.dl.mag()/2, 0);
         }
         applyMatrix(...this.rotationMatrix);

         cylinder(radius, this.dl.mag());

         pop();
      }
   }

   class Solenoid {
      constructor(L, R, N, n) {
         // length of solenoid
         this.L = L
         // radius of solenoid
         this.R = R;
         // number of turns
         this.N = N;
         // elements per turn
         this.n = n;

         // number of elements
         this.nTotal = this.N * this.n;

         this.elements = [];
         for (let i = 0; i < this.nTotal; i++) {
            const vInitial = (i === 0) ? this.calcPos(i) : this.elements[i-1].vFinal.copy();
            const vFinal = this.calcPos(i+1);
            this.elements.push(new LineElement(vInitial, vFinal, {
               turnIndex: Math.floor(i / this.n)
            }));
         }
      }

      *[Symbol.iterator]() {
         for (let el of this.elements) {
            yield el;
         }
      }

      calcPos(index) {
         const theta = 2 * Math.PI * this.N / this.nTotal;
         const x = this.R * Math.cos(index * theta);
         const y = this.R * Math.sin(index * theta);
         const z = index * this.L / (this.nTotal - 1);
         return createVector(x, y, z);
      }

      render(pre, preParticle, postParticle, post) {
         push();
         if (pre instanceof Function) pre(this);

         // equivalent to  partial(partialRight(fn));
         const particlePartial = fn => solenoid => i => particle => (fn instanceof Function) ? fn.call(null, particle, i, solenoid) : undefined;
         const partialPre = particlePartial(preParticle)(this);
         const partialPost = particlePartial(postParticle)(this);
         this.particles.forEach((particle, i) => particle.render(partialPre(i), partialPost(i)));

         if (post instanceof Function) post(this);
         pop();
      }
   }

   class SphericalHelix {
      constructor(R, N, n) {
         // radius of sphere
         this.R = R;
         // number of turns
         this.N = N;
         // elements per turn
         this.n = n;
         
         // number of elements
         this.nTotal = this.N * this.n;
         // angle ration constant: phi = c * theta
         this.c = 2 * this.N;
         
         this.elements = [];
         for (let i = 0; i < this.nTotal; i++) {
            const vInitial = (i === 0) ? this.calcPos(i) : this.elements[i-1].vFinal.copy();
            const vFinal = this.calcPos(i+1);
            this.elements.push(new LineElement(vInitial, vFinal, {
               turnIndex: Math.floor(i / this.n)
            }));
         }
      }

      *[Symbol.iterator]() {
         for (let el of this.elements) {
            yield el;
         }
      }

      calcPos(index) {
         const theta = rangeElement(index, this.nTotal, 0, Math.PI);
         const x = this.R * Math.sin(theta) * Math.cos(this.c*theta);
         const y = this.R * Math.sin(theta) * Math.sin(this.c*theta);
         const z = this.R * Math.cos(theta);
         return createVector(x, y, z);
      }

      render(pre, preParticle, postParticle, post) {
         push();
         if (pre instanceof Function) pre(this);

         // equivalent to  partial(partialRight(fn));
         const particlePartial = fn => solenoid => i => particle => (fn instanceof Function) ? fn.call(null, particle, i, solenoid) : undefined;
         const partialPre = particlePartial(preParticle)(this);
         const partialPost = particlePartial(postParticle)(this);
         this.particles.forEach((particle, i) => particle.render(partialPre(i), partialPost(i)));

         if (post instanceof Function) post(this);
         pop();
      }
   }

   function calcB(elPos, elVec, testPos, I = 1, sf = 1) {
      // displacement vector from current element to test point
      const r = p5.Vector.sub(testPos, elPos);

      const numerator = p5.Vector.cross(elVec, r);
      const denominator = r.mag()**3;

      return numerator.mult(sf * I / denominator);
   }

   function drawCylinder(v0, v1) {
      const v = p5.Vector.sub(v1, v0);
      const pos = p5.Vector.div(v, 2).add(v0);
      // cylinders point in +y direction by default
      const R = fromToRotation(v, createVector(0, 1, 0));
      const L = v.mag();
      return function (radius = 2, rotateCenter = true) {
         push();

         translate(pos);
         if (!rotateCenter) {
            translate(0, L/2, 0);
         }
         applyMatrix(...R);

         cylinder(radius, L);

         pop();
      };
   }

   function drawArrow(p, v) {
      const R = fromToRotation(v, createVector(0,1,0));
      const cylL = v.mag();
      return function (cylR = p.r, coneR = 2*cylR, coneL = 2*coneR) {
         push();
         
         translate(...p);
         applyMatrix(...R);
         
         push();
         translate(0, cylL/2, 0);
         cylinder(cylR, cylL);
         pop();
         
         push();
         translate(0, cylL + coneL/2, 0);
         cone(coneR, coneL);
         pop();

         pop();
      }
   }

   function getPList(l, m, n, [xi =  0, xf = 100], [yi =  0, yf = 100], [zi =  0, zf = 100]) {
      const Lx = xf - xi;
      const Ly = yf - yi;
      const Lz = zf - zi;
      let list = [];
      let x, y, z;
      for(let i = 0; i < n; i++) {
         z = i * Lz / (n - 1) + zi;
         for(let j = 0; j < m; j++) {
            y = j * Ly / (m - 1) + yi;
            for(let k = 0; k < l; k++) {
               x = k * Lx / (l - 1) + xi;
               const P = new Particle(x, y, z, 2, {B: createVector(0,0,0)});
               list.push(P);
            }
         }
      }
      return list;
   }

   sol = new Solenoid(600, 100, 15, 25);
   sphHelix = new SphericalHelix(200, 15, 25);

   const mult = 1.5;
   const w = mult * sol.R;
   const Lz = mult * sol.L;
   const zi = -(Lz - sol.L)/2;
   const zf = zi + Lz;
   pListSol = getPList(5,5,7, [-w, w], [-w, w], [zi, zf]);
   for (let el of sol) {
      pListSol.forEach(P => {
         const dB = calcB(el.pos, el.dl, P.toVector(), 100);
         P.props.B.add(dB);
      })
   }
   
   const h = sphHelix.R;
   pListSphHelix = getPList(7,7,7, [-h, h], [-h, h], [-h, h]);
   for (let el of sphHelix) {
      pListSphHelix.forEach(P => {
         const dB = calcB(el.pos, el.dl, P.toVector(), 100);
         P.props.B.add(dB);
      })
   }
   
   // noLoop();
}

function draw() {
   lights();
   background('#fafafa');
   orbitControl(2, 2, .1);

   // adjust axes so +x: right, +y: up, +z: towards
   scale(1, -1, 1);
   rotateX(.2);
   rotateY(-.2);

   const origin = [0, 0, 0];
   // axes
   push();
   const len = sol.L / 2;
   stroke('red');
   line(...origin, 2 * len, 0, 0);
   stroke('green');
   line(...origin, 0, 2 * len, 0);
   stroke('blue');
   line(...origin, 0, 0, 2 * len);
   pop();

   push();
   translate(0,0,-sol.L/2);
   normalMaterial();
   sol.elements.forEach(el => {
      push();
      colorMode(HSL);
      const hue = el.props.turnIndex * 360 / (sol.N - 1);
      fill(hue, 80, 60);
      el.drawCylinder();
      pop();
   });
   pop();

   push();
   normalMaterial();
   sphHelix.elements.forEach(el => {
      push();
      colorMode(HSL);
      const hue = el.props.turnIndex * 360 / (sphHelix.N - 1);
      fill(hue, 80, 60);
      el.drawCylinder();
      pop();
   });
   pop();
}

function windowResized() {
   resizeCanvas(windowWidth, windowHeight);
}