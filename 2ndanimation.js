/* eslint-disable no-undef, no-unused-vars */

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
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
    super(); // Call the parent constructor
    this.points = this.checkPolygon(l); // Check if points form a simple polygon
    this.len = this.points.length;
    this.triangles = this.triangulate(Array.from(this.points)); // passes a copy as the function's argument
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
  getLen() {
    return this.len; // Return the length of the list
  }

  getTriangles() {
    return this.triangles;
  }

  triangulate(pts) {
    let triangles = [];
    if (pts.length == 3) {
      console.log("is a triangle");
      // The polygon is a triangle
      triangles.push(pts);
      console.log("Pushed triangle");
    } else if (pts.length >= 4) {
      for (let p = 0; p <= pts.length - 1; p++) {
        // iterates over every vertex of the polygon to check if it is an ear
        if (this.checkEar(p, pts) == true) {
          // if it is an ear, push it in the triangles list
          triangles.push([
            pts[p],
            pts[(p + 1) % pts.length],
            pts[(p - 1 + pts.length) % pts.length],
          ]);
          pts.splice(p, 1); // remove the ear from the polygon
          break; // ear found, break the for loop
        }
      }
      triangles = this.triangulateFurther(pts, triangles); // triangulates the remaining polygon
    }
    return triangles;
  }

  triangulateFurther(pts, triangles) {
    if (pts.length == 3) {
      // The polygon is a triangle
      triangles.push(pts);
      return triangles;
    } else {
      // the remaining polygon has got more than 3 vertices
      let found = false; // new ear found
      let p = 0;
      while (!found) {
        if (this.checkEar(p, pts) == true) {
          // if the point is an ear, push in triangles list
          triangles.push([
            pts[p],
            pts[(p + 1) % pts.length],
            pts[(p - 1 + pts.length) % pts.length],
          ]);
          pts.splice(p, 1); // remove the ear from the polygon
          found = true;
        }
        p++;
      }
      triangles = this.triangulateFurther(pts, triangles); // recursively triangulate the remaining polygon
    }
    return triangles;
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
  constructor(iPt, fPt, vces, ocles) {
    // input: compliant initial and final points, set of intermediate vertices, set of obstacles

    this.polyLine = []; // the tether is represented by a polyline
    this.lengths = []; // Euclidean lengths of each line segement
    this.Vces = [iPt, ...vces, fPt];
    this.len = 2 + vces.length; // number of vertices in the polyline
    this.lastFeasible = null;
    this.L = 0;
    // Define the complete set of points (start, intermediate, end)
    const points = this.Vces;

    // Iterate through consecutive pairs of points
    for (let i = 0; i < points.length - 1; i++) {
      const lineSegment = [points[i], points[i + 1]];

      // Check for intersections with each obstacle
      if (this.checkForIntersections(lineSegment, ocles)) {
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
    this.polyLine.forEach(([start, end]) => {
      strokeWeight(3);
      line(start.x, start.y, end.x, end.y); // Draw line between points
      strokeWeight(1);
    });
  }
  getVces() {
    return this.Vces;
  }
  getLengths() {
    return this.lengths;
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

class Robot {
  constructor(pt, spd) {
    this.point = pt;
    this.x = pt.x;
    this.y = pt.y;
    this.speed = spd; // pixels per ms
    this.lastAnch = tether.head();
  }
  disp() {
    stroke("blue");
    rect(this.x - 2.5, this.y - 2.5, 5, 5);
    stroke("black");
    strokeWeight(3);
    line(this.x, this.y, this.lastAnch.x, this.lastAnch.y);
    strokeWeight(1);
  }
  update(pt) {
    this.point = pt;
    this.x = pt.x;
    this.y = pt.y;
  }
  async goToEnd(goal) {
    if (goal === null) {
      goal = ANCHOR;
    }
    let Xinit = this.x;
    let Yinit = this.y;

    let next = tether.pop();
    shPathConstrt.push([this.lastAnch, next]);
    this.lastAnch = next;
    let d = distEuc(this.point, next);
    let t = d / this.speed;
    let step = new Point((next.x - Xinit) / 100, (next.y - Yinit) / 100);
    while (next !== goal) {
      for (let i = 1; i < 101; i++) {
        // the robot goes to next point in time t in 100 steps
        this.update(new Point(Xinit + step.x * i, Yinit + step.y * i));
        await sleep(t / 100);
      }
      Xinit = this.x;
      Yinit = this.y;

      next = tether.pop();
      shPathConstrt.push([this.lastAnch, next]);
      this.lastAnch = next;
      d = distEuc(this.point, next);
      t = d / this.speed;
      step = new Point((next.x - Xinit) / 100, (next.y - Yinit) / 100);
    }
    shPathConstrt.push([this.lastAnch, goal]);
    d = distEuc(this.point, goal);
    t = d / this.speed;
    step = new Point(
      (goal.x - this.lastAnch.x) / 100,
      (goal.y - this.lastAnch.y) / 100
    );
    for (let i = 1; i < 101; i++) {
      // the robot goes to next point in time t in 100 steps
      this.update(
        new Point(this.lastAnch.x + step.x * i, this.lastAnch.y + step.y * i)
      );
      await sleep(t / 100);
    }
    this.lastAnch = goal;
    tether.push(goal); // putting back the feasible point as the tether's head
    let shPathSv = [...shortestPath];

    updateGvis(); // updating the visibility graph
    let res = [...shortestPath];
    shortestPath = shPathSv; // reestablish shortest path from start to end
    console.log("remaining: ", JSON.stringify(res));

    // from last feasible point to the end
    next = res.shift()[1];
    d = distEuc(this.lastAnch, next);
    t = d / this.speed;
    step = new Point(
      (next.x - this.lastAnch.x) / 100,
      (next.y - this.lastAnch.y) / 100
    );
    while (res.length > 0) {
      for (let i = 1; i < 101; i++) {
        // the robot goes to next point in time t in 100 steps
        this.update(
          new Point(this.lastAnch.x + step.x * i, this.lastAnch.y + step.y * i)
        );
        await sleep(t / 100);
      }
      shPathConstrt.push([this.lastAnch, next]);
      this.lastAnch = next;
      tether.push(next);

      next = res.shift()[1];
      d = distEuc(this.lastAnch, next);
      t = d / this.speed;
      step = new Point(
        (next.x - this.lastAnch.x) / 100,
        (next.y - this.lastAnch.y) / 100
      );
    }
    //shPathConstrt.push([this.lastAnch, END]);
    d = distEuc(this.lastAnch, next);
    t = d / this.speed;
    step = new Point(
      (next.x - this.lastAnch.x) / 100,
      (next.y - this.lastAnch.y) / 100
    );
    for (let i = 1; i < 101; i++) {
      // the robot goes to next point in time t in 100 steps
      this.update(
        new Point(this.lastAnch.x + step.x * i, this.lastAnch.y + step.y * i)
      );
      await sleep(t / 100);
    }
    shPathConstrt.push([this.lastAnch, next]);
    this.lastAnch = next;
    tether.push(next);
  }
}

var freePoints = []; // unassigned points
var obstacles = []; // list of polygonal obstacles
var shortestPath = []; // list of consecutive points between START & END points forming the shortest path
var shPathConstrt = []; // list of consecutive points between START & END points forming the shortest path under total tether length constraints
var Gvis = []; // visibility graph in the form of an 2D adjacency matrix
var visEdges = []; // visibility edges in the form of point pairs
var START = null; // starting point of the robot
var END = null; // end point of the robot
var ANCHOR = null; // anchor for the Tether
var FEASIBLE = null; // last feasible point on the tether leading to an admissible length
var tether = null; // the tether is an instance of the Tether class that will be initialized in setTether
var robot = null; // the robot is an instance of the Robot class aimed for display
var message = "";
var showVG = true;
var showFeas = true;
var showSP = false;
var buttons = []; // list of the buttons

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
  // Put drawings here
  background(200);

  if (showVG == true) {
    drawEdges(visEdges, color(0.625 * 255, 0.625 * 255, 0.625 * 255));
  }

  if (tether !== null) {
    tether.disp();
  }

  for (i in freePoints) {
    ellipse(freePoints[i].x, freePoints[i].y, 4, 4);
  }
  obstacles.forEach((obstacle) => {
    obstacle.disp();
  });

  if (showSP == true) {
    drawEdges(shortestPath, "blue");
  }
  if (shPathConstrt.length > 0) {
    drawEdges(shPathConstrt, "red");
  }
  if (FEASIBLE !== null && showFeas == true) {
    fill(255, 0, 255);
    ellipse(FEASIBLE.x, FEASIBLE.y, 4, 4);
    fill(0, 0, 0);
  }
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
  if (robot !== null) {
    robot.disp();
  }

  text(message, 30, 50);
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
    console.log("the obstacle: ", JSON.stringify(obstacle));
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
      message =
        "the tether is non-compliant: intersection with obstacle detected";
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
  firstStage();
}

function firstStage() {
  let distEucButton = createButton("Show euclidean shortest path map");
  distEucButton.position(30, buttons.length * 30 + 85);
  distEucButton.mousePressed(() => {
    showVG = !showVG; // Toggle showSP on each button press
  });
  buttons.push(distEucButton); // Add to array to keep track
  let spButton = createButton("Show shortest path");
  spButton.position(30, buttons.length * 30 + 85);
  spButton.mousePressed(() => {
    showSP = !showSP; // Toggle showSP on each button press
    secondStage();
  });
  buttons.push(spButton); // Add to array to keep track
}

function secondStage() {
  let lastButton = buttons.pop();
  lastButton.remove(); // Removes the button from the DOM

  let feasButton = createButton("Show last feasible point");
  feasButton.position(30, buttons.length * 30 + 85);
  buttons.push(feasButton); // Add to array to keep track
  feasButton.mousePressed(() => {
    if (FEASIBLE == null) {
      let res = findLastFeasible();
      if (res == 0) {
        let animButton = createButton("Start animation");
        animButton.position(30, buttons.length * 30 + 85);
        animButton.mousePressed(() => {
          thirdStage();
        });
        buttons.push(animButton); // Add to array to keep track
      }
    } else {
      showFeas = !showFeas;
    }
  });
}

function thirdStage() {
  while (buttons.length > 0) {
    let lastButton = buttons.pop();
    lastButton.remove(); // Removes the button from the DOM
  }
  message = "Backtracking animation!";
  console.log("tether state:", JSON.stringify(tether.getLines()));

  robot = new Robot(START, 100 / 2000); // setting speed to 100 pixels per 2 seconds
  console.log("tether state:", JSON.stringify(tether.getLines()));
  robot.goToEnd(FEASIBLE);
  message = "objective reached";
}

function findLastFeasible() {
  let lengths = tether.getLengths();
  let points = tether.getVces().concat([END]);
  let ni = points.length; // initial size of the adjacency matrix containing no obstacle's edges
  let obCpy = [...obstacles]; // copy of the obstacles list
  obCpy.forEach((obstacle) => {
    points = points.concat(obstacle.getLst());
  });
  let n = points.length; // initial size of the adjacency matrix containing no obstacle's edges

  console.log("tether vertices: ", JSON.stringify(ni));
  console.log("Adjacency matrix'size: ", JSON.stringify(n));

  let L = tether
    .getLengths()
    .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  console.log("total tether length: ", JSON.stringify(L));

  let initL = L; // the initial tether is assumed to be at the maximum of its extension therefore setting the admissible length

  let start = ni - 2;
  let probe = start - 1;
  let path = dijkstra(Gvis, probe, ni - 1);
  console.log("shortest path from first probe: ", JSON.stringify(path));
  console.log("adjacency points: ", JSON.stringify(points));

  while (
    (L - lengths[probe] + pathLength(points, path) > initL) &
    (probe > 0)
  ) {
    L = L - lengths[probe];
    probe = probe - 1;
    path = dijkstra(Gvis, probe, ni - 1);
  }
  let l = L - lengths[probe] + pathLength(points, path);
  if (l <= initL) {
    // the probe point is admissible need for binary search on the tether to find last admissible point
    FEASIBLE = binarySearchFeasible(points, probe, L, initL, ni);
    console.log("feasible point: ", JSON.stringify(FEASIBLE));
    return 0;
  } else {
    // the probe point is 0
    message = "no tether point is feasible, the inital tether is too short";
    return 1;
  }
}

function binarySearchFeasible(points, probe, L, Lmax, ni) {
  const tetherSv = Object.assign(
    Object.create(Object.getPrototypeOf(tether)),
    tether
  ); // saving the tether on which we will perform computations
  const ptSv = [...points];

  let segmnt = [points[probe], points[probe + 1]];
  let midPt = new Point(
    (segmnt[0].x + segmnt[1].x) / 2,
    (segmnt[0].y + segmnt[1].y) / 2
  );

  tether.insertPt(midPt, probe);
  let lengths = tether.getLengths();
  points = points
    .slice(0, probe + 1)
    .concat([midPt])
    .concat(points.slice(probe + 1));
  updateGvis();

  ni++;
  path = dijkstra(Gvis, probe + 1, ni - 1);

  shortestPath = [[points[path[0]], points[path[1]]]];

  let lastFeasible = null;
  let l = L - lengths[probe + 1] + pathLength(points, path);

  const epsilon = 1e-3;
  if (l < Lmax) {
    lastFeasible = searchFurther(points, probe + 1, L, Lmax, ni);
  } else if (Math.abs(l - Lmax) < epsilon * Lmax) {
    lastFeasible = midPt;
  } else {
    lastFeasible = searchFurther(
      points,
      probe,
      L - lengths[probe + 1],
      Lmax,
      ni
    );
  }
  tether = tetherSv;
  tether.insertPt(lastFeasible, probe);
  tether.setLastFeasible(lastFeasible);
  points = ptSv;
  updateGvis();
  return lastFeasible;
}

function searchFurther(points, probe, L, Lmax, ni) {
  let segmnt = [points[probe], points[probe + 1]];

  let midPt = new Point(
    (segmnt[0].x + segmnt[1].x) / 2,
    (segmnt[0].y + segmnt[1].y) / 2
  );

  tether.insertPt(midPt, probe);
  let lengths = tether.getLengths();
  points = points
    .slice(0, probe + 1)
    .concat([midPt])
    .concat(points.slice(probe + 1, points.length));
  updateGvis();

  ni++;
  path = dijkstra(Gvis, probe + 1, ni - 1);
  //console.log("path", JSON.stringify([[points[path[0]], points[path[1]]]]));

  shortestPath = [[points[path[0]], points[path[1]]]];
  let lastFeasible = null;
  let l = L - lengths[probe + 1] + pathLength(points, path);
  let epsilon = 1e-3;
  if (l < Lmax) {
    lastFeasible = searchFurther(points, probe + 1, L, Lmax, ni);
  } else if (Math.abs(l - Lmax) < epsilon * Lmax) {
    lastFeasible = midPt;
  } else {
    lastFeasible = searchFurther(
      points,
      probe,
      L - lengths[probe + 1],
      Lmax,
      ni
    );
  }
  return lastFeasible;
}

// sleeping logic automatically generated

// Define the sleep function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
