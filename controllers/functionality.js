import express from "express";
import multer from "multer";
import {
  RekognitionClient,
  DetectLabelsCommand,
} from "@aws-sdk/client-rekognition";
import sizeOf from "buffer-image-size";
import { create } from "./createCanvas.js";
import { editMetadata } from "./exifTool.js";
// import exif from "exiftool";
// import { checkCategories } from "./imageCategories.js";

const router = express.Router();
const upload = multer();
const rekognitionClient = new RekognitionClient({ region: "eu-central-1" });

// array for the labels
export let labelArr = [];

// variable for the data from the request image
let buffer;

// the attributes of a bounding box
let bb_height;
let bb_width;
let bb_top;
let bb_left;

// variables for the width and height of the input image
let imageWidth;
let imageHeight;

// array for the bounding box for detected person
let personBoundingBox = [];

router.post("/", upload.array("files"), async (req, res) => {
  buffer = req.files[0].buffer;

  try {
    // Detects instances of real-world entities within an image as input.
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: { Bytes: buffer },
    });
    // sends the detectLabelsCommand to the client
    const response = await rekognitionClient.send(detectLabelsCommand);
    // return the labels from the response
    const labels = response.Labels;

    // get the labels detected from the image
    response.Labels.forEach((result) => labelArr.push(result.Name));
    // console.log("labels found: ", labelArr);

    // get dimension of the request image
    var dimensions = sizeOf(buffer);
    imageWidth = dimensions.width;
    imageHeight = dimensions.height;
    console.log(
      "REQ image width: " + imageWidth,
      "REQ image height: " + imageHeight
    );

    // --------- get the bounding box for person ---------

    response.Labels.forEach((label) => {
      // labelArr.push(i.Name);
      if (label.Name == "Person") {
        console.log("PERSON FOUND");
        label.Instances.forEach((instance) => {
          bb_height = instance.BoundingBox.Height;
          bb_width = instance.BoundingBox.Width;
          bb_top = instance.BoundingBox.Top;
          bb_left = instance.BoundingBox.Left;

          personBoundingBox.push(
            "height: " + bb_height,
            "left: " + bb_left,
            "top: " + bb_top,
            "width: " + bb_width
          );
        });
      }
    });

    // get the location of the bounding box in pixels
    let finalHeight = bb_height * imageHeight;
    let finalWidth = bb_width * imageWidth;
    let topCoordinate = bb_top * imageHeight;
    let leftCoordinate = bb_left * imageWidth;

    console.log(
      "AWS bounding box: ",
      "finalHeight: ",
      finalHeight,
      "finalWidth: ",
      finalWidth,
      "topCoordinate: ",
      topCoordinate,
      "leftCoordinate: ",
      leftCoordinate
    );

    // Draw bounding boxes, calculate IOU
    create();

    // Write labels into the image metadata
    editMetadata(buffer);

    // console.log("personBoundingBox: ", personBoundingBox);
    // console.log("response: ", response);

    // call the checkCategories function here
    // checkCategories();

    res.send(labels ?? "No labels found");
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

export default router;
