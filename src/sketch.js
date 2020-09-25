import p5 from 'p5'
import { Point, Solenoid } from './utils/p5-shapes'
import { drawArrow } from './utils/p5-draw'
import RungeKuttaMethod from './utils/runge-kutta-method'
import InitialValueProblem from './utils/initial-value-problem'
import { RK4MethodVec } from './utils/rk-methods-vec'

// Euler Method: only consistent method with 1 stage
const EulerMethod = new RungeKuttaMethod('euler')
console.log(EulerMethod)
// const MidpointMethod = new RungeKuttaMethod('midpoint')
// const RK4Method1 = new RungeKuttaMethod('rk4')
///////
const y0 = 1
// const h = 1
const tRange = [1, 4]
const rkFunc = (y) => y
const rkFuncArr = (y) => [y[0] + y[1], y[1], y[2]]
// const test = limitIterable(EulerMethod.makeIterator(rkFunc, y0, 1, 5), 4);
console.log('---')
const IVP = new InitialValueProblem(rkFunc, y0, ...tRange)
// const solutionArr1 = IVP.solve('euler', 0.5)
const solutionIterator1 = IVP.makeIterator('euler', 0.5)
// const solutionArr2 = IVP.solve('euler', 1)
const solutionIterator2 = IVP.makeIterator('euler', 1)
for (let val of solutionIterator1) {
  console.log(val)
}
for (let val of solutionIterator2) {
  console.log(val)
}
const IVPVec = new InitialValueProblem(rkFuncArr, [1, 2, 0.5], ...tRange)
const solutionIterator3 = IVPVec.makeIterator('euler', 1)
for (const vec of solutionIterator3) {
  console.log(vec)
}

// const emClassGen = EulerMethod.makeIterator(rkFunc, y0, tRange, h)
// const emClassGen1 = EulerMethod.makeIterator(rkFunc, y0, tRange, h)
// console.log(emClassGen);
// console.log(emClassGen.next());
// console.log(emClassGen1.next());
// const em = buildRungeKutta(1, [], [], [1])(y0, rkFunc, h, ...tRange)
// console.log(em.next());
// console.log(em.next());
// console.log(em.next());
// console.log(em.next());
// console.log(em.next());
// // Midpoint Method
// const mm = buildRungeKutta(2, [0.5], [[0.5]], [0, 1])(y0, rkFunc, h, ...tRange)
// console.log(mm.next());
// console.log(mm.next());
// console.log(mm.next());
// console.log(mm.next());
// console.log(mm.next());
// // Heun Method
// buildRungeKutta(2, [1], [[1]], [.5, .5]);
// // Ralston Method
// buildRungeKutta(2, [2/3], [[2/3]], [.25, .75]);
// // RK4 Method
// const rk4 = buildRungeKutta(
//   4,
//   [0.5, 0.5, 1],
//   [[0.5], [0, 0.5], [0, 0, 1]],
//   [0.167, 0.333, 0.333, 0.167]
// )(y0, rkFunc, h, ...tRange)
// console.log(rk4.next());
// console.log(rk4.next());
// console.log(rk4.next());
// console.log(rk4.next());
// console.log(rk4.next());
// buildRungeKutta(4, [.5, .5, 1], [[.5], [0, .5], [0, 0, 1]], [.167, .333, .333, .167]);

function calcB(observationPos, sourcePos, lineElement, I = 1, scaleFactor = 1) {
  // displacement vector from source element to observation point
  const r = p5.Vector.sub(observationPos, sourcePos)

  return p5.Vector.cross(lineElement, r).mult((scaleFactor * I) / r.mag() ** 3)
}

function getPList(
  l,
  m,
  n,
  [xi = 0, xf = 100],
  [yi = 0, yf = 100],
  [zi = 0, zf = 100]
) {
  const Lx = xf - xi
  const Ly = yf - yi
  const Lz = zf - zi
  let list = []
  let x, y, z
  for (let i = 0; i < n; i++) {
    z = (i * Lz) / (n - 1) + zi
    for (let j = 0; j < m; j++) {
      y = (j * Ly) / (m - 1) + yi
      for (let k = 0; k < l; k++) {
        x = (k * Lx) / (l - 1) + xi
        const P = new Point(x, y, z)
        P.B = new p5.Vector(0, 0, 0)
        list.push(P)
      }
    }
  }
  return list
}

console.log('------')

let fieldLinesRK4
let sol
// let sphHelix
let testPointsSol
// let testPointsSphHelix
/// P5JS ///

