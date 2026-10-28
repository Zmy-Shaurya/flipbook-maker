// The two live previews: the big frame with crop overlay, and the small
// "what will be printed" thumbnail.

const PREVIEW_MAX_WIDTH = 960;
const THUMBNAIL_HEIGHT = 160;

function redrawPreview() {
  if (!state.videoLoaded || !el.video.videoWidth) return;

  el.scrubber.value = el.video.currentTime;
  el.currentTime.textContent = el.video.currentTime.toFixed(2) + 's';

  drawMainPreview();
  drawOutputThumbnail();
}

function drawMainPreview() {
  const [rotatedWidth, rotatedHeight] = getRotatedSize();
  const scale = Math.min(1, PREVIEW_MAX_WIDTH / rotatedWidth);
  const width = Math.round(rotatedWidth * scale);
  const height = Math.round(rotatedHeight * scale);

  // Resizing a canvas clears it, so only do it when the size really changed.
  if (el.previewCanvas.width !== width || el.previewCanvas.height !== height) {
    el.previewCanvas.width = width;
    el.previewCanvas.height = height;
  }
  renderFrame(previewCtx, width, height, fullCrop());

  // Darken everything outside the crop, then outline the crop.
  const { crop } = state;
  const x = crop.x * width;
  const y = crop.y * height;
  const w = crop.w * width;
  const h = crop.h * height;

  previewCtx.fillStyle = 'rgba(0,0,0,.6)';
  previewCtx.fillRect(0, 0, width, y); // above
  previewCtx.fillRect(0, y + h, width, height - y - h); // below
  previewCtx.fillRect(0, y, x, h); // left
  previewCtx.fillRect(x + w, y, width - x - w, h); // right

  previewCtx.strokeStyle = '#ffd400';
  previewCtx.lineWidth = 2;
  previewCtx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function drawOutputThumbnail() {
  const [rotatedWidth, rotatedHeight] = getRotatedSize();
  const { crop } = state;
  const aspect = (crop.w * rotatedWidth) / (crop.h * rotatedHeight);
  const width = Math.round(THUMBNAIL_HEIGHT * aspect);

  if (el.outputCanvas.width !== width || el.outputCanvas.height !== THUMBNAIL_HEIGHT) {
    el.outputCanvas.width = width;
    el.outputCanvas.height = THUMBNAIL_HEIGHT;
  }
  renderFrame(outputCtx, width, THUMBNAIL_HEIGHT, crop);
}
