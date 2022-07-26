import exiftool from "node-exiftool";
import exiftoolBin from "dist-exiftool";
import fs, { fdatasync } from "fs";
import labelArr from "./functionality.js";

export function editMetadata(buffer) {
  try {
    const ep = new exiftool.ExiftoolProcess(exiftoolBin);

    // save the file from the request into the filesystem
    fs.writeFile("downloadImage.jpeg", buffer, function (err) {
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
              comment: "Exiftool rules!", // change this?
              subject: labelArr,
            },
            ["overwrite_original"]
          )
        )
      )
      // read directory
      .then(() => ep.readMetadata(image, ["-File:all"]))
      // .then(console.log, console.error)
      .then(() => ep.close())
      .catch(console.error);
  } catch (err) {}
}
