import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import {
  imageWidth,
  imageHeight,
  AWS_height,
  AWS_width,
  BoundingBoxes,
} from "./functionality.js";
import { groundTruth_IMG_2150 } from "../helper/groundTruths.js";

export function drawBoundingBoxes() {
  const canvas = createCanvas(imageWidth, imageHeight);
  const context = canvas.getContext("2d");

  loadImage("downloadImage.jpeg").then((image) => {
    context.drawImage(image, 0, 0);
    console.log("IMAGE WIDTH FROM DRAWIMAGE: ", image.width);

    // draw AWS bounding boxes
    BoundingBoxes.forEach((box) => {
      // console.log("box from drawImage:", box);
      context.beginPath();
      // parameters: x and y start, width of box, height of box
      context.rect(
        box.AWS_xStart,
        box.AWS_yStart,
        box.AWS_width,
        box.AWS_height
      );
      context.lineWidth = 10;
      context.strokeStyle = "yellow";
      context.stroke();
    });

    // if image is IMG_2510 (come up with a better criteria)
    // Draw the ground truth bounding boxes
    if (image.width == 800) {
      groundTruth_IMG_2150.forEach((i) => {
        context.beginPath();
        context.rect(i.xStart, i.yStart, i.width, i.height);
        context.lineWidth = 10;
        context.strokeStyle = "red";
        context.stroke();
      });
    }

    // get array with intersection rectangles
    let findInter = findIntersection();
    let rectangles = findInter.interSectionCoordinates;
    // draw the intersection rectangles
    rectangles.forEach((r) => {
      // console.log("intersection rectangle:", r);
      context.beginPath();
      context.rect(
        r.intersection_xStart,
        r.intersection_yStart,
        r.interSectionWidth,
        r.interSectionHeight
      );
      context.lineWidth = 4;
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
export function findIntersection() {
  let interSectionCoordinates = [];

  // coordinates for the intersection rectangle
  let intersection_xStart;
  let intersection_yStart;
  let interSectionWidth;
  let interSectionHeight;

  // combine two arrays of objects into one array of arrays
  const zip = (a1, a2) => a1.map((x, i) => [x, a2[i]]);

  // combine AWS bounding boxes and their respective ground truths into one array
  const bb_groundTruth_combined = zip(groundTruth_IMG_2150, BoundingBoxes);
  console.log("COMBINED ARRAY: ", bb_groundTruth_combined);

  // area of the intersection rectangle
  let interSectionArea;

  // array for the intersection area values for all bounding boxes
  let interSectionArray = [];

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

    console.log("interSectionCoordinates array: ", interSectionCoordinates);

    interSectionArea = interSectionWidth * interSectionHeight;

    interSectionArray.push({ interSectionArea });
  });

  // if (x5 > x6 || y5 > y6) {
  //   console.log("NO INTERSECTION FOUND!!!");
  // }

  return { interSectionCoordinates, interSectionArray };
}

// https://medium.com/analytics-vidhya/iou-intersection-over-union-705a39e7acef
export function calculateIOU() {
  // get the intersection of the two rectangles
  let findInter = findIntersection();
  let intersectionArray = findInter.interSectionArray;
  // console.log("interSection area: ", interArea);

  let groundTruthArea;
  let areaAWS;
  let bothAreas;
  let union;

  // for each ground truth
  groundTruth_IMG_2150.forEach((i) => {
    areaAWS = AWS_width * AWS_height;
    groundTruthArea = i.width * i.height;
    bothAreas = areaAWS + groundTruthArea;
    union = bothAreas - intersectionArray[i];

    // divide intersection / union
    let IOU = intersectionArray[i] / union;
    console.log("IOU: ", IOU);
  });

  // get the union of the two rectangles
  // 1. calculate the area of the individual boxes
  // let areaAWS = AWS_width * AWS_height;
  //let groundTruthArea = ground_width * ground_height;
  // let bothAreas = areaAWS + groundTruthArea;

  // union is the union minus the part which is included in both rectangles,
  // otherwise we would have the intersection area twice
  // let union = bothAreas - intersectionArea;

  // divide intersection / union
  // let IOU = intersectionArea / union;
  // console.log("IOU: ", IOU);
}
