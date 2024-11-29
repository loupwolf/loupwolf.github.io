/* eslint-disable no-undef, no-unused-vars */
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
class Robot {
  constructor(pt, spd) {
    this.point = pt;
    this.x = pt.x;
    this.y = pt.y;
    this.speed = spd; // pixels per ms
  }
  disp() {
    stroke("blue");
    rect(this.x - 2.5, this.y - 2.5, 5, 5);
    stroke("black");
  }
  update(pt) {
    this.point = pt;
    this.x = pt.x;
    this.y = pt.y;
  }
  async goToEnd(goal, yTether, xTether) {
    let Xinit = this.x;
    let Yinit = this.y;

    let goalTether = yTether.getVces();
    let anchorTether = xTether.getVces();
    console.log("anchor tether: ", JSON.stringify(anchorTether));
    console.log("goal tether: ", JSON.stringify(goalTether));
    console.log("goal point: ", JSON.stringify(goal));
    let next = goalTether.pop();
    let d = distEuc(this.point, next);
    let t = d / this.speed;
    let step = new Point((next.x - Xinit) / 100, (next.y - Yinit) / 100);
    while (next.x != goal.x && next.y != goal.y) {
      //console.log("next: ", JSON.stringify(next));
      for (let i = 1; i < 101; i++) {
        // the robot goes to next point in time t in 100 steps
        let p = new Point(Xinit + step.x * i, Yinit + step.y * i);
        this.update(p);
        await sleep(t / 100);
      }
      Xinit = this.x;
      Yinit = this.y;
      yTether.pop();
      next = goalTether.pop();
      d = distEuc(this.point, next);
      t = d / this.speed;
      step = new Point((next.x - Xinit) / 100, (next.y - Yinit) / 100);
    }
    for (let i = 1; i < 101; i++) {
      // the robot goes to next point in time t in 100 steps
      this.update(new Point(Xinit + step.x * i, Yinit + step.y * i));
      await sleep(t / 100);
    }
    yTether.pop();
  }
}

class simpPolygon {
  checkPolygon(lst) {
    // processes the points by checking if they constitute a simple polygon i.e. no line intersections
    // If they do, then the algorithm arranges them in counterclockwise order so as to later enable ear-finding
    if (lst.length < 3) {
      // ensures there is at least 3 points to from a polygon
      return [];
    }

    // first edge points[0]-points[1] diserve special treatment as second edge can't be points[n-1]-points[0] since overlapping with first
    let edge1 = [lst[0], lst[1]];
    for (let j = 2; j < lst.length - 1; j++) {
      let edge2 = [lst[j], lst[j + 1]];
      if (this.intersct(edge1, edge2) == true) {
        // if an intersection is found, not a simple polygon
        message = "Not a simple polygon";
        ISPOLYGON = false;
        return;
      }
    }
    // all other non-consecutive edge pairs are treated generally
    for (let i = 1; i < lst.length - 2; i++) {
      let edge1 = [lst[i], lst[i + 1]];
      for (let j = i + 2; j < lst.length; j++) {
        let edge2 = [lst[j], lst[(j + 1) % lst.length]];
        if (this.intersct(edge1, edge2) == true) {
          // if an intersection is found, not a simple polygon
          return;
        }
      }
    }
    lst = this.CCW(lst); // arranges the points in CCW order

    return lst;
  }
  CCW(pts) {
    // checks based on signed area if a list of points constituting a simple polygon is ordered counterclockwise, if no, reverts the ordering

    let sA = this.signedArea(pts);

    if (sA == true) {
      message = "counterclockwise order";
    } else {
      message = "clockwise order...fixing in progress";
      let newpts = [];
      for (let i = pts.length - 1; i >= 0; i--) {
        newpts.push(pts[i]);
      }
      pts = newpts;
      message = "clockwise order...fixing in progress...done";
    }
    return pts;
  }
  signedArea(pts) {
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
      let current = pts[i];
      let next = pts[(i + 1) % pts.length];
      sum += (next.x - current.x) * (next.y + current.y);
    }
    return sum > 0; // true if CCW, false if CW
  }
  intersct(e1, e2) {
    // evaluates whether two non-consecutive edges intersect (from "introduction to algorithms" - MIT press)
    let d1 = this.determinant(e2[0], e2[1], e1[0]);
    let d2 = this.determinant(e2[0], e2[1], e1[1]);
    let d3 = this.determinant(e1[0], e1[1], e2[0]);
    let d4 = this.determinant(e1[0], e1[1], e2[1]);
    if (d1 * d2 < 0 && d3 * d4 < 0) {
      return true;
    } else if (d1 == 0 && this.onSegment(e2[0], e2[1], e1[0])) {
      return true;
    } else if (d2 == 0 && this.onSegment(e2[0], e2[1], e1[1])) {
      return true;
    } else if (d3 == 0 && this.onSegment(e1[0], e1[1], e2[0])) {
      return true;
    } else if (d4 == 0 && this.onSegment(e1[0], e1[1], e2[1])) {
      return true;
    } else {
      return false;
    }
  }
  onSegment(pi, pj, pk) {
    // determines whether a point known to be colinear with a segment lies on that segment (from "introduction to algorithms" - MIT press)
    if (
      Math.min(pi[0], pj[0]) <= pk[0] &&
      pk[0] <= Math.max(pi[0], pj[0]) &&
      Math.min(pi[1], pj[1]) <= pk[1] &&
      pk[1] <= Math.max(pi[1], pj[1])
    ) {
      return true;
    } else {
      return false;
    }
  }
  determinant(a, b, c) {
    if (a && b && c) {
      return a.x * (b.y - c.y) - a.y * (b.x - c.x) + (c.y * b.x - c.x * b.y);
    } else {
      console.log("undefined points");
    }
  }
}

class Obstacle extends simpPolygon {
  constructor(l) {
    super();
    if (l.length >= 3) {
      this.points = this.checkPolygon(l); // Check if points form a simple polygon
      this.len = this.points.length;
      this.triangles = this.triangulate(Array.from(this.points)); // passes a copy as the function's argument
    } else {
      this.points = [];
      this.len = 0;
      this.triangles = [];
    }
  }
  disp() {
    fill(0, 0, 0); // Set fill color to black
    beginShape(); // Start drawing the shape
    for (let point of this.points) {
      vertex(point.x, point.y); // Use vertex() for each point
    }
    endShape(CLOSE); // Close the shape
    fill(0, 0, 0);
  }

  getLst() {
    return this.points; // Return the list of points
  }
  getLstClockwise() {
    return this.points.slice().reverse(); // Return the list of points in reverse, clockwise order
  }
  getLen() {
    return this.len; // Return the length of the list
  }

  getTriangles() {
    return this.triangles;
  }

  triangulate(pts) {
    let trgls = [];
    if (pts.length == 3) {
      console.log("is a triangle");
      // The polygon is a triangle
      trgls.push(pts);
      console.log("Pushed triangle");
    } else if (pts.length >= 4) {
      for (let p = 0; p <= pts.length - 1; p++) {
        // iterates over every vertex of the polygon to check if it is an ear
        if (this.checkEar(p, pts) == true) {
          // if it is an ear, push it in the triangles list
          trgls.push([
            pts[p],
            pts[(p + 1) % pts.length],
            pts[(p - 1 + pts.length) % pts.length],
          ]);
          pts.splice(p, 1); // remove the ear from the polygon
          break; // ear found, break the for loop
        }
      }
      trgls = this.triangulateFurther(pts, trgls); // triangulates the remaining polygon
    }
    return trgls;
  }

