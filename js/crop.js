// Cropping: drag a rectangle on the preview, or type percentages in the boxes.

const MIN_CROP_SIZE = 0.01; // 1% of the frame
const MIN_DRAGGED_CROP = 0.03; // a smaller drag counts as a click and resets the crop

let dragStart = null; // [x, y] fractions where the pointer went down, or null

// Converts a pointer event into [x, y] fractions (0..1) of the preview image.
// The canvas is shown with object-fit: contain, so there may be empty bars
// around the picture that we must not count.
function pointerToFraction(event) {
  const box = el.previewCanvas.getBoundingClientRect();
  const imageAspect = el.previewCanvas.width / el.previewCanvas.height;
  const boxAspect = box.width / box.height;

  let imageWidth = box.width;
  let imageHeight = box.height;
  let offsetX = 0;
  let offsetY = 0;

  if (boxAspect > imageAspect) {
    imageWidth = imageHeight * imageAspect;
    offsetX = (box.width - imageWidth) / 2;
  } else {
    imageHeight = imageWidth / imageAspect;
    offsetY = (box.height - imageHeight) / 2;
  }

  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  return [
    clamp01((event.clientX - box.left - offsetX) / imageWidth),
    clamp01((event.clientY - box.top - offsetY) / imageHeight),
  ];
}

el.previewCanvas.onpointerdown = (event) => {
  if (!state.videoLoaded) return;
  el.previewCanvas.setPointerCapture(event.pointerId);
  dragStart = pointerToFraction(event);
};

el.previewCanvas.onpointermove = (event) => {
  if (!dragStart) return;

  const [x, y] = pointerToFraction(event);
  state.crop = {
    x: Math.min(x, dragStart[0]),
    y: Math.min(y, dragStart[1]),
    w: Math.max(MIN_CROP_SIZE, Math.abs(x - dragStart[0])),
    h: Math.max(MIN_CROP_SIZE, Math.abs(y - dragStart[1])),
  };
  syncCropInputs();
  redrawPreview();
};

el.previewCanvas.onpointerup = () => {
  const { crop } = state;
  if (dragStart && (crop.w < MIN_DRAGGED_CROP || crop.h < MIN_DRAGGED_CROP)) {
    state.crop = fullCrop();
  }
  dragStart = null;
  syncCropInputs();
  redrawPreview();
  updateSummary();
};

// Show state.crop in the four percentage boxes.
function syncCropInputs() {
  const asPercent = (fraction) => Number((fraction * 100).toFixed(1));
  el.cropX.value = asPercent(state.crop.x);
  el.cropY.value = asPercent(state.crop.y);
  el.cropWidth.value = asPercent(state.crop.w);
  el.cropHeight.value = asPercent(state.crop.h);
}

// Read the four boxes back into state.crop, keeping the rectangle inside the frame.
function onCropInputsChanged() {
  let x = Number(el.cropX.value) / 100;
  let y = Number(el.cropY.value) / 100;
  let w = Number(el.cropWidth.value) / 100;
  let h = Number(el.cropHeight.value) / 100;

  x = Math.min(0.99, Math.max(0, x));
  y = Math.min(0.99, Math.max(0, y));
  w = Math.min(1 - x, Math.max(MIN_CROP_SIZE, w));
  h = Math.min(1 - y, Math.max(MIN_CROP_SIZE, h));

  state.crop = { x, y, w, h };
  syncCropInputs();
  redrawPreview();
  updateSummary();
}

[el.cropX, el.cropY, el.cropWidth, el.cropHeight].forEach((input) => {
  input.onchange = onCropInputsChanged;
});

el.cropReset.onclick = () => {
  state.crop = fullCrop();
  syncCropInputs();
  redrawPreview();
  updateSummary();
};
