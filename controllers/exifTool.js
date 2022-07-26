import exiftool from "node-exiftool";
import exiftoolBin from "dist-exiftool";
import { labelArr, labels_with_bboxes } from "./functionality.js";

export function editMetadata(image) {
  try {
    // console.log("labelArr from exifTool function: ", labelArr);
    const ep = new exiftool.ExiftoolProcess(exiftoolBin);

    ep.open()
      .then(() =>
        ep.readMetadata(image, ["-File:all"]).then(
          // put the object labels into the image's metadata
          ep.writeMetadata(
            image,
            {
              // all: "", // remove existing tags
              subject: labels_with_bboxes,
              // subject: JSON.stringify(labels_with_bboxes),
              // ImageRegion: 1,
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
}
