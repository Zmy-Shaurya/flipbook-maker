// Picking a video file and reacting to the browser loading it.

el.fileInput.onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  state.sourceFile = file;
  state.triedConverting = false;
  loadVideoBlob(file);
  el.meta.textContent = 'Loading…';
  el.status.textContent = '';
};

function loadVideoBlob(blob) {
  if (el.video.src) URL.revokeObjectURL(el.video.src);

  state.videoLoaded = false;
  setControlsEnabled(false);
  resetFlipPreview();
  el.video.src = URL.createObjectURL(blob);
}

// The browser read the video header: show its info and reset the editing controls.
el.video.onloadedmetadata = () => {
  const duration = el.video.duration;

  // Audio-only or unsupported codec: the browser opens it but has no picture.
  if (!el.video.videoWidth) {
    if (!state.triedConverting && state.sourceFile) convertVideo(state.sourceFile);
    else el.meta.textContent = 'This file has no playable picture.';
    return;
  }

  const convertedNote = state.triedConverting ? ' (converted)' : '';
  el.meta.textContent =
    `${el.video.videoWidth}×${el.video.videoHeight}, ${duration.toFixed(2)}s` + convertedNote;

  el.scrubber.max = duration;
  el.startTime.value = 0;
  el.endTime.value = duration.toFixed(2);
  el.startTime.max = el.endTime.max = duration;

  setControlsEnabled(true);
  state.videoLoaded = true;
  state.crop = fullCrop();
  syncCropInputs();
  el.video.currentTime = 0.001; // nudge so the first frame is drawn
  updateSummary();
};

el.video.onerror = () => {
  if (!state.sourceFile || state.isConverting) return;

  if (!state.triedConverting) {
    el.meta.textContent = `${state.sourceFile.name}: converting…`;
    convertVideo(state.sourceFile);
    return;
  }
  const error = el.video.error;
  el.meta.textContent = `Cannot play this video (error ${error ? error.code : '?'}).`;
};

// Whenever a seek finishes, show the new frame.
el.video.onseeked = () => redrawPreview();