  triangulateFurther(pts, trgls) {
    if (pts.length == 3) {
      // The polygon is a triangle
      trgls.push(pts);
      return trgls;
    } else {
      // the remaining polygon has got more than 3 vertices
      let found = false; // new ear found
      let p = 0;
      while (!found) {
        if (this.checkEar(p, pts) == true) {
          // if the point is an ear, push in triangles list
          trgls.push([
            pts[p],
            pts[(p + 1) % pts.length],
            pts[(p - 1 + pts.length) % pts.length],
          ]);
          pts.splice(p, 1); // remove the ear from the polygon
          found = true;
        }
        p++;
      }
      trgls = this.triangulateFurther(pts, trgls); // recursively triangulate the remaining polygon
    }
    return trgls;
  }

  checkEar(p, pts) {
    // checks if the point p is an ear by seeing if p is convex and p-1,p,p+1 doesn't contain any other point
    // disclosure: aided by automatic code generation for syntax-specific concerns
    const prev = pts[(p - 1 + pts.length) % pts.length];
    const current = pts[p];
    const next = pts[(p + 1) % pts.length];

    // Check if the triangle prev-current-next is convex
    if (super.determinant(prev, current, next) > 0) {
      return false; // Not convex, not an ear
    }

    // Check if any other point is inside the triangle
    for (let i = 0; i < pts.length; i++) {
      if (
        i == p ||
        i == (p - 1 + pts.length) % pts.length ||
        i == (p + 1) % pts.length
      ) {
        continue; // Skip the vertices of the triangle
      }

      if (this.isPointInTriangle(prev, current, next, pts[i])) {
        return false; // Found a point inside the triangle
      }
    }

    return true; // It's an ear
  }

  inside(p, q) {
    let pt = new Point((p.x + q.x) / 2, (p.y + q.y) / 2);
    let isInside = false;
    for (let t of this.triangles) {
      if (this.isPointInTriangle(t[0], t[1], t[2], pt) === true) {
        isInside = true;
        break;
      }
    }
    return isInside;
  }

  complies(ob2) {
    // given an other obstacle, checks whether they are in superposition
    let P1 = this.points;
    let P2 = ob2.getLst();
    for (let i = 0; i < this.len; i++) {
      // a point of the first is included inside the second
      if (ob2.inside(P1[i], P1[i]) == true) {
        return false;
      }
    }
    for (let i = 0; i < ob2.getLen(); i++) {
      // a point of the second is included inside the first
      if (this.inside(P2[i], P2[i]) == true) {
        return false;
      }
    }
    for (let i = 0; i < this.len; i++) {
      for (let j = 0; j < ob2.getLen(); j++) {
        let e1 = [P1[i], P1[(i + 1) % this.len]];
        let e2 = [P2[j], P2[(j + 1) % this.len]];
        // two of the polygon's edges intersect
        if (super.intersct(e1, e2)) {
          return false;
        }
      }
    }
    return true;
  }

  isPointInTriangle(a, b, c, p) {
    let d1 = super.determinant(a, b, p);
    let d2 = super.determinant(b, c, p);
    let d3 = super.determinant(c, a, p);

    // Check if all determinants are either positive or negative (inside triangle)
    if ((d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0)) {
      return true;
    }
    return false;
  }

  isectLine(line) {
    for (let i = 0; i < this.len; i++) {
      let obline = [this.points[i], this.points[(i + 1) % this.len]];
      if (this.intersct(obline, line) == true) {
        return true;
      }
    }
    return false;
  }
}

class Tether {
  constructor(iPt, fPt, vces, ocles, collisionOff = false, w = 3, c = "blue") {
    // input: compliant initial and final points, set of intermediate vertices, set of obstacles

    this.polyLine = []; // the tether is represented by a polyline
    this.lengths = []; // Euclidean lengths of each line segement
    this.Vces = [iPt, ...vces, fPt];
    this.len = 2 + vces.length; // number of vertices in the polyline
    this.lastFeasible = null;
    this.L = 0;
    this.initial = iPt;
    this.final = fPt;
    this.width = w;
    this.color = c;
    // Define the complete set of points (start, intermediate, end)
    const points = this.Vces;

    // Iterate through consecutive pairs of points
    for (let i = 0; i < points.length - 1; i++) {
      const lineSegment = [points[i], points[i + 1]];

      // Check for intersections with each obstacle
      if (!collisionOff && this.checkForIntersections(lineSegment, ocles)) {
        throw new TypeError("Intersection detected with obstacle");
      }

      this.polyLine.push(lineSegment);
      this.lengths.push(distEuc(lineSegment[0], lineSegment[1]));
    }

    this.L = this.lengths.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );
  }

  insertPt(pt, idx) {
    this.Vces = this.Vces.slice(0, idx + 1)
      .concat([pt])
      .concat(this.Vces.slice(idx + 1, this.len));

    this.lengths = this.lengths
      .slice(0, idx)
      .concat([
        distEuc(this.polyLine[idx][0], pt),
        distEuc(pt, this.polyLine[idx][1]),
      ])
      .concat(this.lengths.slice(idx + 1, this.len));

    this.polyLine = this.polyLine
      .slice(0, idx)
      .concat([
        [this.polyLine[idx][0], pt],
        [pt, this.polyLine[idx][1]],
      ])
      .concat(this.polyLine.slice(idx + 1, this.len));

    this.len = this.Vces.length;
  }

  pop() {
    let lastVtx = this.Vces[this.len - 1];
    this.Vces = this.Vces.slice(0, this.len - 1);

    this.L = this.L - this.lengths[this.len];
    this.lengths = this.lengths.slice(0, this.len - 1);

    this.polyLine = this.polyLine.slice(0, this.len - 1);

    this.len = this.Vces.length;

    return lastVtx;
  }

  push(pt) {
    this.lengths = this.lengths.concat(distEuc(this.head(), pt));

    this.polyLine = this.polyLine.concat([[this.head(), pt]]);

    this.Vces = this.Vces.concat([pt]);

    this.len = this.Vces.length;
  }

  checkForIntersections(lineSegment, ocles) {
    return ocles.some((ob) => ob.isectLine(lineSegment) === true);
  }

  disp() {
    stroke(this.color);
    strokeWeight(this.width);
    //strokeWeight(1);
    this.polyLine.forEach(([start, end]) => {
      line(start.x, start.y, end.x, end.y); // Draw line between points
    });
    strokeWeight(1);
    stroke(0, 0, 0);
  }
  getVces() {
    return this.Vces;
  }
  getLengths() {
    return this.lengths;
  }
  getL() {
    return this.L;
  }
  getLines() {
    return this.polyLine;
  }
  setLastFeasible(pT) {
    this.lastFeasible = pT;
  }
  head() {
    return this.Vces[this.len - 1];
  }
}

var freePoints = []; // unassigned points
var obstacles = []; // list of polygonal obstacles
var shortestPath = []; // list of consecutive points between START & END points forming the shortest path
var shPathConstrt = [];
var homotopy = [];
var Gvis = []; // visibility graph in the form of an 2D adjacency matrix
var visEdges = []; // visibility edges in the form of point pairs
var triangulation = []; // triangulation of the environment in the form of a list a point triples
var sleeve = null; // sleeve as a list of ordered triangles on which to perform the funnel algorithm for shortest homotopic path finding
var START = null; // starting point of the robot
var END = null; // end point of the robot
var ANCHOR = null; // anchor for the Tether
var tether = null; // the tether is an instance of the Tether class that will be initialized in setTether
var X = null; // retracted tether from anchor to start
var Y = null; // retracted tether from start to end
var Z = null; // retracted tether from anchor to end
var message = "";
var showVG = false;
var showSP = false;
var showHomo = false;
var showTetherInit = true;
var buttons = []; // list of the buttons
var outerPolygon = []; // outer polygon with vertices given in counterclockwise order
var robot = null;

