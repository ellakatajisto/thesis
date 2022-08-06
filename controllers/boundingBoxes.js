import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import {
  imageWidth,
  imageHeight,
  boundingBoxes,
  requestImage,
  // groundTruthArray,
} from "./functionality.js";

// variable for the intersection area
let interSectionArea;

// coordinates of the intersection rectangles for drawing them
let interSectionCoordinates = [];

// array for the intersection area values for all bounding boxes
let interSectionArray = [];

// combine AWS bounding boxes and their respective ground truths into one array
let bb_groundTruth_combined = [];

// array for the IOU values
let IOU_array = [];

export function drawBoundingBoxes(groundTruthArray) {
  const canvas = createCanvas(imageWidth, imageHeight);
  const context = canvas.getContext("2d");

  loadImage(requestImage).then((image) => {
    context.drawImage(image, 0, 0);

    // draw AWS bounding boxes
    boundingBoxes.forEach((box) => {
      // console.log("box from drawImage:", box);
      context.beginPath();
      // parameters: x and y start, width of box, height of box
      context.rect(
        box.AWS_xStart,
        box.AWS_yStart,
        box.AWS_width,
        box.AWS_height
      );
      context.lineWidth = 4;
      context.strokeStyle = "yellow";
      context.stroke();
    });

    // if the ground truth for the image name doesn't exist -> only show AWS boxes
    // Draw the ground truth bounding boxes
    if (groundTruthArray.length > 0) {
      groundTruthArray.forEach((i) => {
        context.beginPath();
        context.rect(i.xStart, i.yStart, i.width, i.height);
        context.lineWidth = 4;
        context.strokeStyle = "red";
        context.stroke();
      });
    } else {
      console.log("No ground truths found for this image!");
    }

    // draw the intersection rectangles
    interSectionCoordinates.forEach((r) => {
      // console.log("intersection rectangle:", r);
      context.beginPath();
      context.rect(
        r.intersection_xStart,
        r.intersection_yStart,
        r.interSectionWidth,
        r.interSectionHeight
      );
      context.lineWidth = 2;
      context.strokeStyle = "blue";
      // context.fillStyle = "blue";
      // context.fill();
      context.stroke();
    });

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./boundingBoxImage.png", buffer);
  });
}

// https://www.geeksforgeeks.org/intersecting-rectangle-when-bottom-left-and-top-right-corners-of-two-rectangles-are-given/
export function findIntersection(groundTruthArray) {
  // coordinates for the intersection rectangle
  let intersection_xStart;
  let intersection_yStart;
  let interSectionWidth;
  let interSectionHeight;

  // empty the arrays in between images
  interSectionArray.length = 0;
  interSectionCoordinates.length = 0;

  // helper function: combine two arrays of objects into one array of arrays
  const zip = (a1, a2) => a1.map((x, i) => [x, a2[i]]);

  // if ((BoundingBoxes.length = !0)) {
  bb_groundTruth_combined = zip(groundTruthArray, boundingBoxes);
  console.log("COMBINED ARRAY: ", bb_groundTruth_combined);
  // } else {
  //   console.log("There were no bounding boxes found in this image.");
  // }

  // for each object in the bounding box & ground truth array
  bb_groundTruth_combined.forEach((i) => {
    // console.log("bb_groundTruth_combined: ", i);

    // ground truth coordinates
    let x1 = i[0].xStart;
    let y1 = i[0].yStart + i[0].height;
    let x2 = i[0].xStart + i[0].width;
    let y2 = i[0].yStart;

    // AWS coordinates
    let x3 = i[1].AWS_xStart;
    let y3 = i[1].AWS_yStart + i[1].AWS_height;
    let x4 = i[1].AWS_xStart + i[1].AWS_width;
    let y4 = i[1].AWS_yStart;

    // get bottom-left point of intersection rectangle
    let x5 = Math.max(x1, x3);
    let y5 = Math.min(y1, y3); // this was changed from the original to min

    // gives top-right point of intersection rectangle
    let x6 = Math.min(x2, x4);
    let y6 = Math.max(y2, y4); // this was changed from the original to max

    // gives top left point of intersection rectangle
    let x7 = x5;
    let y7 = y6;

    // gives bottom right point of intersection rectangle
    let x8 = x6;
    let y8 = y5;

    // data needed for drawing the rectangle
    // x7 is the x starting point, y7 the y starting point
    intersection_xStart = x7;
    intersection_yStart = y7;
    interSectionWidth = x8 - x7;
    interSectionHeight = y8 - y7;

    interSectionCoordinates.push({
      intersection_xStart,
      intersection_yStart,
      interSectionWidth,
      interSectionHeight,
    });

    interSectionArea = interSectionWidth * interSectionHeight;

    interSectionArray.push(interSectionArea);
  });

  // if (x5 > x6 || y5 > y6) {
  //   console.log("NO INTERSECTION FOUND!!!");
  // }
  console.log("interSectionCoordinates array: ", interSectionCoordinates);

  return { interSectionCoordinates, interSectionArray };
}

// https://medium.com/analytics-vidhya/iou-intersection-over-union-705a39e7acef
export function calculateIOU() {
  // get the intersection areas for all AWS predictions and their ground truths in the image

  // console.log("intersection array from calculate IOU: ", interSectionArray);
  IOU_array.length = 0;
  let groundTruthArea = 0;
  let areaAWS = 0;
  let bothAreas = 0;
  let union = 0;

  // for each ground truth and AWS bounding box
  bb_groundTruth_combined.forEach((i, index) => {
    // assign index of interSectionArray to the looped array in order to loop both at the same time
    let interSect = interSectionArray[index];
    areaAWS = i[1].AWS_width * i[1].AWS_height;
    groundTruthArea = i[0].width * i[0].height;
    bothAreas = areaAWS + groundTruthArea;
    union = bothAreas - interSect;

    // divide intersection / union
    let IOU = interSect / union;
    IOU_array.push(IOU);
  });
  console.log("IOU ARRAY: ", IOU_array);
}
