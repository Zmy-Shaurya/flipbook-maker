// Brightness / contrast / gamma / saturation / grayscale / invert.
// Applied to pixels after a frame has been drawn onto a canvas.

function readLightingSettings() {
  return {
    brightness: Number(el.brightness.value),
    contrast: Number(el.contrast.value),
    gamma: Number(el.gamma.value),
    saturation: Number(el.saturation.value) / 100, // 1 = unchanged
    grayscale: el.grayscale.checked,
    invert: el.invert.checked,
  };
}

// Brightness, contrast and gamma only depend on the input value (0-255), so we
// precompute a 256-entry lookup table instead of doing the maths per pixel.
// It is cached until one of those three sliders changes.
let cachedTableKey = '';
let cachedTable = null;

function getToneTable({ brightness, contrast, gamma }) {
  const key = `${brightness}|${contrast}|${gamma}`;
  if (key === cachedTableKey) return cachedTable;

  const table = new Uint8ClampedArray(256); // clamps to 0-255 for us
  const c = contrast * 2.55;
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));

  for (let value = 0; value < 256; value++) {
    let x = Math.pow(value / 255, 1 / gamma) * 255 + brightness * 2.55;
    x = contrastFactor * (x - 128) + 128;
    table[value] = x;
  }

  cachedTableKey = key;
  cachedTable = table;
  return table;
}

function applyLighting(ctx, width, height) {
  const settings = readLightingSettings();
  const isUnchanged =
    settings.brightness === 0 &&
    settings.contrast === 0 &&
    settings.gamma === 1 &&
    settings.saturation === 1 &&
    !settings.grayscale &&
    !settings.invert;
  if (isUnchanged) return;

  const table = getToneTable(settings);
  const saturation = settings.grayscale ? 0 : settings.saturation;
  const image = ctx.getImageData(0, 0, width, height);
  const pixels = image.data; // r, g, b, a, r, g, b, a, ...

  for (let i = 0; i < pixels.length; i += 4) {
    let r = table[pixels[i]];
    let g = table[pixels[i + 1]];
    let b = table[pixels[i + 2]];

    if (saturation !== 1) {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      r = luma + (r - luma) * saturation;
      g = luma + (g - luma) * saturation;
      b = luma + (b - luma) * saturation;
    }
    if (settings.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }
  ctx.putImageData(image, 0, 0);
}

// ----- controls -----

const lightingSliders = [
  { slider: el.brightness, label: el.brightnessLabel, format: (v) => v },
  { slider: el.contrast, label: el.contrastLabel, format: (v) => v },
  { slider: el.gamma, label: el.gammaLabel, format: (v) => Number(v).toFixed(2) },
  { slider: el.saturation, label: el.saturationLabel, format: (v) => v },
];

lightingSliders.forEach(({ slider, label, format }) => {
  slider.oninput = () => {
    label.textContent = format(slider.value);
    redrawPreview();
  };
});

el.grayscale.onchange = () => redrawPreview();
el.invert.onchange = () => redrawPreview();

el.lightingReset.onclick = () => {
  el.brightness.value = 0;
  el.contrast.value = 0;
  el.gamma.value = 1;
  el.saturation.value = 100;
  el.grayscale.checked = false;
  el.invert.checked = false;

  el.brightnessLabel.textContent = '0';
  el.contrastLabel.textContent = '0';
  el.gammaLabel.textContent = '1.00';
  el.saturationLabel.textContent = '100';
  redrawPreview();
};