export default function sketch(p) {
  p.setup = () => {
    // +x: right, +y: downw, +z: towards
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL)

    sol = new Solenoid(400, 50, 30, 15)
    const mult = 1.5
    const w = mult * sol.R
    const Lz = mult * sol.L
    const zi = -(Lz - sol.L) / 2
    const zf = zi + Lz
    testPointsSol = getPList(5, 5, 7, [-w, w], [-w, w], [zi, zf])
    for (let testPoint of testPointsSol) {
      const testPointVector = testPoint.toVector()
      // loop through every test point
      for (let fieldElement of sol) {
        // add up differential contributions to B from every element of solenoid
        const dB = calcB(
          testPointVector,
          fieldElement.pos,
          fieldElement.dl,
          100
        )
        testPoint.B.add(dB)
      }
      testPoint.renderArrow = drawArrow(testPoint.B)
    }

    // const cb = (solenoid, dx, vertex) => {
    //   let B = createVector(0, 0, 0)
    //   // add up differential contributions to B from every element of solenoid
    //   for (let fieldElement of solenoid) {
    //     const dB = calcB(vertex, fieldElement.pos, fieldElement.dl, 100)
    //     B.add(dB)
    //   }
    //   // vertex.B = B;
    //   const Bhat = B.copy().normalize()
    //   return p5.Vector.add(vertex, Bhat.mult(dx))
    // }
    // const callbackFn = partial(cb)
    // const numVertices = 100
    const d = 0.8 * sol.R
    const zVal = sol.L / 2
    const vi0 = p.createVector(0, 0, zVal)
    const vi1 = p.createVector(0, d, zVal)
    const vi2 = p.createVector(d, 0, zVal)
    const vi3 = p.createVector(-d, 0, zVal)
    const vi4 = p.createVector(0, -d, zVal)
    let vArr = [vi0, vi1, vi2, vi3, vi4]
    // const fl0 = Path.create(vi0, numVertices, callbackFn(sol, dx));
    // const fl1 = Path.create(vi1, numVertices, callbackFn(sol, dx));
    // const fl2 = Path.create(vi2, numVertices, callbackFn(sol, dx));
    // const fl3 = Path.create(vi3, numVertices, callbackFn(sol, dx));
    // const fl4 = Path.create(vi4, numVertices, callbackFn(sol, dx));
    // fieldLines = [fl0, fl1, fl2, fl3, fl4];

    const calcBSum = (solenoid) => (y) => {
      let B = p.createVector()
      for (let el of solenoid) {
        B.add(calcB(y, el.pos, el.dl, 100))
      }
      const Bhat = B.copy().normalize()
      return Bhat
    }
    // fieldLines = vArr.map(v => eulerMethodVec(v, calcBSum(sol), 5, 0, 1000).filter((_, index) => index % 10 === 0));
    // fieldLinesH = vArr.map(v => heunMethodVec(v, calcBSum(sol), 5, 0, 1000).filter((_, index) => index % 10 === 0));
    fieldLinesRK4 = vArr.map((v) =>
      RK4MethodVec(v, calcBSum(sol), 5, 0, 1000).filter(
        (_, index) => index % 10 === 0
      )
    )

    // sphHelix = new SphericalHelix(200, 15, 25);
    // const h = sphHelix.R;
    // testPointsSphHelix = getPList(7,7,7, [-h, h], [-h, h], [-h, h]);
    // for (let fieldElement of sphHelix) {
    //    testPointsSphHelix.forEach(testPoint => {
    //       const dB = calcB(testPoint.toVector(), fieldElement.pos, fieldElement.dl, 100);
    //       testPoint.B.add(dB);
    //    })
    // }

    // p.noLoop()
  }

  p.draw = () => {
    p.lights()
    p.background('#fafafa')
    p.orbitControl(2, 2, 0.1)

    // adjust axes so +x: right, +y: up, +z: towards
    p.scale(1, -1, 1)
    p.rotateX(0.2)
    p.rotateY(-0.2)

    // const origin = [0, 0, 0]
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

    p.push()
    p.translate(0, 0, -sol.L / 2)
    p.normalMaterial()
    // sol.vertices.forEach((v,i) => {
    //    push();
    //    fill('black');
    //    translate(v.x, v.y, v.z);
    //    sphere(3)
    //    pop();
    // });
    sol.elements.forEach((el) => {
      p.push()
      p.colorMode(p.HSL)
      const hue = (el.props.turnIndex * 360) / (sol.numTurns - 1)
      p.fill(hue, 80, 60)
      el.drawCylinder()(p)
      // drawCylinder(el.vInitial, el.vFinal)()(p)
      p.pop()
    })
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
    // fieldLinesH.forEach(fieldLine => {
    //    push();
    //    noFill();
    //    stroke('blue');
    //    beginShape()
    //    for (const v of fieldLine) {
    //       vertex(v.x, v.y, v.z);
    //    }
    //    endShape();
    //    pop();
    // })
    fieldLinesRK4.forEach((fieldLine) => {
      p.push()
      // normalMaterial();
      p.noFill()
      p.stroke('black')
      p.beginShape()
      for (const v of fieldLine) {
        p.vertex(v.x, v.y, v.z)
      }
      p.endShape()
      p.pop()
    })
    // testPointsSol.forEach(p => {
    //    push();
    //    translate(p.x, p.y, p.z);
    //    p.renderArrow();
    //    pop();
    // })
    p.pop()

    p.push()
    p.normalMaterial()
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
    p.pop()
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
  }
}
