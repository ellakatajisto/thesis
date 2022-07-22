import { createCanvas } from "canvas";

const width = 1200;
const height = 600;

export function create() {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
}
