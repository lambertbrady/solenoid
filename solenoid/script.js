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

function* rangeGen(start, stop, step = 1, cycles = 1, inclusive = true) {
// function range(...args) {
   // input
   // 1 argument: range(stop) where start is 0
   // 2 or more arguments: range(start, stop, step = 1, cycles = 1)
   // returns inclusive range: [start, ..., stop]

   // 0 arguments provided: throw Error
   if (start === undefined) {
      throw new Error('must provide at least one argument');
   }
   // 1 argument provided: use argument for value of stop
   if (stop === undefined) {
      stop = start;
      start = 0;
   } else {
      // 2 or more arguments provided: validate step, cycles
      if (step === 0) {
         throw new Error('step cannot be 0');
      }
      if (cycles < 0) {
         throw new Error('cycles must be greater than or equal to 0');
      }
   }
   if (start === stop) {
      return [start];
   }
   if (Math.sign(stop - start) !== Math.sign(step)) {
      // equivalent to: if ((stop > start && step < 0) || (stop < start && step > 0)) {...}
      step *= -1;
      console.warn('sign of step value has been flipped to match sign of (stop - start)');
   }

   const n = Math.floor((stop - start) / step) + Number(inclusive);
   const nTotal = Math.floor(n * cycles);
   for (let i = 0; i < nTotal; i++) {
      yield i % n * step + start;
   }
   // return [...Array(nTotal)].map((_, i) => i % n * step + start);
}

function range(start, stop, step, cycles, inclusive) {
   return Array.from(rangeGen(...arguments));
}

function* rangeNGen(n, start, stop, cycles = 1, inclusive = true) {
   if (n === undefined || start === undefined || stop === undefined) {
      throw new Error('must provide at least 3 arguments: n, start, stop');
   }
   if (n <= 0 || !Number.isInteger(n)) {
      throw new Error('n must be an integer greater than 0');
   }
   if (cycles < 0) {
      throw new Error('cycles must be greater than or equal to 0');
   }
   if (start === stop) {
      return [start];
   }
   const step = (stop - start) / (n - Number(inclusive));
   const nTotal = Math.floor(n * cycles);
   for (let i = 0; i < nTotal; i++) {
      yield i % n * step + start;
   }
   // yield* rangeGen(start, stop, step, cycles, inclusive);
   // return [...Array(n)].map((_, i) => i * (stop - start) / (n - 1) + start);
}

function rangeN(n, start, stop, cycles, inclusive) {
   return Array.from(rangeNGen(...arguments));
}

function* eulerMethodGen(yInitial, fn, h = 1, tInitial = 0, tFinal = 4) {
   // fn = y'(y,t) = slope of curve
   let y = yInitial;
   yield y;
   for (let t = tInitial; t < tFinal; t += h) {
      y = y + h * fn(y, t);
      yield y;
   }
}

function eulerMethod(yInitial, fn, h, tInitial, tFinal) {
   return Array.from(eulerMethodGen(...arguments));
}

function* eulerMethodVecGen(yInitial, fn, h = 1, tInitial = 0, tFinal = 4) {
   // fn = y'(y,t) = slope of curve
   let y = yInitial;
   yield y;
   for (let t = tInitial; t < tFinal; t += h) {
      y = p5.Vector.add(y, fn(y, t).mult(h));
      // y = y + h * fn(y, t);
      yield y;
   }
}

function eulerMethodVec(yInitial, fn, h, tInitial, tFinal) {
   return Array.from(eulerMethodVecGen(...arguments));
}

function* heunMethodGen(yInitial, fn, h = 1, tInitial = 0, tFinal = 4) {
   // fn = y'(y,t) = slope of curve
   let y = yInitial;
   yield y;
   const k1 = (y, t) => fn(y, t);
   const k2 = (y, t) => fn(y + k1(y,t), t + h);
   const b1 = 1/2;
   const b2 = 1/2;
   for (let t = tInitial; t < tFinal; t += h) {
      // yApprox = eulerMethodNext(y, fn, h, t);
      // y = y + h/2 * (fn(y, t) +  fn(yApprox, t));
      y = y + h * (b1 * k1(y,t) + b2 * k2(y,t));
      yield y;
   }
}

