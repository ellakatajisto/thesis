import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import {
  imageWidth,
  imageHeight,
  AWS_finalHeight,
  AWS_finalWidth,
  AWS_yStart,
  AWS_xStart,
} from "./functionality.js";

// ground truth coordinates for person image
let ground_xStart = 50;
let ground_yStart = 120;
let ground_width = 357;
let ground_height = 445;

export function drawBoundingBoxes() {
  const canvas = createCanvas(imageWidth, imageHeight);
  const context = canvas.getContext("2d");

  loadImage("downloadImage.jpeg").then((image) => {
    context.drawImage(image, 0, 0);

    // the bounding box from AWS -> implement
    context.beginPath();
    // parameters: x and y start, width of box, height of box
    context.rect(AWS_xStart, AWS_yStart, AWS_finalWidth, AWS_finalHeight);
    context.lineWidth = 7;
    context.strokeStyle = "yellow";
    context.stroke();

    // ground truth -> implement
    context.beginPath();
    context.rect(ground_xStart, ground_yStart, ground_width, ground_height);
    context.lineWidth = 3;
    context.strokeStyle = "red";
    context.stroke();

    // get the intersection area
    let findInter = findIntersection();
    let i = findInter.interSection;
    // draw the intersection rectangle
    context.beginPath();
    context.rect(i[0], i[1], i[2], i[3]);
    context.lineWidth = 7;
    // context.fillStyle = "blue";
    // context.fill();
    context.strokeStyle = "blue";
    context.stroke();

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./image.png", buffer);
  });
}

// https://www.geeksforgeeks.org/intersecting-rectangle-when-bottom-left-and-top-right-corners-of-two-rectangles-are-given/
export function findIntersection() {
  let interSection = [];

  // AWS bounding box
  const x1 = AWS_xStart;
  const y1 = AWS_yStart + AWS_finalHeight;
  const x2 = AWS_xStart + AWS_finalWidth;
  const y2 = AWS_yStart;

  // "ground truth"
  const x3 = ground_xStart;
  const y3 = ground_yStart + ground_height;
  const x4 = ground_xStart + ground_width;
  const y4 = ground_yStart;

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
  let intersection_xStart = x7;
  let intersection_yStart = y7;
  let interSectionWidth = x8 - x7;
  let interSectionHeight = y8 - y7;

  interSection = [
    intersection_xStart,
    intersection_yStart,
    interSectionWidth,
    interSectionHeight,
  ];

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
  let intersectionArea = findInter.interSectionArea;
  // console.log("interSection area: ", interArea);

  // get the union of the two rectangles
  // 1. calculate the area of the individual boxes
  let areaAWS = AWS_finalWidth * AWS_finalHeight;
  let groundTruthArea = ground_width * ground_height;
  let bothAreas = areaAWS + groundTruthArea;

  // union is the union minus the part which is included in both rectangles,
  // otherwise we would have the intersection area twice
  let union = bothAreas - intersectionArea;

  // divide intersection / union
  let IOU = intersectionArea / union;
  console.log("IOU: ", IOU);
}
