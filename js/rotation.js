// Rotate left/right in 90 degree steps, and mirror horizontally.

function rotateBy(degrees) {
  // Move the crop box so it stays over the same part of the picture.
  const { x, y, w, h } = state.crop;
  if (degrees === 90) {
    state.crop = { x: 1 - y - h, y: x, w: h, h: w };
  } else {
    state.crop = { x: y, y: 1 - x - w, w: h, h: w };
  }

  state.rotation = (state.rotation + degrees + 360) % 360;
  el.rotationLabel.textContent = state.rotation + '°';

  syncCropInputs();
  redrawPreview();
  updateSummary();
}

el.rotateRight.onclick = () => rotateBy(90);
el.rotateLeft.onclick = () => rotateBy(-90);

el.flipHorizontal.onchange = () => {
  // Mirror the crop box too, so it stays over the same part of the picture.
  const { x, w } = state.crop;
  state.crop = { ...state.crop, x: 1 - x - w };
  syncCropInputs();
  redrawPreview();
};
