import { createCanvas, loadImage } from "canvas";
import fs from "fs";
// import {  } from "./functionality"

const width = 1200;
const height = 600;

export function create() {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "yellow";
  context.fillRect(0, 0, width, height);

  loadImage("downloadImage.jpeg").then((image) => {
    context.drawImage(image, 425, 225);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./image.png", buffer);
  });
}
