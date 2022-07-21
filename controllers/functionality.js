import express from "express";
import multer from "multer";
import {
  RekognitionClient,
  DetectLabelsCommand,
} from "@aws-sdk/client-rekognition";
import fs, { fdatasync } from "fs";

import exiftool from "node-exiftool";
import exiftoolBin from "dist-exiftool";
import { footballLabels, officeLabels } from "../helper/labels.js";
import sizeOf from "buffer-image-size";
// import exif from "exiftool";

const router = express.Router();
const upload = multer();
const rekognitionClient = new RekognitionClient({ region: "eu-central-1" });

// an instance of image in order to get the dimensions
// const myImage = new Image();

router.post("/", upload.array("files"), async (req, res) => {
  try {
    // Detects instances of real-world entities within an image as input.
    const detectLabelsCommand = new DetectLabelsCommand({
      Image: { Bytes: req.files[0].buffer },
    });
    // sends the detectLabelsCommand to the client
    const response = await rekognitionClient.send(detectLabelsCommand);
    // return the labels from the response
    const labels = response.Labels;
    // array for the labels
    const labelArr = [];
    // array for the bounding box for detected person
    const personBoundingBox = [];

    // the attributes of a bounding box
    let bb_height;
    let bb_width;
    let bb_top;
    let bb_left;

    // variables for the width and height of the input image
    let imageWidth;
    let imageHeight;

    // get the labels detected from the image
    response.Labels.forEach((result) => labelArr.push(result.Name));
    console.log("labels found: ", labelArr);

    // get dimension of the request image
    var dimensions = sizeOf(req.files[0].buffer);
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
      "finalHeight: " + finalHeight,
      "finalWidth: " + finalWidth,
      "topCoordinate: " + topCoordinate,
      "leftCoordinate: " + leftCoordinate
    );

    // draw the bounding box on the image

    // --------- edit and read metadata with exiftool ---------
    try {
      const ep = new exiftool.ExiftoolProcess(exiftoolBin);

      // save the file from the request into the filesystem
      fs.writeFile("downloadImage.jpeg", req.files[0].buffer, function (err) {
        if (err) throw err;
        // console.log("file saved");
      });
      const image = "downloadImage.jpeg";

      ep.open()
        .then(() =>
          ep.readMetadata(image, ["-File:all"]).then(
            // put the object labels into the image's metadata
            ep.writeMetadata(
              image,
              {
                // all: "", // remove existing tags
                comment: "Exiftool rules!",
                subject: labelArr,
              },
              ["overwrite_original"]
            )
          )
        )
        // read directory
        .then(() => ep.readMetadata(image, ["-File:all"]))
        .then(console.log, console.error)
        .then(() => ep.close())
        .catch(console.error);
    } catch (err) {}
    // --------- exiftool stuff ends ---------

    console.log("personBoundingBox: ", personBoundingBox);
    console.log("response: ", response);

    // // check which labels in the image overlap with the predefined office labels
    // const commonsWithOffice = officeLabels.filter((x) => labelArr.includes(x));
    // console.log(
    //   "The common elements with office labels are: ",
    //   commonsWithOffice
    // );

    // // check which labels in the image overlap with the predefined football labels
    // const commonsWithFootball = footballLabels.filter((x) =>
    //   labelArr.includes(x)
    // );
    // console.log(
    //   "The common elements with football labels are: ",
    //   commonsWithFootball
    // );

    res.send(labels ?? "No labels found");
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

export default router;

// ---------------- outdated code, maybe useful for later

// for (let i = 0; i < labelArr.length; i++) {
//   for (let j = 0; j < response.Labels.Instances.length; j++) {
//     labelArr.push(j.Instances.length);
//   }
// }

// response.Labels.forEach(function (result) {
//   result.Instances.forEach((instance) =>
//     labelArr.push(instance.BoundingBox.Height)
//   );
// });

// for each Label found
// response.Labels.forEach(function (result) {
//   // insert instance.boundingboxes into the labelArr array to correct position
//   result.Instances.forEach(function (instance) {
//     console.log("height: " + instance.BoundingBox.Height);
//     const pos = 0;
//     labelArr.splice(pos + 1, 0, instance.BoundingBox.Height);
//   });
// });
