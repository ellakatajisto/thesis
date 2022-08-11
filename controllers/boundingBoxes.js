import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import {
  imageWidth,
  imageHeight,
  boundingBoxes,
  requestImage,
  // groundTruthArray,
} from "./functionality.js";
import { interSectionCoordinates } from "./calculations.js";

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
