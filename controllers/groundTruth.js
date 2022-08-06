import {
  groundTruth_IMG_2150,
  groundTruth_IMG_2145,
  groundTruth_IMG_9783,
  groundTruth_IMG_9117,
  groundTruth_IMG_9120,
  groundTruth_IMG_9080,
  groundTruth_tonis_office,
} from "../helper/groundTruths.js";

// which ground truth set is being used for the current image
export let groundTruthArray = [];

// assign the right ground truth array to the image array
export function determineGroundTruthArray(requestImage) {
  console.log("requestImage: ", requestImage);
  // console.log("request image from determine ground truth: ", requestImage);
  if (requestImage == "downloads/download_IMG_2150.jpg") {
    groundTruthArray = groundTruth_IMG_2150;
    console.log("groundTruthArray from if statement:", groundTruthArray);
  } else if (requestImage == "downloads/download_IMG_2145.jpg") {
    groundTruthArray = groundTruth_IMG_2145;
  } else if (requestImage == "downloads/download_IMG_9080_copy.JPG") {
    groundTruthArray = groundTruth_IMG_9080;
  } else if (requestImage == "downloads/download_IMG_9117.JPG") {
    groundTruthArray = groundTruth_IMG_9117;
  } else if (requestImage == "downloads/download_IMG_9120.JPG") {
    groundTruthArray = groundTruth_IMG_9120;
  } else if (requestImage == "downloads/download_tonis_office.JPG") {
    groundTruthArray = groundTruth_tonis_office;
  } else {
    groundTruthArray.length = 0;
    console.log("No ground truth array available for this image!");
  }
  console.log("groundTruthArray is: ", groundTruthArray);
  return groundTruthArray;
}
