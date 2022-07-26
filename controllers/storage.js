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
