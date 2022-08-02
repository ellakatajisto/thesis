import {
  groundTruth_IMG_2150,
  groundTruth_IMG_2145,
  groundTruth_IMG_9783,
} from "../helper/groundTruths.js";

// which ground truth set is being used for the current image
export let groundTruthArray = [];

// assign the right ground truth array to the image array
export function determineGroundTruthArray(requestImage) {
  console.log("requestImage: ", requestImage);
  // console.log("request image from determine ground truth: ", requestImage);
  if (requestImage == "download_IMG_2150.jpg") {
    groundTruthArray = groundTruth_IMG_2150;
    console.log("groundTruthArray from if statement:", groundTruthArray);
  } else if (requestImage == "download_IMG_2145.jpg") {
    groundTruthArray = groundTruth_IMG_2145;
    //   } else if (requestImage == "download_IMG_9783.jpg") {
    //     groundTruthArray = groundTruth_IMG_9783;
  } else {
    console.log("no ground truths found!");
  }
  console.log("groundTruthArray is: ", groundTruthArray);
  return groundTruthArray;
}
