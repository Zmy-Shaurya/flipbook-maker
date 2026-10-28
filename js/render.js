// Drawing one video frame (rotated, flipped, cropped, lit) onto a canvas.
// Used by the live preview, the flip book preview and the PDF export.

// Size of the video after rotation: [width, height].
function getRotatedSize() {
  const { videoWidth, videoHeight } = el.video;
  const isSideways = state.rotation % 180 !== 0;
  return isSideways ? [videoHeight, videoWidth] : [videoWidth, videoHeight];
}

// Draws the current video frame into ctx at outWidth x outHeight.
// `crop` is in fractions of the rotated frame.
function renderFrame(ctx, outWidth, outHeight, crop) {
  const { videoWidth, videoHeight } = el.video;
  const [rotatedWidth, rotatedHeight] = getRotatedSize();

  // Crop rectangle in rotated-frame pixels.
  const cropLeft = crop.x * rotatedWidth;
  const cropTop = crop.y * rotatedHeight;
  const cropWidth = crop.w * rotatedWidth;
  const cropHeight = crop.h * rotatedHeight;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, outWidth, outHeight);

  // Transforms apply bottom-up: centre + rotate + flip the video, then
  // shift the crop to the origin, then scale it to fill the output.
  ctx.scale(outWidth / cropWidth, outHeight / cropHeight);
  ctx.translate(-cropLeft, -cropTop);
  ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
  ctx.rotate((state.rotation * Math.PI) / 180);
  if (el.flipHorizontal.checked) ctx.scale(-1, 1);
  ctx.drawImage(el.video, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
  ctx.restore();

  applyLighting(ctx, outWidth, outHeight);
}