function setup() {
  createCanvas(windowWidth, 600); // Make the canvas smaller to ensure buttons are visible
  fill("black");
  textSize(20);

  // Clear button
  clearButton = createButton("Clear");
  clearButton.position(30, 85);
  clearButton.mousePressed(resetpoints);
  buttons.push(clearButton);

  // Obstacle button
  obButton = createButton("New obstacle");
  obButton.position(30, 115);
  obButton.mousePressed(createObstacle);
  buttons.push(obButton);

  // start button
  startButton = createButton("START");
  startButton.position(30, 145);
  startButton.mousePressed(setStart);
  buttons.push(startButton);

  // end button
  endButton = createButton("END");
  endButton.position(30, 175);
  endButton.mousePressed(setEnd);
  buttons.push(endButton);

  vgButton = createButton("ANCHOR");
  vgButton.position(30, 205);
  vgButton.mousePressed(setAnchor);
  buttons.push(vgButton);

  spButton = createButton("TETHER");
  spButton.position(30, 235);
  spButton.mousePressed(setTether);
  buttons.push(spButton);

  console.log("Buttons created");
}
function draw() {
  // Fond
  background(200);

  // Graphe de visibilité
  if (showVG == true) {
    drawEdges(visEdges, color(0.625 * 255, 0.625 * 255, 0.625 * 255));
  }

  // Points libres
  for (let i in freePoints) {
    ellipse(freePoints[i].x, freePoints[i].y, 4, 4);
  }

  // Obstacles
  obstacles.forEach((obstacle) => {
    obstacle.disp();
  });

  if (tether !== null && showTetherInit == true) {
    tether.disp();
  }

  if (Y !== null) {
    Y.disp();
  }

  if (Z !== null) {
    Z.disp(Z.color);
  }

  if (X !== null) {
    X.disp();
  }

  // Plus court chemin
  if (showSP == true) {
    drawEdges(shortestPath, "green");
  }

  // Plus court chemin homotopique
  if (showHomo == true) {
    drawEdges(homotopy, "blue");
  }

  // Points de départ, arrivée et ancrage
  if (START !== null) {
    fill(0, 255, 0);
    ellipse(START.x, START.y, 10, 10);
    fill(0, 0, 0);
  }
  if (END !== null) {
    fill(255, 0, 0);
    ellipse(END.x, END.y, 10, 10);
    fill(0, 0, 0);
  }
  if (ANCHOR !== null) {
    fill(255, 255, 255);
    ellipse(ANCHOR.x, ANCHOR.y, 10, 10);
    fill(0, 0, 0);
  }

  // Affichage des messages
  text(message, 30, 50);

  if (robot !== null) {
    robot.disp();
  }
}

function drawEdges(edges, col) {
  if (edges.length < 1) {
    return;
  }
  // Draw lines between consecutive points

  stroke(col); // Set the stroke color for the lines
  for (let e of edges) {
    line(e[0].x, e[0].y, e[1].x, e[1].y); // Draw line between points
  }
  stroke("black");
}

function mousePressed() {
  console.log("mouse pressed");

  if (mouseX <= 140) {
    return;
  }
  let pt = new Point(mouseX, mouseY);
  freePoints.push(pt);

  message = "";
}

// This Redraws the Canvas when resized
windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
};

function updateGvis() {
  // builds the visibility graph in the form of an adjacency matrix in O(n^3) time
  Gvis = [];
  visEdges = [];
  shortestPath = [];
  if (START == null || END == null || tether == null) {
    return;
  } else {
    let points = tether.getVces().concat([END]);
    let ni = points.length; // initial size of the adjacency matrix containing no obstacle's edges
    let N = []; // obstacles sizes
    let obCpy = [...obstacles]; // copy of the obstacles list
    obCpy.forEach((obstacle) => {
      N.push(obstacle.getLen());
      points = points.concat(obstacle.getLst());
    });

    let n = points.length; // final size of the adjacency matrix
    Gvis = Array.from({ length: n }, () => Array(n).fill(-1)); // setting the adjacency matrix to all infinite entries representing separate edges initially

    // as a convention, the 0 index denotes the START point whereas the 1 index denotes the END point
    // the other indexes stand for the obstacle points which are taken into account in the order they appear in the obstacles points lists

    let sp = new simpPolygon(); // useful class methods

    // begining with the START point
    let i = 0;
    while (i < ni) {
      populateRow(i, points, n);
      i = i + 1;
    }
    // dealing with obstacles visibility
    let obSize = N.shift(); // extracting the size of the first obstacle
    let obIdx = 0;
    let obstacle = obstacles[obIdx];
    //console.log("console.log no. 1");
    //console.log("the obstacle: ", JSON.stringify(obstacle));
    while (obSize > 0 || N.length > 0) {
      if (obSize == 0) {
        // new obstacle
        obIdx += 1;
        obstacle = obstacles[obIdx];
        obSize = N.shift();
      }
      // dealing with points of this very obstacle
      for (let j = i + 1; j < i + obSize; j++) {
        if (j == i + 1) {
          // consecutive points of the obstacle are visible
          Gvis[i][j] = distEuc(points[i], points[j]);
          Gvis[j][i] = Gvis[i][j];
          visEdges.push([points[i], points[j]]);
        } else if (obstacle.inside(points[i], points[j]) == false) {
          let edge1 = [points[i], points[j]];
          let visible = true;
          outerLoop: for (let obstacle of obstacles) {
            pts = obstacle.getLst();
            for (let p = 0; p < pts.length; p++) {
              let edge2 = [pts[p], pts[(p + 1) % pts.length]];
              if (sp.intersct(edge1, edge2) == true) {
                visible = false;
                break outerLoop; // Break out of both loops
              }
            }
          }
          if (visible == true) {
            Gvis[i][j] = distEuc(points[i], points[j]);
            Gvis[j][i] = Gvis[i][j];
            visEdges.push(edge1);
          }
        }
      }
      // dealing with points from other obstacles
      for (let j = i + obSize; j < n; j++) {
        let edge1 = [points[i], points[j]];
        let visible = true;
        outerLoop: for (let obstacle of obstacles) {
          pts = obstacle.getLst();
          for (let p = 0; p < pts.length; p++) {
            let edge2 = [pts[p], pts[(p + 1) % pts.length]];
            if (sp.intersct(edge1, edge2) == true) {
              visible = false;
              break outerLoop; // Break out of both loops
            }
          }
        }
        if (visible == true) {
          Gvis[i][j] = distEuc(points[i], points[j]);
          Gvis[j][i] = Gvis[i][j];
          visEdges.push(edge1);
        }
      }
      obSize = obSize - 1;
      i = i + 1;
    }

    console.log("console.log no. 2");
    console.log("adjacency matrix: ", JSON.stringify(Gvis));

    // tackling the shortest path with a breadth first search approach
    const path = dijkstra(Gvis, ni - 2, ni - 1);

    let prev = ni - 2;
    for (let pt of path) {
      if (pt != prev) {
        shortestPath.push([points[prev], points[pt]]);
        prev = pt;
      }
    }
  }
}

function populateRow(i, points, n) {
  let sp = new simpPolygon(); // useful class methods
  for (let j = i + 1; j < n; j++) {
    let edge1 = [points[i], points[j]];
    let visible = true;
    outerLoop: for (let obstacle of obstacles) {
      pts = obstacle.getLst();
      for (let p = 0; p < pts.length; p++) {
        let edge2 = [pts[p], pts[(p + 1) % pts.length]];
        if (sp.intersct(edge1, edge2) == true) {
          visible = false;
          break outerLoop; // Break out of both loops
        }
      }
    }
    if (visible == true) {
      Gvis[i][j] = distEuc(points[i], points[j]);
      Gvis[j][i] = Gvis[i][j];
      visEdges.push(edge1);
    }
  }
}