function heunMethod(yInitial, fn, h, tInitial, tFinal) {
   return Array.from(heunMethodGen(...arguments));
}

function* heunMethodVecGen(yInitial, fn, h = 1, tInitial = 0, tFinal = 4) {
   // fn = y'(y,t) = slope of curve
   let y = yInitial;
   yield y;
   const k1 = (y, t) => fn(y, t);
   const k2 = (y, t) => fn(p5.Vector.add(y, k1(y,t)), t + h);
   // const k2 = (y, t) => fn(y + k1(y,t), t + h);
   const b1 = 1/2;
   const b2 = 1/2;
   for (let t = tInitial; t < tFinal; t += h) {
      const bkSum = p5.Vector.mult(k1(y,t), b1).add(p5.Vector.mult(k2(y,t), b2));
      y = p5.Vector.add(y, bkSum.mult(h));
      // y = y + h * (b1 * k1(y,t) + b2 * k2(y,t));
      yield y;
   }
}

function heunMethodVec(yInitial, fn, h, tInitial, tFinal) {
   return Array.from(heunMethodVecGen(...arguments));
}

function* RK4MethodGen(yInitial, fn, h = 1, tInitial = 0, tFinal = 4) {
   // fn = y'(y,t) = slope of curve
   let y = yInitial;
   yield y;
   const k1 = (y, t) => fn(y, t);
   const k2 = (y, t) => fn(y + k1(y,t)/2, t + h/2);
   const k3 = (y, t) => fn(y + k2(y,t)/2, t + h/2);
   const k4 = (y, t) => fn(y + k3(y,t), t + h);
   const b1 = 1/6;
   const b2 = 1/3;
   const b3 = 1/3;
   const b4 = 1/6;
   for (let t = tInitial; t < tFinal; t += h) {
      y = y + h * (b1 * k1(y,t) + b2 * k2(y,t) + b3 * k3(y,t) + b4 * k4(y,t));
      yield y;
   }
}

function RK4Method(yInitial, fn, h, tInitial, tFinal) {
   return Array.from(RK4MethodGen(...arguments));
}

function* RK4MethodVecGen(yInitial, fn, h = 1, tInitial = 0, tFinal = 4) {
   // fn = y'(y,t) = slope of curve
   let y = yInitial;
   yield y;
   const k1 = (y, t) => fn(y, t);
   const k2 = (y, t) => fn(p5.Vector.add(y, p5.Vector.div(k1(y,t), 2)), t + h/2);
   const k3 = (y, t) => fn(p5.Vector.add(y, p5.Vector.div(k2(y,t), 2)), t + h/2);
   const k4 = (y, t) => fn(p5.Vector.add(y, k3(y,t)), t + h);
   const b1 = 1/6;
   const b2 = 1/3;
   const b3 = 1/3;
   const b4 = 1/6;
   for (let t = tInitial; t < tFinal; t += h) {
      const bk1 = p5.Vector.mult(k1(y,t), b1);
      const bk2 = p5.Vector.mult(k2(y,t), b2);
      const bk3 = p5.Vector.mult(k3(y,t), b3);
      const bk4 = p5.Vector.mult(k4(y,t), b4);
      const bkSum = bk1.add(bk2).add(bk3).add(bk4);
      y = p5.Vector.add(y, bkSum.mult(h));
      // y = y + h * (b1 * k1(y,t) + b2 * k2(y,t));
      yield y;
   }
}

function RK4MethodVec(yInitial, fn, h, tInitial, tFinal) {
   return Array.from(RK4MethodVecGen(...arguments));
}

console.log('------');

