import express from "express";
import multer from "multer";
import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectLabelsRequest,
} from "@aws-sdk/client-rekognition";
import sizeOf from "buffer-image-size";
import {
  drawBoundingBoxes,
  findIntersection,
  calculateIOU,
} from "./BoundingBoxes.js";
import { editMetadata } from "./exifTool.js";
import fs from "fs";
import { computerValues } from "../helper/labels.js";
import { determineGroundTruthArray, groundTruthArray } from "./groundTruth.js";

// import { checkCategories } from "./imageCategories.js";
const router = express.Router();
const upload = multer();
const rekognitionClient = new RekognitionClient({ region: "eu-central-1" });

// array for the labels
export let labelArr = [];

// array to be inserted to the image metadata
export let labels_with_bboxes = [];

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

// label of the object of the bounding box
let objectLabel;

// array for the bounding box for detected object
export let boundingBoxes = [];

router.post("/", upload.array("files"), async (req, res) => {
  try {
    buffer = req.files[0].buffer; // error handling here

    // initialize arrays that contain image data as empty
    boundingBoxes.length = 0;
    labelArr.length = 0;
    labels_with_bboxes.length = 0;

    // save the file from the request into the filesystem
    // saveFile(req.files[0], buffer);
    fs.writeFile(
      `downloads/download_${req.files[0].originalname}`,
      buffer,
      function (err) {
        if (err) throw err;
        // console.log("file saved");
      }
    );
    requestImage = `downloads/download_${req.files[0].originalname}`;
    // console.log("requestImage: ", requestImage);

    // Detects instances of real-world entities within an image as input.
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: { Bytes: buffer },
      // MinConfidence: 60,
    });

    // sends the detectLabelsCommand to the client
    const response = await rekognitionClient.send(detectLabelsCommand);

    // get the labels detected from the image
    response.Labels.forEach((result) => labelArr.push(result.Name));

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

    // clone the intersection array to a nested array
    // labels_with_bboxes = intersection.map((x) => [x]);
    // console.log("labels with bboxes: ", labels_with_bboxes);

    console.log("intersection array: ", intersection);

    // loop through all labels
    response.Labels.forEach((label) => {
      // if label is found in intersection
      if (intersection.includes(label.Name)) {
        //   loop through all instances of a label
        if (label.Instances.length == 0) {
          console.log(
            `No AWS bounding boxes provided for recognised object: ${label.Name}`
          );
          labels_with_bboxes.push({ objectLabel: label.Name });
        } else {
          // for all labels with bounding boxes assigned
          label.Instances.forEach((instance) => {
            // get the location of the bounding box in pixels
            objectLabel = label.Name;
            AWS_height = instance.BoundingBox.Height * imageHeight;
            AWS_width = instance.BoundingBox.Width * imageWidth;
            AWS_yStart = instance.BoundingBox.Top * imageHeight;
            AWS_xStart = instance.BoundingBox.Left * imageWidth;

            // push all instances of an object into the bounding box array
            boundingBoxes.push({
              objectLabel,
              AWS_height,
              AWS_yStart,
              AWS_xStart,
              AWS_width,
            });

            labels_with_bboxes.push({
              objectLabel: label.Name,
              AWS_height: instance.BoundingBox.Height * imageHeight,
              AWS_width: instance.BoundingBox.Width * imageWidth,
              AWS_yStart: instance.BoundingBox.Top * imageHeight,
              AWS_xStart: instance.BoundingBox.Left * imageWidth,
            });
          });
        }
      }
    });

    // console.log("labelArray: ", labelArr);

    console.log("labels with bboxes after pushing: ", labels_with_bboxes);

    console.log("Bounding boxes array: ", boundingBoxes);
    // if AWS bounding boxes are available for this image
    if (boundingBoxes.length > 0) {
      // determine which ground truth array is being used
      determineGroundTruthArray(requestImage);
      // find intersection of each AWS bounding box and respective ground truth
      findIntersection(groundTruthArray);
      // Draw the bounding boxes
      drawBoundingBoxes(groundTruthArray);
      // calculate the IOU for each bounding box and ground truth
      calculateIOU();
      // Write labels into the image metadata
      editMetadata(requestImage);
    } else {
      console.log(
        "AWS did not provide any bounding boxes for the objects in this image!"
      );
    }

    res.send(response.Labels ?? "No labels detected from the image!");
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

export default router;