// automatically generated Dijkstra algorithm
function dijkstra(adjMatrix, start, end) {
  const n = adjMatrix.length;
  const distances = Array(n).fill(Infinity); // Initialize distances to infinity
  const visited = Array(n).fill(false); // Track visited vertices
  const previous = Array(n).fill(null); // To reconstruct the shortest path

  distances[start] = 0;
  const queue = new Set(Array.from({ length: n }, (_, i) => i)); // Queue with all nodes

  while (queue.size > 0) {
    // Find the unvisited node with the smallest distance
    let current = null;
    for (let node of queue) {
      if (current === null || distances[node] < distances[current]) {
        current = node;
      }
    }

    if (distances[current] === Infinity) {
      break; // All remaining vertices are inaccessible from start
    }

    // If we reached the end vertex, reconstruct the path
    if (current === end) {
      const path = [];
      for (let at = end; at !== null; at = previous[at]) {
        path.push(at);
      }
      return path.reverse(); // Return the path from start to end
    }

    // Mark the current node as visited
    queue.delete(current);
    visited[current] = true;

    // Update distances to neighbors
    for (let neighbor = 0; neighbor < n; neighbor++) {
      if (adjMatrix[current][neighbor] !== -1 && !visited[neighbor]) {
        const newDist = distances[current] + adjMatrix[current][neighbor];
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          previous[neighbor] = current;
        }
      }
    }
  }

  return null; // Return null if there's no path from start to end
}

function pathLength(pts, path) {
  // path is a list of indices of the list of points
  res = 0;
  for (let i = 0; i < path.length - 1; i++) {
    console.log(
      "line segment: ",
      JSON.stringify([pts[path[i]], pts[path[i + 1]]])
    );
    res = res + distEuc(pts[path[i]], pts[path[i + 1]]);
  }
  return res;
}

function showGvis() {
  if (Gvis.length === 0) {
    message = "define START & END points";
    return;
  } else {
    showVG = !showVG;
  }
}

function showShortPath() {
  if (Gvis.length === 0) {
    message = "define START & END points";
    return;
  } else {
    showSP = !showSP;
  }
  return;
}

function createObstacle() {
  let ob = new Obstacle(freePoints);
  if (ob.getLen() > 0) {
    let complies = true;
    for (let ob2 of obstacles) {
      if (ob.complies(ob2) == false) {
        complies = false;
        break;
      }
    }
    if (START !== null) {
      if (ob.inside(START, START)) {
        complies = false;
      }
    }
    if (END !== null) {
      if (ob.inside(END, END)) {
        complies = false;
      }
    }
    if (complies) {
      obstacles.push(ob);
      freePoints = [];
    }
    if (!complies) {
      message = "non-conformant obstacle: no overlap tolerated";
    }
  }
}

function setTether() {
  if (START === null || ANCHOR === null || freePoints.length == 0) {
    message =
      "set the start and anchor points as well as at least a tethering point";
  } else {
    try {
      tether = new Tether(ANCHOR, START, freePoints, obstacles);
      resetpoints();
      message = "tether set, the animation starts!";
      updateGvis();
      startAnimation();
    } catch (e) {
      tether = null;
      message = "tether initialization failed";
      console.error(e.message); // "Expected a string"
    }
  }
}

function setAnchor() {
  if ((START !== null) & (END !== null)) {
    if (checkNewPoint() == true) {
      ANCHOR = freePoints.pop();
      message = "anchor set";
    }
  } else {
    message = "set the start and end points before the anchor";
  }
}

function setStart() {
  if (checkNewPoint() == true) {
    START = freePoints.pop();
    message = "start set";
  }
}

function setEnd() {
  if (checkNewPoint() == true) {
    END = freePoints.pop();
    message = "end set";
  }
}

function checkNewPoint() {
  if (freePoints.length === 0) {
    message = "Please add at least one point.";
    return false;
  } else if (freePoints.length > 1) {
    message =
      "Multiple points detected. Clear extra points to remove ambiguity.";
    return false;
  } else {
    let newpt = freePoints[0];
    let inside = false; // Check if the new point is inside an obstacle
    for (let ob of obstacles) {
      if (ob.inside(freePoints[0], freePoints[0])) {
        inside = true;
        message =
          "The selected point is inside an obstacle. Please choose another location.";
        return false;
      }
    }
    if (!inside) {
      return true;
    }
  }
}

function resetpoints() {
  if (freePoints.length === 0) {
    // if the unassigned points have been cleared
    if (START == null && END == null) {
      // if the start and end points have been cleared
      if (obstacles.length !== 0) {
        // then start clearing the obstacles
        obstacles.pop();
        message = "Clearing the obstacles.";
      } else {
        message = "Nothing remaining.";
      }
    } else {
      START = null;
      END = null;
      ANCHOR = null;
      tether = null;
      visEdges = [];
      shortestPath = [];
      homotopy = [];
      triangulation = [];
      message = "Clearing the start, end and anchor points.";
    }
  } else {
    freePoints = [];
    message = "Clearing the free points.";
  }
}

function distEuc(p, q) {
  return Math.sqrt(Math.pow(p.x - q.x, 2) + Math.pow(p.y - q.y, 2));
}

function determinant(a, b, c) {
  if (a && b && c) {
    return a.x * (b.y - c.y) - a.y * (b.x - c.x) + (c.y * b.x - c.x * b.y);
  } else {
    console.log("undefined points");
  }
}

function isPointInTriangle(a, b, c, p) {
  let d1 = determinant(a, b, p);
  let d2 = determinant(b, c, p);
  let d3 = determinant(c, a, p);

  if (d1 * d2 > 0 && d2 * d3 > 0) {
    // determinant determinants have the same sign
    return true;
  } else {
    return false;
  }
}

function startAnimation() {
  while (buttons.length > 0) {
    let lastButton = buttons.pop();
    lastButton.remove(); // Removes the button from the DOM
  }
  buildTriangulation(true, 0.99);
  console.log("triangulation built");

  let retractButton = createButton("Retract the tether");
  retractButton.position(30, buttons.length * 30 + 85);
  buttons.push(retractButton); // Add to array to keep track*/
  retractButton.mousePressed(() => {
    while (buttons.length > 0) {
      let lastButton = buttons.pop();
      lastButton.remove(); // Removes the button from the DOM
    }

    X = retractTether(tether, (w = 2), (c = "blue"));
    showTetherInit = false;

    let xavButton = createButton("Xavier's algorithm");
    xavButton.position(30, buttons.length * 30 + 85);
    buttons.push(xavButton); // Add to array to keep track*/
    xavButton.mousePressed(() => {
      xavierAlgorithm();
    });
  });
}