let fieldLines;
let drawArrow;
let sol, sphHelix;
let testPointsSol, testPointsSphHelix;
/// P5JS ///
let canvas;
function setup() {
   // +x: right, +y: downw, +z: towards
   canvas = createCanvas(windowWidth, windowHeight, WEBGL);

   function fromToRotation(fromVec, toVec, epsilon = .01, camMatrix = true) {
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

   class Point {
      constructor(x = 0, y = 0, z = 0) {
         this.x = x;
         this.y = y;
         this.z = z;

         // this.size = 3;
      }

      *[Symbol.iterator]() {
         yield this.x;
         yield this.y;
         yield this.z;
      }

      toVector() {
         return createVector(...this);
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

   class Path {
      constructor(...vertices) {
         this.vertices = vertices;
         this._length;
      }

      static create(vertexInitial, numVertices, callback) {
         // callback returns Point
         let vertices = [...Array(numVertices)];
         for (let i = 0; i < numVertices; i++) {
            if (i === 0) {
               vertices[i] = vertexInitial;
            } else {
               vertices[i] = callback(vertices[i-1]);
            }
         }
         return new Path(...vertices);
      }

      *[Symbol.iterator]() {
         for (let vertex of this.vertices) {
            yield vertex;
         }
      }

      get length() {
         return this._length || this.vertices.reduce((length, vertex, i, vertices) => {
               const dl = (i !== 0) ? this.lengthBetween(vertex, vertices[i-1]) : 0;
               return length + dl;
            }, 0);
      }

      lengthBetween(vInitial, vFinal) {
         return p5.Vector.dist(vFinal, vInitial);
      }

      getLineElements(closedPath = false) {
         let lineElements = [];
         this.vertices.forEach((vertex, i, vertices) => {
            const isLastVertex = (i === vertices.length - 1);
            if (isLastVertex && !closedPath) {
               return;
            }
            const vertexNext = isLastVertex ? vertices[0] : vertices[i+1];
            lineElements.push(new LineElement(vertex, vertexNext));
         });
         return lineElements;
      }
   }

   // let path = new Path(createVector(-1,0,5), createVector(1,2,3));
   // console.log(path);
   // console.log(path.length);
   // console.log(path.getLineElements());
   // const getB = vec => createVector(1,0,0);
   // const cb = (dx, vec) => createVector(vec.x + getB(vec).x * dx);
   // const callbackFn = partial(cb);
   // // const callbackFn = (dx) => point => new Point(point.x + dx);
   // const vi = createVector();
   // const nn = 10;
   // let pathCreated = Path.create(vi, nn, callbackFn(2));
   // console.log(pathCreated);
   // console.log(pathCreated.length);

   class Solenoid {
      constructor(L, R, numTurns, n) {
         // length of solenoid
         this.L = L
         // radius of solenoid
         this.R = R;
         // number of turns
         this.numTurns = numTurns;
         // elements per turn
         this.n = n;

         // number of elements
         this.nTotal = this.numTurns * this.n;

         this.elements = [];
         this.vertices = []
         const thetaList = rangeN(this.n, 0, 2*Math.PI, this.numTurns, false);
         thetaList.push(2*Math.PI);
         const zGen = rangeNGen(this.nTotal + 1, 0, this.L);
         // const zList = rangeN(this.nTotal + 1, 0, this.L);
         for (let i = 0; i < this.nTotal + 1; i++) {
            const theta = thetaList[i];
            const x = this.R * Math.cos(theta);
            const y = this.R * Math.sin(theta);
            const z = zGen.next().value;
            // const z = zList[i];
            const vertex = createVector(x, y, z);
            this.vertices.push(vertex);
            if (i !== 0) {
               const vInitial = this.vertices[i-1];
               const vFinal = vertex;
               this.elements.push(new LineElement(vInitial, vFinal, {turnIndex: Math.floor((i-1) / this.n)}));
            }
         }
      }

      *[Symbol.iterator]() {
         for (let el of this.elements) {
            yield el;
         }
      }
   }

   class SphericalHelix {
      constructor(R, numTurns, n) {
         // radius of sphere
         this.R = R;
         // number of turns
         this.numTurns = numTurns;
         // elements per turn
         this.n = n;
         
         // number of elements
         this.nTotal = this.numTurns * this.n;
         // angle ratio constant: phi = c * theta
         this.c = 2 * this.numTurns;
         
         this.elements = [];
         //TODO: refactor to match Solenoid
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
         const theta = index * (Math.PI - 0) / (this.nTotal - 1) + 0;
         // const theta = rangeElement(index, this.nTotal, 0, Math.PI);
         const x = this.R * Math.sin(theta) * Math.cos(this.c*theta);
         const y = this.R * Math.sin(theta) * Math.sin(this.c*theta);
         const z = this.R * Math.cos(theta);
         return createVector(x, y, z);
      }
   }

   function calcB(observationPos, sourcePos, lineElement, I = 1, scaleFactor = 1) {
      // displacement vector from source element to observation point
      const r = p5.Vector.sub(observationPos, sourcePos);

      return p5.Vector.cross(lineElement, r).mult(scaleFactor * I / r.mag()**3);
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

   drawArrow = function(arrowVector, position = createVector(0,0,0)) {
      const cylinderOrientation = createVector(0,1,0);
      const R = fromToRotation(arrowVector, cylinderOrientation);
      const cylinderLength = arrowVector.mag();
      return function (cylinderRadius = 3, coneRadius = 1.5 * cylinderRadius, coneLength = 2 * coneRadius) {
         push();
         
         translate(position);
         applyMatrix(...R);
         
         push();
         translate(0, cylinderLength/2, 0);
         cylinder(cylinderRadius, cylinderLength);
         pop();
         
         push();
         translate(0, cylinderLength + coneLength/2, 0);
         cone(coneRadius, coneLength);
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
               const P = new Point(x, y, z);
               P.B = createVector(0,0,0);
               list.push(P);
            }
         }
      }
      return list;
   }

   
   sol = new Solenoid(400, 50, 50, 15);
   const mult = 1.5;
   const w = mult * sol.R;
   const Lz = mult * sol.L;
   const zi = -(Lz - sol.L)/2;
   const zf = zi + Lz;
   testPointsSol = getPList(5,5,7, [-w, w], [-w, w], [zi, zf]);
   for (let testPoint of testPointsSol) {
      const testPointVector = testPoint.toVector();
      // loop through every test point
      for (let fieldElement of sol) {
         // add up differential contributions to B from every element of solenoid
         const dB = calcB(testPointVector, fieldElement.pos, fieldElement.dl, 100);
         testPoint.B.add(dB);
      }
      testPoint.renderArrow = drawArrow(testPoint.B);
   }

   const cb = (solenoid, dx, vertex) => {
      let B = createVector(0,0,0);
      // add up differential contributions to B from every element of solenoid
      for (let fieldElement of solenoid) {
         const dB = calcB(vertex, fieldElement.pos, fieldElement.dl, 100);
         B.add(dB);
      }
      // vertex.B = B;
      const Bhat = B.copy().normalize();
      return p5.Vector.add(vertex, Bhat.mult(dx));
   };
   const callbackFn = partial(cb);
   const numVertices = 100;
   const d = .8*sol.R;
   const zVal = sol.L/2;
   const vi0 = createVector(0,0,zVal);
   const vi1 = createVector(0,d,zVal);
   const vi2 = createVector(d,0,zVal);
   const vi3 = createVector(-d,0,zVal);
   const vi4 = createVector(0,-d,zVal);
   let vArr = [vi0, vi1, vi2, vi3, vi4];
   // const fl0 = Path.create(vi0, numVertices, callbackFn(sol, dx));
   // const fl1 = Path.create(vi1, numVertices, callbackFn(sol, dx));
   // const fl2 = Path.create(vi2, numVertices, callbackFn(sol, dx));
   // const fl3 = Path.create(vi3, numVertices, callbackFn(sol, dx));
   // const fl4 = Path.create(vi4, numVertices, callbackFn(sol, dx));
   // fieldLines = [fl0, fl1, fl2, fl3, fl4];

   const calcBSum = (solenoid) => (y, t) => {
      let B = createVector();
      for (let el of solenoid) {
         B.add(calcB(y, el.pos, el.dl, 100));
      }
      const Bhat = B.copy().normalize();
      return Bhat;
   };
   // fieldLines = vArr.map(v => eulerMethodVec(v, calcBSum(sol), 5, 0, 1000).filter((_, index) => index % 10 === 0));
   fieldLinesH = vArr.map(v => heunMethodVec(v, calcBSum(sol), 5, 0, 1000).filter((_, index) => index % 10 === 0));
   // fieldLinesRK4 = vArr.map(v => RK4MethodVec(v, calcBSum(sol), 5, 0, 1000).filter((_, index) => index % 10 === 0));

   // sphHelix = new SphericalHelix(200, 15, 25);
   // const h = sphHelix.R;
   // testPointsSphHelix = getPList(7,7,7, [-h, h], [-h, h], [-h, h]);
   // for (let fieldElement of sphHelix) {
   //    testPointsSphHelix.forEach(testPoint => {
   //       const dB = calcB(testPoint.toVector(), fieldElement.pos, fieldElement.dl, 100);
   //       testPoint.B.add(dB);
   //    })
   // }
   
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
   // push();
   // const len = sol.L / 2;
   // stroke('red');
   // line(...origin, 2 * len, 0, 0);
   // stroke('green');
   // line(...origin, 0, 2 * len, 0);
   // stroke('blue');
   // line(...origin, 0, 0, 2 * len);
   // pop();

   push();
   translate(0,0,-sol.L/2);
   normalMaterial();
   // sol.vertices.forEach((v,i) => {
   //    push();
   //    fill('black');
   //    translate(v.x, v.y, v.z);
   //    sphere(3)
   //    pop();
   // });
   sol.elements.forEach(el => {
      push();
      colorMode(HSL);
      const hue = el.props.turnIndex * 360 / (sol.numTurns - 1);
      fill(hue, 80, 60);
      el.drawCylinder();
      pop();
   });
   // fieldLines.forEach(fieldLine => {
   //    push();
   //    noFill();
   //    stroke('red');
   //    beginShape()
   //    for (const v of fieldLine) {
   //       vertex(v.x, v.y, v.z);
   //    }
   //    endShape()
   //    pop();
   // })
   fieldLinesH.forEach(fieldLine => {
      push();
      noFill();
      stroke('blue');
      beginShape()
      for (const v of fieldLine) {
         vertex(v.x, v.y, v.z);
      }
      endShape();
      pop();
   })
   // fieldLinesRK4.forEach(fieldLine => {
   //    push();
   //    // normalMaterial();
   //    noFill();
   //    stroke('cyan');
   //    beginShape()
   //    for (const v of fieldLine) {
   //       vertex(v.x, v.y, v.z);
   //    }
   //    endShape();
   //    pop();
   // })
   // testPointsSol.forEach(p => {
   //    push();
   //    translate(p.x, p.y, p.z);
   //    p.renderArrow();
   //    pop();
   // })
   pop();

   push();
   normalMaterial();
   // sphHelix.elements.forEach(el => {
   //    push();
   //    colorMode(HSL);
   //    const hue = el.props.turnIndex * 360 / (sphHelix.numTurns - 1);
   //    fill(hue, 80, 60);
   //    el.drawCylinder();
   //    pop();
   // });
   // testPointsSphHelix.forEach(p => {
   //    push();
   //    translate(...p);
   //    drawArrow(p.B)();
   //    pop();
   // })
   pop();
}

function windowResized() {
   resizeCanvas(windowWidth, windowHeight);
}