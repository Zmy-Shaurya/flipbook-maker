// Shared app state. Kept in one object so it is obvious what the app remembers.

// A crop is stored as fractions (0..1) of the rotated frame, not pixels.
const fullCrop = () => ({ x: 0, y: 0, w: 1, h: 1 });

const state = {
  videoLoaded: false,
  isPlaying: false,
  cancelRequested: false, // set by the Cancel button during PDF export

  rotation: 0, // 0, 90, 180 or 270 degrees
  crop: fullCrop(),

  // Format conversion (see converter.js)
  sourceFile: null, // the file the user picked
  isConverting: false,
  triedConverting: false,
};

// Controls that only make sense once a video is loaded.
const controlsNeedingVideo = [el.playButton, el.scrubber, el.generateButton, el.flipBuild];

function setControlsEnabled(enabled) {
  controlsNeedingVideo.forEach((control) => {
    control.disabled = !enabled;
  });
}