function xavierAlgorithm() {
  while (buttons.length > 0) {
    let lastButton = buttons.pop();
    lastButton.remove(); // Removes the button from the DOM
  }
  //Input: The polygonal environment, the initial tether configuration, the destination point, and the maximum tether length L.
  // Output: The shortest path from START to END with the maximal tether length constraint.

  sleeve = null;
  // initializing the visibility matrix's context on the original tether
  let maxLen = X.getL();
  let points = tether.getVces().concat([END]);
  let ni = points.length; // initial size of the adjacency matrix containing no obstacle's edges
  let N = []; // obstacles sizes
  let obCpy = [...obstacles]; // copy of the obstacles list
  obCpy.forEach((obstacle) => {
    N.push(obstacle.getLen());
    points = points.concat(obstacle.getLst());
  });
  let n = points.length; // final size of the adjacency matrix
  let endIdx = ni - 1; // index of the end point "t"
  let startIdx = ni - 2; // index of the start point "s"
  let anchorIdx = 0; // index of the anchor point "u"

  let zLength = 0;
  let event = anchorIdx; // starting with the anchor itself
  while (event < startIdx + 1) {
    const pathIdx = dijkstra(Gvis, event % (startIdx + 1), endIdx).reverse(); // path between goal and anchor
    let path = [];
    for (let id of pathIdx) {
      path.push(points[id]);
    }
    let zSliceIdx = range(anchorIdx, event % (startIdx + 1)).reverse();
    let ySliceIdx = range((event % (startIdx + 1)) + 1, startIdx + 1);
    yIdx = pathIdx.concat(ySliceIdx);
    zIdx = pathIdx.concat(zSliceIdx);
    let yPath = [];
    let zPath = [];
    for (let id of yIdx) {
      yPath.push(points[id]);
    }
    for (let id of zIdx) {
      zPath.push(points[id]);
    }
    let yCandidate = new Tether(
      points[endIdx],
      points[startIdx],
      yPath.slice(1, yPath.length - 1),
      (collisionOff = true),
      (w = 5),
      (c = "yellow")
    );
    yCandidate.width = 5;
    yCandidate.color = "yellow";
    let zCandidate = new Tether(
      points[endIdx],
      points[anchorIdx],
      zPath.slice(1, zPath.length - 1),
      (collisionOff = true),
      (w = 4),
      (c = "green")
    );
    zCandidate.width = 4;
    zCandidate.color = "green";

    try {
      console.log("retracting y candidate");
      yCandidate = retractTether(
        yCandidate,
        yCandidate.width,
        yCandidate.color
      );
      console.log("retracted length: ", yCandidate.getL());
    } catch (e) {
      throw console.error("error retracting y candidate: ", e);
    }

    try {
      console.log("retracting z candidate");
      zCandidate = retractTether(
        zCandidate,
        zCandidate.width,
        zCandidate.color
      );
      console.log("retracted length: ", zCandidate.getL());
    } catch (e) {
      throw console.error("error retracting z candidate: ", e);
    }

    let cLength = zCandidate.getL();
    if (cLength > zLength && cLength <= maxLen) {
      Z = zCandidate;
      Y = yCandidate;
    }
    event++;
  }
  if (Y != null && Z != null) {
    message =
      "A shortest homotopic path from the start to the end was found under the tether length constraint!";
    let movButton = createButton("Move robot, move");
    movButton.position(30, buttons.length * 30 + 85);
    buttons.push(movButton); // Add to array to keep track*/
    movButton.mousePressed(() => {
      movRobot();
    });
  } else {
    message = "tether too short, the end can't be reached from the anchor";
  }
}

function movRobot() {
  while (buttons.length > 0) {
    let lastButton = buttons.pop();
    lastButton.remove(); // Removes the button from the DOM
  }
  robot = new Robot(START, 1e4);
  robot.goToEnd(END, Y, X);
}

function retractTether(T, width = 1, color = "black") {
  //console.log("retracting the tether: ", JSON.stringify(T.getVces()));

  //console.log("crossed triangles done");
  // Suppression des triangles redondants
  let lifted_triangle = liftPolygon(T, triangulation);
  sleeve = removeRedundantTriangles(lifted_triangle);

  let shortestHomotopic = funnelAlgorithm(T, sleeve, T.initial, T.final);

  console.log("Shortest homotopic path: ", JSON.stringify(shortestHomotopic));

  let tetherR = new Tether(
    T.initial,
    T.final,
    shortestHomotopic.slice(1, shortestHomotopic.length - 1),
    obstacles,
    (collisionOff = true),
    (w = width),
    (c = color)
  );
  return tetherR;
}

function buildOuterPolygon() {
  let outerPolygon = [
    new Point(0, 0),
    new Point(0, windowHeight),
    new Point(windowWidth, windowHeight),
    new Point(windowWidth, 0),
  ]; //windows' limits in counterclockwise order

  console.log("initializing sweep context");
  // Initialize a sweep context with the outer polygon
  const sweepContext = new poly2tri.SweepContext(outerPolygon);

  console.log("performing the triangulation");
  // Perform the triangulation
  poly2tri.triangulate(sweepContext);

  console.log("setting the data structure");
  triangulation = sweepContext.getTriangles();
  console.log(triangulation);
}

function buildTriangulation(shrink = false, shrinkingFactor = 0.9) {
  console.log("shrink is true?: ", shrink == true);
  let outerPolygon = [
    new Point(0, 0),
    new Point(0, windowHeight),
    new Point(windowWidth, windowHeight),
    new Point(windowWidth, 0),
  ]; // Window's limits in counterclockwise order

  // Initialize a sweep context with the outer polygon
  const sweepContext = new poly2tri.SweepContext(outerPolygon);

  for (let ob of obstacles) {
    let holePoints = ob.getLstClockwise();
    console.log("holepoints: ", JSON.stringify(holePoints));
    if (shrink == true) {
      // Calculate the centroid of the hole
      let centroid = calculateCentroid(holePoints);

      // Shrink the hole points towards the centroid
      holePoints = holePoints.map((point) => {
        let dx = point.x - centroid.x;
        let dy = point.y - centroid.y;
        return new Point(
          centroid.x + dx * shrinkingFactor,
          centroid.y + dy * shrinkingFactor
        );
      });
    }
    console.log("shrunk holepoints: ", JSON.stringify(holePoints));
    // Add the (possibly shrunk) obstacle as a hole
    sweepContext.addHole(holePoints);
  }

  // Perform the triangulation
  poly2tri.triangulate(sweepContext);

  triangulation = sweepContext.getTriangles();
}

// Helper function to calculate the centroid of a polygon
function calculateCentroid(points) {
  let xSum = 0,
    ySum = 0;
  for (let point of points) {
    xSum += point.x;
    ySum += point.y;
  }
  let n = points.length;
  let centroid = new Point(xSum / n, ySum / n);
  console.log("centroid: ", JSON.stringify(centroid));
  return centroid;
}

// Helper function to calculate the centroid of a polygon
function calculateCentroid(points) {
  let xSum = 0,
    ySum = 0;
  for (let point of points) {
    xSum += point.x;
    ySum += point.y;
  }
  let n = points.length;
  return new Point(xSum / n, ySum / n);
}

function findTrianglesCrossed(tthr, triangulation) {
  if (!tthr || !tthr.getLines || !triangulation) {
    console.error("Données incorrectes : tether ou triangulation manquants.");
    return [];
  }

  const tetherSegments = tthr.getLines();
  if (!Array.isArray(tetherSegments) || tetherSegments.length === 0) {
    console.error("Segments de la corde non définis ou vides.");
    return [];
  }

  let crossedTriangles = new Map(); // Utiliser une Map pour gérer les triangles uniques

  // Parcourir chaque segment de la corde
  tetherSegments.forEach((segment, segmentIndex) => {
    const startPoint = segment[0]; // Premier sommet du segment
    const secondPoint = segment[1];

    // Parcourir chaque triangle
    triangulation.forEach((triangle, triangleIndex) => {
      let trianglePoints = triangle.points_ || triangle; // Points du triangle
      if (!Array.isArray(trianglePoints) || trianglePoints.length !== 3) {
        console.warn("Triangle invalide :", triangle);
        return; // Ignore les triangles incorrects
      }

      // Définir les trois arêtes du triangle
      const triangleEdges = [
        [trianglePoints[0], trianglePoints[1]], // Arête 1
        [trianglePoints[1], trianglePoints[2]], // Arête 2
        [trianglePoints[2], trianglePoints[0]], // Arête 3
      ];

      // Vérifier si le sommet initial du segment est dans le triangle
      const pointInside = isPointInTriangle(
        trianglePoints[0],
        trianglePoints[1],
        trianglePoints[2],
        startPoint
      );

      // Vérifier si un sommet du triangle coïncide avec un sommet du câble
      let coincide = false;
      for (let i = 0; i < trianglePoints.length; i++) {
        if (
          (trianglePoints[i].x == startPoint.x &&
            trianglePoints[i].y == startPoint.y) ||
          (trianglePoints[i].x == secondPoint.x &&
            trianglePoints[i].y == secondPoint.y)
        ) {
          coincide = true;
          break;
        }
      }

      // Vérifier quelles arêtes du triangle sont touchées
      const edgesTouched = triangleEdges.filter((edge) =>
        simpPolygon.prototype.intersct(segment, edge)
      );

      // Ajouter le triangle si une arête est touchée ou si le point est dedans
      if (coincide || pointInside || edgesTouched.length > 0) {
        const triangleKey = trianglePoints
          .map((pt) => `${pt.x},${pt.y}`)
          .join("-");

        if (crossedTriangles.has(triangleKey)) {
          // Ajouter le segment et les nouvelles arêtes au triangle existant
          let existing = crossedTriangles.get(triangleKey);
          existing.segments.push(segmentIndex);
          existing.edgesTouched.push(...edgesTouched); // Ajouter les arêtes touchées
        } else {
          // Ajouter un nouveau triangle
          crossedTriangles.set(triangleKey, {
            triangleIndex, // Index du triangle
            triangle: trianglePoints, // Points du triangle
            segments: [segmentIndex], // Liste des segments croisés
            edgesTouched: edgesTouched, // Arêtes touchées par ce segment
          });
        }
      }
    });
  });

  // Convertir la Map en tableau et trier
  let sortedTriangles = Array.from(crossedTriangles.values());
  sortedTriangles.sort((a, b) => {
    // Trier par le premier segment qui traverse le triangle
    let diffSegIdx = Math.min(...a.segments) - Math.min(...b.segments);
    if (diffSegIdx != 0) {
      return diffSegIdx;
    } else {
      let SEG = tthr.getLines()[Math.min(...a.segments)];
      return lambdaConvex(a, SEG) - lambdaConvex(b, SEG);
    }
  });
  return sortedTriangles;
}

