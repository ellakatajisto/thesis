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
  determineGroundTruthArray,
} from "./BoundingBoxes.js";
import { editMetadata } from "./exifTool.js";
import fs from "fs";
import { computerValues } from "../helper/labels.js";

// import { checkCategories } from "./imageCategories.js";
const router = express.Router();
const upload = multer();
const rekognitionClient = new RekognitionClient({ region: "eu-central-1" });

// array for the labels
export let labelArr = [];

// input image fileName
export let requestImage;

// variables for the width and height of the input image
export let imageWidth;
export let imageHeight;

// the dimensions of the AWS bounding box in pixels
export let AWS_height;
export let AWS_width;
export let AWS_yStart;
export let AWS_xStart;

// variable for the data from the request image
let buffer;

// the dimensions of the AWS bounding box in relation to the input image
let bb_height;
let bb_width;
let topCoordinate;
let leftCoordinate;

// label of the object of the bounding box
let objectLabel;

// array for the bounding box for detected object
export let BoundingBoxes = [];

router.post("/", upload.array("files"), async (req, res) => {
  try {
    buffer = req.files[0].buffer; // error handling here

    // initialize arrays that contain image data as empty
    BoundingBoxes.length = 0;
    labelArr.length = 0;

    // save the file from the request into the filesystem
    fs.writeFile(
      `download_${req.files[0].originalname}`,
      buffer,
      function (err) {
        if (err) throw err;
        // console.log("file saved");
      }
    );
    requestImage = `download_${req.files[0].originalname}`;
    console.log("requestImage: ", requestImage);

    // Detects instances of real-world entities within an image as input.
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: { Bytes: buffer },
    });

    // sends the detectLabelsCommand to the client
    const response = await rekognitionClient.send(detectLabelsCommand);
    // get the labels detected from the image
    response.Labels.forEach((result) => labelArr.push(result.Name));
    // console.log("labels found: ", labelArr);
    res.send(response.Labels ?? "No labels detected from the image!");

    // get dimension of the request image
    var dimensions = sizeOf(buffer);
    imageWidth = dimensions.width;
    imageHeight = dimensions.height;

    // build an intersection array of labels and computerValues
    let intersection = [];
    response.Labels.forEach((label) => {
      if (computerValues.includes(label.Name)) {
        intersection.push(label.Name);
      }
    });

    console.log("intersection array: ", intersection);

    // loop through all labels
    response.Labels.forEach((label) => {
      // if label is found in intersection
      if (intersection.includes(label.Name)) {
        // loop through all instances of a label
        label.Instances.forEach((instance) => {
          console.log("label.Instances from the loop:", instance);
          // assign values
          objectLabel = label.Name;
          bb_height = instance.BoundingBox.Height;
          bb_width = instance.BoundingBox.Width;
          topCoordinate = instance.BoundingBox.Top;
          leftCoordinate = instance.BoundingBox.Left;

          // get the location of the bounding box in pixels
          AWS_height = bb_height * imageHeight;
          AWS_width = bb_width * imageWidth;
          AWS_yStart = topCoordinate * imageHeight;
          AWS_xStart = leftCoordinate * imageWidth;

          // push all instances of an object into the bounding box array
          BoundingBoxes.push({
            objectLabel,
            AWS_height,
            AWS_yStart,
            AWS_xStart,
            AWS_width,
          });
        });
      }
    });

    console.log(
      "AWS bounding box: ",
      "AWS_height: ",
      AWS_height,
      "AWS_width: ",
      AWS_width,
      "AWS_yStart: ",
      AWS_yStart,
      "AWS_xStart: ",
      AWS_xStart
    );

    // determine which ground truth array is being used
    determineGroundTruthArray(requestImage);

    // find Intersection of each AWS bounding box and ground truth
    findIntersection();

    // Draw bounding boxes
    drawBoundingBoxes();

    // calculate the IOU for each bounding box and ground truth
    calculateIOU();

    // Write labels into the image metadata
    editMetadata(requestImage);

    // console.log("BoundingBoxes: ", BoundingBoxes);
    // console.log("response: ", response);

    // call the checkCategories function here
    // checkCategories();

    // empty labelArr so it's empty for the next time (i guess this works)
    // labelArr = [];
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

export default router;
