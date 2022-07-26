import { createCanvas, loadImage } from "canvas";
import fs from "fs";
// import {  } from "./functionality"

const width = 600;
const height = 597;

export function create() {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  //   context.fillStyle = "yellow";
  //   context.fillRect(0, 0, width, height);

  loadImage("downloadImage.jpeg").then((image) => {
    context.drawImage(image, 0, 0);

    // the bounding box from AWS -> implement
    context.beginPath();
    // parameters: x and y start, width of box, height of box
    context.rect(60, 145, 358, 443);
    context.lineWidth = 7;
    context.strokeStyle = "yellow";
    context.stroke();

    // ground truth -> implement
    context.beginPath();
    context.rect(50, 120, 357, 445);
    context.lineWidth = 3;
    context.strokeStyle = "red";
    context.stroke();

    findIntersection();
    //intersection
    context.beginPath();
    context.rect(60, 145, 347, 420);
    context.lineWidth = 7;
    // context.strokeStyle = "blue";
    context.fillStyle = "blue";
    context.fill();
    // context.stroke();

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./image.png", buffer);

    calculateIOU();
  });
}

// https://www.geeksforgeeks.org/intersecting-rectangle-when-bottom-left-and-top-right-corners-of-two-rectangles-are-given/
export function findIntersection() {
  // parameters: x and y start, width of box, height of box
  // const groundTruth = [50, 120, 357, 445];
  // const AWSbox = [60, 145, 358, 443];
  let interSection = [];

  // AWS bounding box
  const x1 = 60;
  const y1 = 588;
  const x2 = 418;
  const y2 = 145;

  // "ground truth"
  const x3 = 50;
  const y3 = 565;
  const x4 = 407;
  const y4 = 120;

  // get bottom-left point of intersection rectangle
  var x5 = Math.max(x1, x3);
  var y5 = Math.min(y1, y3); // this was changed from the original to min

  // gives top-right point of intersection rectangle
  var x6 = Math.min(x2, x4);
  var y6 = Math.max(y2, y4); // this was changed from the original to max

  // gives top left point of intersection rectangle
  var x7 = x5;
  var y7 = y6;

  // gives bottom right point of intersection rectangle
  var x8 = x6;
  var y8 = y5;

  // data needed for drawing the rectangle
  // x7 is the x starting point, y7 the y starting point
  let xStart = x7;
  let yStart = y7;
  let interSectionWidth = x8 - x7;
  let interSectionHeight = y8 - y7;

  interSection = [xStart, yStart, interSectionWidth, interSectionHeight];

  let interSectionArea = interSectionWidth * interSectionHeight;
  // console.log("interSectionArea: ", interSectionArea);
  // console.log("interSection Array: ", interSection);

  // if (x5 > x6 || y5 > y6) {
  //   console.log("NO INTERSECTION FOUND!!!");
  // }

  return { interSection, interSectionArea };
}

// https://medium.com/analytics-vidhya/iou-intersection-over-union-705a39e7acef
export function calculateIOU() {
  // get the intersection of the two rectangles
  let findInter = findIntersection();
  let interArea = findInter.interSectionArea;
  console.log("interSection area: ", interArea);

  //get the union of the two rectangles
  // 1. calculate the area of the individual boxes
  // parameters: x and y start, width of box, height of box
  // const groundTruth = [50, 120, 357, 445];
  // const AWSbox = [60, 145, 358, 443];

  let areaAWS = 358 * 443;
  let areaGroundTruth = 357 * 445;
  let both = areaAWS + areaGroundTruth;
  // union is the union minus the part which is included in both rectangles,
  // otherwise we would have the intersection area twice
  let union = both - interArea;

  // divide intersection / union
  let IOU = interArea / union;
  console.log("IOU: ", IOU);
}