function lambdaConvex(triangle, segment) {
  /* console.log("in lambda convex"); */
  let v = segment[0]; // two tether points
  let w = segment[1];
  let n = 0;
  let µLambda = 0;
  for (let edge of triangle.edgesTouched) {
    const [V1, V2] = edge;
    const a = { x: V1.x, y: V1.y }; // two edge points
    const b = { x: V2.x, y: V2.y };
    if (simpPolygon.prototype.intersct(segment, [a, b])) {
      let p = iSection(v, w, a, b);

      let lambda = (p.x - v.x) / (w.x - v.x);
      µLambda = (lambda + n * µLambda) / (n + 1);
      n++;
    }
  }

  /*  console.log("µlambda: ", µLambda); */

  return µLambda;
}

function iSection(v, w, a, b) {
  const delxBA = b.x - a.x;
  const delyBA = b.y - a.y;
  const delxVW = -w.x + v.x;
  const delyVW = -w.y + v.y;

  if (delxBA === 0 || delxVW === 0) {
    console.log("Division by zero: Lines are parallel or vertical.");
    // rotating axis
    delxBA = delyBA;
    delxVW = delyVW;
    delyBA = 0;
    delyVW = 0;
  }

  let px =
    (w.y - a.y + a.x * (delyBA / delxBA) - w.x * (delyVW / delxVW)) /
    (delyBA / delxBA - delyVW / delxVW);
  let py = (delyBA / delxBA) * (px - a.x) + a.y;
  return { x: px, y: py };
}

// Fonction pour calculer la distance d'un point à un segment
function distancePointToSegment(point, segment) {
  const [p1, p2] = segment;
  const x = point.x,
    y = point.y;
  const x1 = p1.x,
    y1 = p1.y,
    x2 = p2.x,
    y2 = p2.y;

  // Calcul de la projection du point sur le segment
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(
    0,
    Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))
  );
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  // Distance entre le point et sa projection
  return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
}

function removeRedundantTriangles(crossedTriangles) {
  let triangles = [...crossedTriangles]; // Cloner pour éviter les modifications directes
  let hasChanges = true;

  while (hasChanges) {
    hasChanges = false;
    const trianglesToRemove = new Set(); // Stocker les indices des triangles à supprimer

    // **Étape 1 : Trouver un triangle redondant**
    let redundantTriangleIndex = -1;

    for (let i = 0; i < triangles.length; i++) {
      const { edgesTouched } = triangles[i];

      if (edgesTouched.length === 0) {
        continue; // Ignorer les triangles sans arêtes
      }

      const stack = [];
      edgesTouched.forEach((edge) => {
        if (
          stack.length > 0 &&
          stack[stack.length - 1][0].x === edge[0].x &&
          stack[stack.length - 1][0].y === edge[0].y &&
          stack[stack.length - 1][1].x === edge[1].x &&
          stack[stack.length - 1][1].y === edge[1].y
        ) {
          stack.pop(); // Supprimer si redondant
        } else {
          stack.push(edge); // Ajouter sinon
        }
      });

      if (stack.length === 0) {
        // Triangle redondant trouvé
        redundantTriangleIndex = i;
        trianglesToRemove.add(i);
        break;
      }
    }

    if (redundantTriangleIndex !== -1) {
      hasChanges = true;

      // **Étape 2 : Vérifier les triangles autour**
      let offset = 1;

      while (true) {
        const leftIndex = redundantTriangleIndex - offset;
        const rightIndex = redundantTriangleIndex + offset;

        if (leftIndex < 0 || rightIndex >= triangles.length) {
          break; // Sortir si on dépasse les bornes
        }

        const leftTriangle = triangles[leftIndex];
        const rightTriangle = triangles[rightIndex];

        if (
          leftTriangle.edgesTouched.length > 0 &&
          rightTriangle.edgesTouched.length > 0
        ) {
          const lastEdgeLeft = leftTriangle.edgesTouched.slice(-1)[0]; // Dernier élément de left
          const firstEdgeRight = rightTriangle.edgesTouched[0]; // Premier élément de right
          const firstEdgeLeft = leftTriangle.edgesTouched[0]; // Premier élément de left
          const lastEdgeRight = rightTriangle.edgesTouched.slice(-1)[0];

          // Nouvelle condition stricte
          if (
            (lastEdgeLeft[0].x === firstEdgeRight[0].x &&
              lastEdgeLeft[0].y === firstEdgeRight[0].y &&
              lastEdgeLeft[1].x === firstEdgeRight[1].x &&
              lastEdgeLeft[1].y === firstEdgeRight[1].y &&
              firstEdgeLeft[0].x === lastEdgeRight[0].x &&
              firstEdgeLeft[0].y === lastEdgeRight[0].y &&
              firstEdgeLeft[1].x === lastEdgeRight[1].x &&
              firstEdgeLeft[1].y === lastEdgeRight[1].y) ||
            (firstEdgeLeft[0].x === firstEdgeRight[0].x &&
              firstEdgeLeft[0].y === firstEdgeRight[0].y &&
              firstEdgeLeft[1].x === firstEdgeRight[1].x &&
              firstEdgeLeft[1].y === firstEdgeRight[1].y &&
              lastEdgeLeft[0].x === lastEdgeRight[0].x &&
              lastEdgeLeft[0].y === lastEdgeRight[0].y &&
              lastEdgeLeft[1].x === lastEdgeRight[1].x &&
              lastEdgeLeft[1].y === lastEdgeRight[1].y)
          ) {
            // Ajouter les indices à supprimer
            trianglesToRemove.add(leftIndex);
            trianglesToRemove.add(rightIndex);
          }
        }

        offset++; // Passer à la prochaine paire
      }
    }

    // **Étape 3 : Supprimer tous les triangles marqués**
    triangles = triangles.filter((_, index) => !trianglesToRemove.has(index));
  }

  return triangles;
}

