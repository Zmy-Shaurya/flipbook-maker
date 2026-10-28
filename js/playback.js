// Play / pause, the scrub bar, and the "set start / set end" buttons.

el.playButton.onclick = togglePlayback;

el.scrubber.oninput = (event) => {
  if (state.isPlaying) togglePlayback();
  el.video.currentTime = Number(event.target.value);
};

el.setStartButton.onclick = () => {
  el.startTime.value = el.video.currentTime.toFixed(2);
  updateSummary();
};

el.setEndButton.onclick = () => {
  el.endTime.value = el.video.currentTime.toFixed(2);
  updateSummary();
};

function togglePlayback() {
  if (!state.videoLoaded) return;

  if (state.isPlaying) {
    el.video.pause();
    state.isPlaying = false;
    el.playButton.textContent = 'Play';
    return;
  }

  // Start from the beginning of the clip if we are outside it.
  const start = Number(el.startTime.value);
  const end = Number(el.endTime.value);
  if (el.video.currentTime < start || el.video.currentTime >= end) {
    el.video.currentTime = start;
  }

  el.video.play();
  state.isPlaying = true;
  el.playButton.textContent = 'Pause';
  playbackLoop();
}

// Redraws every animation frame while playing, looping inside the clip range.
function playbackLoop() {
  if (!state.isPlaying) return;

  if (el.video.currentTime >= Number(el.endTime.value)) {
    el.video.currentTime = Number(el.startTime.value);
  }
  redrawPreview();
  requestAnimationFrame(playbackLoop);
}
