import express from "express";
import multer from "multer";
import {
  RekognitionClient,
  DetectLabelsCommand,
} from "@aws-sdk/client-rekognition";
import sizeOf from "buffer-image-size";
import {
  drawBoundingBoxes,
  findIntersection,
  calculateIOU,
} from "./boundingBoxes.js";
import { editMetadata } from "./exifTool.js";
// import { checkCategories } from "./imageCategories.js";

const router = express.Router();
const upload = multer();
const rekognitionClient = new RekognitionClient({ region: "eu-central-1" });

// array for the labels
export let labelArr = [];

// variables for the width and height of the input image
export let imageWidth;
export let imageHeight;

// the dimensions of the AWS bounding box in pixels
export let AWS_finalHeight;
export let AWS_finalWidth;
export let AWS_yStart;
export let AWS_xStart;

// variable for the data from the request image
let buffer;

// the dimensions of the AWS bounding box in relation to the input image
let bb_height;
let bb_width;
let topCoordinate;
let leftCoordinate;

// array for the bounding box for detected person
let personBoundingBox = []; // this array is maybe not needed as the individual coordinates are being exported

router.post("/", upload.array("files"), async (req, res) => {
  buffer = req.files[0].buffer;

  try {
    // Detects instances of real-world entities within an image as input.
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: { Bytes: buffer },
    });
    // sends the detectLabelsCommand to the client
    const response = await rekognitionClient.send(detectLabelsCommand);
    // get the labels detected from the image
    response.Labels.forEach((result) => labelArr.push(result.Name));
    // console.log("labels found: ", labelArr);

    // get dimension of the request image
    var dimensions = sizeOf(buffer);
    imageWidth = dimensions.width;
    imageHeight = dimensions.height;

    // get the bounding box for person

    response.Labels.forEach((label) => {
      // labelArr.push(i.Name);
      if (label.Name == "Person") {
        console.log("PERSON FOUND");
        label.Instances.forEach((instance) => {
          bb_height = instance.BoundingBox.Height;
          bb_width = instance.BoundingBox.Width;
          topCoordinate = instance.BoundingBox.Top;
          leftCoordinate = instance.BoundingBox.Left;

          personBoundingBox.push(
            "height: " + bb_height,
            "left: " + leftCoordinate,
            "top: " + topCoordinate,
            "width: " + bb_width
          );
        });
      }
    });

    // get the location of the bounding box in pixels
    AWS_finalHeight = bb_height * imageHeight;
    AWS_finalWidth = bb_width * imageWidth;
    AWS_yStart = topCoordinate * imageHeight;
    AWS_xStart = leftCoordinate * imageWidth;

    console.log(
      "AWS bounding box: ",
      "AWS_finalHeight: ",
      AWS_finalHeight,
      "AWS_finalWidth: ",
      AWS_finalWidth,
      "AWS_yStart: ",
      AWS_yStart,
      "AWS_xStart: ",
      AWS_xStart
    );

    // Draw bounding boxes, calculate IOU
    drawBoundingBoxes();

    // find Intersection of the two rectangles
    findIntersection();

    // calculate the IOU
    calculateIOU();

    // Write labels into the image metadata
    editMetadata(buffer);

    console.log("personBoundingBox: ", personBoundingBox);
    // console.log("response: ", response);

    // call the checkCategories function here
    // checkCategories();

    res.send(response.Labels ?? "No labels detected from the image!");
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

export default router;