function liftPolygon(tthr, triangulation) {
  if (!tthr || !triangulation) {
    console.error("Paramètres invalides : tether ou triangulation manquants.");
    return [];
  }

  const crossedTriangles = findTrianglesCrossed(tthr, triangulation);
  console.log("crossed triangles: ", crossedTriangles);

  if (!Array.isArray(crossedTriangles)) {
    console.error(
      "findTrianglesCrossed n'a pas retourné un tableau :",
      crossedTriangles
    );
    return [];
  }

  let contextDetailsList = [];

  crossedTriangles.forEach(({ triangle, segments, edgesTouched }, index) => {
    if (!triangle || !segments || !edgesTouched) {
      console.warn(`Élément à l'index ${index} ignoré car incomplet :`, {
        triangle,
        segments,
        edgesTouched,
      });
      return;
    }

    // Découper les `segments` et associer les `edgesTouched`
    const groupedSegmentsAndEdges = splitIntoContiguous(segments, edgesTouched);

    groupedSegmentsAndEdges.forEach(({ segments: segmentSubset, edges }) => {
      // Générer des clés uniques
      const triangleKey = generateTriangleKey(triangle);
      const segmentsKey = generateSegmentsKey(segmentSubset);
      const contextKey = `${triangleKey}|${segmentsKey}`;

      // Ajouter au contexte avec clé unique
      contextDetailsList.push({
        key: contextKey, // Clé unique combinée
        triangleIndex: index, // Ajouter l'index du triangle
        triangle: triangle.map((pt) => new Point(pt.x, pt.y)), // Convertir les points
        segments: segmentSubset,
        edgesTouched: edges,
      });
    });
  });

  // Tri final : priorise le triangle avec uniquement le segment 0
  contextDetailsList.sort((a, b) => {
    const isZeroOnlyA = a.segments.length === 1 && a.segments[0] === 0;
    const isZeroOnlyB = b.segments.length === 1 && b.segments[0] === 0;

    if (isZeroOnlyA && !isZeroOnlyB) return -1; // `a` avec `[0]` doit être avant
    if (!isZeroOnlyA && isZeroOnlyB) return 1; // `b` avec `[0]` doit être avant

    const firstSegmentA = Math.min(...a.segments);
    const firstSegmentB = Math.min(...b.segments);
    if (firstSegmentA - firstSegmentB != 0) {
      return firstSegmentA - firstSegmentB;
    } else {
      let SEG = tthr.getLines()[firstSegmentA];
      return lambdaConvex(a, SEG) - lambdaConvex(b, SEG);
    }
  });

  // Swap explicite du premier et deuxième élément après le tri
  if (
    contextDetailsList.length > 1 &&
    contextDetailsList[0].segments[0] !== 0
  ) {
    const temp = contextDetailsList[0];
    contextDetailsList[0] = contextDetailsList[1];
    contextDetailsList[1] = temp;
  }

  // Transformer les triangles relevés en format compatible avec buildTriangulation
  const liftedTriangles = contextDetailsList.map((entry) => ({
    triangleIndex: entry.triangleIndex, // L'index du triangle
    triangle: entry.triangle, // Points formatés pour poly2tri
    segments: entry.segments,
    edgesTouched: entry.edgesTouched, // Arêtes touchées
  }));

  console.log("Triangles relevés (format final) :", liftedTriangles);

  return liftedTriangles;
}

function splitIntoContiguous(segments, edgesTouched) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return [];
  }

  /*   console.log("Original Segments:", segments);
  console.log("Original EdgesTouched:", edgesTouched); */

  // Trier les segments pour garantir l'ordre
  segments.sort((a, b) => a - b);

  let result = [];
  let edgesIndex = 0; // Pointeur pour parcourir les edgesTouched

  let currentGroup = [segments[0]];
  let currentEdges = [];

  for (let i = 1; i < segments.length; i++) {
    if (segments[i] === segments[i - 1] + 1) {
      // Segment contigu : ajouter au groupe actuel
      currentGroup.push(segments[i]);
    } else {
      // Nouveau groupe : attribuer les arêtes
      if (currentGroup[0] === 0) {
        // Si le groupe contient uniquement [0], associer une seule arête
        if (edgesIndex < edgesTouched.length && currentGroup.length === 1) {
          currentEdges.push(edgesTouched[edgesIndex++]); // Première arête
        }
      } else {
        // Sinon, attribuer les arêtes normalement
        if (edgesIndex < edgesTouched.length) {
          currentEdges.push(edgesTouched[edgesIndex++]); // Premier élément
        }
        if (edgesIndex < edgesTouched.length) {
          currentEdges.push(edgesTouched[edgesIndex++]); // Dernier élément
        }
      }

      result.push({
        segments: currentGroup,
        edges: currentEdges,
      });

      // Réinitialiser pour le nouveau groupe
      currentGroup = [segments[i]];
      currentEdges = [];
    }
  }

  // Dernier groupe : attribuer les arêtes
  if (currentGroup.length === 1 && currentGroup[0] === 0) {
    // Si le groupe contient uniquement [0], associer une seule arête
    if (edgesIndex < edgesTouched.length) {
      currentEdges.push(edgesTouched[edgesIndex++]); // Première arête
    }
  } else {
    // Sinon, attribuer les arêtes normalement
    if (edgesIndex < edgesTouched.length) {
      currentEdges.push(edgesTouched[edgesIndex++]); // Premier élément
    }
    if (edgesIndex < edgesTouched.length) {
      currentEdges.push(edgesTouched[edgesIndex++]); // Dernier élément
    }
  }

  result.push({
    segments: currentGroup,
    edges: currentEdges,
  });

  /*   console.log("Final Result from splitIntoContiguous:", result); */

  return result;
}

function generateTriangleKey(triangle) {
  if (!Array.isArray(triangle) || triangle.length !== 3) {
    console.error("Triangle invalide :", triangle);
    return "";
  }
  return triangle
    .map((pt) => `${pt.x},${pt.y}`) // Transforme chaque point en une chaîne
    .sort() // Trie les chaînes pour un ordre cohérent
    .join("|"); // Combine les chaînes avec un séparateur
}

function generateSegmentsKey(segments) {
  if (!Array.isArray(segments)) {
    console.error("Segments invalides :", segments);
    return "";
  }
  return segments.sort((a, b) => a - b).join(","); // Trie les indices et les combine
}

function copyTriangle(triangle) {
  if (!Array.isArray(triangle)) {
    console.error("Triangle invalide dans copyTriangle :", triangle);
    return [];
  }
  return triangle.map((pt) => ({ x: pt.x, y: pt.y })); // Copie profonde des points
}

function funnelAlgorithm(tthr, sleeve, start, goal) {
  // Helper function to compute the cross product
  const cross = (o, a, b) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  // Helper function to check if two vertices are the same
  const same = (v1, v2) => v1.x === v2.x && v1.y === v2.y;

  // if start and goal are inside the same triangle, return [start, goal] as a shortest homotopic path
  for (const liftedTriangle of sleeve) {
    const { triangle } = liftedTriangle; // Extract the triangle
    //console.log("Checking triangle:", triangle);

    // Check if both points are inside the triangle
    if (
      isPointInTriangle(triangle[0], triangle[1], triangle[2], start) &&
      isPointInTriangle(triangle[0], triangle[1], triangle[2], goal)
    ) {
      //console.log("Start and goal are in the same triangle.");
      return [start, goal];
    }
  }

  // Initialize the funnel's apex and boundaries
  let apex = start;
  let leftPath = [];
  let rightPath = [];
  let portals = [];
  let path = [start];

  // Iterate through ordered triangles in the sleeve
  //console.log("iterating through ordered triangles in the sleeve");
  for (const [triangleKey, { edgesTouched, segments }] of sleeve.entries()) {
    const edges = []; // Holds edges with sorted keys

    // Process each edge
    //console.log("edge of edges touched");
    for (const edge of edgesTouched) {
      let [v1, v2] = edge.map(({ x, y }) => ({ x, y }));

      // Determine edge orientation using segments
      //console.log("idx of segments");
      for (const idx of segments) {
        const [seg1, seg2] = tthr.getLines()[idx];
        if (simpPolygon.prototype.intersct([seg1, seg2], [v1, v2])) {
          const intersection = iSection(v1, v2, seg1, seg2);
          if (
            cross(seg1, intersection, v1) > 0 &&
            cross(seg1, intersection, v2) < 0
          ) {
            // Swap to maintain correct orientation
            [v1, v2] = [v2, v1];
          }
        }
      }
      edges.push({ edge: [v1, v2], key: triangleKey });
    }

    // Add vertices to left or right path
    //console.log("edge key of edges");
    for (const {
      edge: [v1, v2],
      key: k,
    } of edges) {
      //console.log("add unique edge");

      if (addUniqueEdge(portals, [v1, v2], k)) {
        leftPath.push(v1);
        rightPath.push(v2);
      }
    }
  }

  leftPath.push(goal);
  rightPath.push(goal);
  portals.push({ edge: [goal, goal], key: sleeve.length });
  console.log("leftPath: ", JSON.stringify(leftPath));
  console.log("rightPath: ", JSON.stringify(rightPath));
  console.log("portals: ", JSON.stringify(portals));

  let portalSave = [...portals];
  console.log("portals saved: ", JSON.stringify(portalSave));
  let left = null;
  let right = null;

  let it = 0;
  let r = 0;
  let l = 0;
  let curr = 0;
  let curl = 0;
  // Process the funnel while leftPath or rightPath remains
  while (
    portals.length > 0 &&
    curl < leftPath.length &&
    curr < rightPath.length
  ) {
    //console.log("portal edge: %o %o", v1, v2);
    console.log("portals: ", JSON.stringify(portals));
    let {
      edge: [v1, v2],
      key,
    } = portals.shift();
    console.log(
      "leftPath: ",
      JSON.stringify(leftPath.slice(curl, leftPath.length + 1))
    );
    console.log(
      "rightPath: ",
      JSON.stringify(rightPath.slice(curr, rightPath.length + 1))
    );
    console.log("apex: %o, left: %o, right: %o", apex, left, right);
    if (!left && !right) {
      if (same(v1, leftPath[curl]) && same(v2, rightPath[curr])) {
        l = curl;
        r = curr;
        left = leftPath[curl++];
        right = rightPath[curr++];
      } else {
        console.log("v1: %o leftPath[curl]: %o", v1, leftPath[curl]);
        console.log("v2: %o rightPath[curr]: %o", v2, rightPath[curr]);
        throw console.error(
          "mismatch between initial portal and left/right paths"
        );
      }
    } else {
      // left and right are already assigned to a previous portal's vertices
      if (
        (same(v1, leftPath[curl]) || same(v1, left)) &&
        (same(v2, rightPath[curr]) || same(v2, right))
      ) {
        if (same(v1, left) && same(v2, rightPath[curr])) {
          // funnel changes on the right
          curl++;
          if (cross(apex, right, v2) <= 0) {
            r = curr;
            right = rightPath[curr++];
            console.log("right updates: ", JSON.stringify(right));
            if (checkCrossing(left, right, apex)) {
              // Funnel collapse: choose the next apex
              path.push(left);
              apex = left;
              left = null;
              right = null;
              console.log("next apex: ", apex);
              portals = recoverPortals(portalSave, r + 1);
              curr = r + 1;
              curl = r + 1;
            }
          } else {
            curr++;
          }
        } else if (same(v2, right) && same(v1, leftPath[curl])) {
          // funnel changes on the left
          curr++;
          if (cross(apex, left, v1) >= 0) {
            l = curl;
            left = leftPath[curl++];
            console.log("left updates: ", JSON.stringify(left));
            if (checkCrossing(left, right, apex)) {
              // Funnel collapse: choose the next apex
              path.push(right);
              apex = right;
              right = null;
              left = null;
              console.log("next apex: ", apex);
              portals = recoverPortals(portalSave, l + 1);
              curl = l + 1;
              curr = l + 1;
            }
          } else {
            curl++;
          }
        } else if (same(v1, leftPath[curl]) && same(v2, rightPath[curr])) {
          // both v1 & v2 are different from left and right respectively ~ portal jump as opposed to portal pivoting
          if (cross(apex, left, v1) >= 0) {
            console.log("jump at iteration %f with tightening on the left", it);
            curr++;
            l = curl;
            left = leftPath[curl++];
            console.log("left updates: ", JSON.stringify(left));
            if (checkCrossing(left, right, apex)) {
              // Funnel collapse: choose the next apex
              path.push(right);
              apex = right;
              right = null;
              left = null;
              console.log("next apex: ", apex);
              portals = recoverPortals(portalSave, r + 1);
              curr = r + 1;
              curl = r + 1;
            }
          } else if (cross(apex, right, v2) <= 0) {
            console.log(
              "jump at iteration %f with tightening on the right",
              it
            );
            curl++;
            r = curr;
            right = rightPath[curr++];
            console.log("right updates: ", JSON.stringify(right));
            if (checkCrossing(left, right, apex)) {
              // Funnel collapse: choose the next apex
              path.push(left);
              apex = left;
              right = null;
              left = null;
              console.log("next apex: ", apex);
              portals = recoverPortals(portalSave, l + 1);
              curl = l + 1;
              curr = l + 1;
            }
          } else {
            console.log(
              "jump at iteration %f with no tightening of the funnel",
              it
            );
            curr++;
            curl++;
          }
        } else {
          console.log(
            "mismatch between portal and left/right paths at iteration %f",
            it
          );
          return path;
        }
      }
    }
    console.log("apex: %o, left: %o, right: %o", apex, left, right);
    it++;
  }

  // Add the goal to the final path
  path.push(goal);

  return path;
}

function recoverPortals(psave, idx) {
  return psave.slice(idx, psave.length);
}

function addUnique(path, obj) {
  if (!path.some((o) => o.x === obj.x && o.y === obj.y)) {
    path.push(obj);
  }
}

//automatically generated function
function addUniqueEdge(portals, e, k) {
  // Helper function to check if two vertices are the same
  const same = (v1, v2) => v1.x === v2.x && v1.y === v2.y;

  // Check if the edge (in either direction) is already in the portals array
  const isDuplicate = portals.some(
    ({ edge: existingEdge, key: existingKey }) => {
      const sameDirection =
        (same(existingEdge[0], e[0]) && same(existingEdge[1], e[1])) || // Same direction
        (same(existingEdge[0], e[1]) && same(existingEdge[1], e[0])); // Reverse direction
      return sameDirection && Math.abs(existingKey - k) <= 1; // Check key condition
    }
  );

  // Add the edge to portals if it is not a duplicate
  if (!isDuplicate) {
    portals.push({ edge: e, key: k }); // Add edge and key as an object
    return true;
  }
  return false;
}

function checkCrossing(left, right, apex) {
  // Helper function to compute the cross product
  const cross = (o, a, b) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); // positive if ob is leftward and oa is rightward

  // Check if the funnel collapses (left and right paths cross)
  if (left && right) {
    if (cross(apex, right, left) >= 0) {
      console.log("rightPath and leftPath cross each other, new apex!");
      return true;
    }
  }
  return false;
}

function checkSamePortal(portals, left, right, max) {
  // Helper function to check if two vertices are the same
  const same = (v1, v2) => v1.x === v2.x && v1.y === v2.y;
  // Iterate through each element of the sleeve
  for (let i = 0; i < max; i++) {
    [p1, p2] = portals[i];
    if (
      (same(p1, left) && same(p2, right)) ||
      (same(p2, left) && same(p1, right))
    ) {
      return true;
    }
  }
  return false; // No matching edge found
}

function range(start, end, step = 1) {
  return Array.from(
    { length: Math.ceil((end - start) / step) },
    (_, i) => start + i * step
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
