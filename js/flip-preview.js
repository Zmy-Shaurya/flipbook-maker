// "Flip book preview": renders small versions of every frame up front, then
// flips through them like the finished book would.

const FLIP_FRAME_HEIGHT = 240;
const FLIP_JPEG_QUALITY = 0.8;

let flipFrames = []; // data URLs of the rendered frames
let flipIndex = 0; // frame currently shown
let flipTimer = null; // setInterval id while playing
let flipSettingsKey = ''; // settings the frames were built with
let flipIsBuilding = false;

// A fingerprint of everything that changes how the frames look.
// If it is unchanged, pressing Build again just resumes playing.
function currentSettingsKey() {
  return JSON.stringify([
    computeFrameTimes(),
    state.rotation,
    el.flipHorizontal.checked,
    state.crop,
    readLightingSettings(),
  ]);
}

function resetFlipPreview() {
  stopFlipping();
  flipFrames = [];
  flipSettingsKey = '';

  el.flipImage.style.display = 'none';
  el.flipPlaceholder.style.display = '';
  [el.flipPlay, el.flipRealSpeed, el.flipScrubber].forEach((control) => {
    control.disabled = true;
  });
  el.flipCounter.textContent = '0 / 0';
  el.flipStatus.textContent = '';
}

function showFlipFrame(index) {
  if (!flipFrames.length) return;

  flipIndex = (index + flipFrames.length) % flipFrames.length; // wraps around
  el.flipImage.src = flipFrames[flipIndex];
  el.flipScrubber.value = flipIndex;
  el.flipCounter.textContent = `${flipIndex + 1} / ${flipFrames.length}`;
}

function stopFlipping() {
  if (flipTimer) {
    clearInterval(flipTimer);
    flipTimer = null;
  }
  el.flipPlay.textContent = 'Play';
}

function startFlipping() {
  stopFlipping();
  const fps = Math.min(60, Math.max(1, Number(el.flipFps.value) || 12));
  flipTimer = setInterval(() => showFlipFrame(flipIndex + 1), 1000 / fps);
  el.flipPlay.textContent = 'Pause';
}

// The speed at which the book plays at the same pace as the original clip.
function realTimeFps() {
  const clipLength = Number(el.endTime.value) - Number(el.startTime.value);
  const fps = computeFrameTimes().length / Math.max(clipLength, 0.001);
  return Math.max(1, Math.min(60, Math.round(fps)));
}

// ----- controls -----

el.flipPlay.onclick = () => (flipTimer ? stopFlipping() : startFlipping());

el.flipFps.oninput = () => {
  if (flipTimer) startFlipping(); // restart with the new speed
};

el.flipRealSpeed.onclick = () => {
  el.flipFps.value = realTimeFps();
  if (flipTimer) startFlipping();
};

el.flipScrubber.oninput = (event) => {
  stopFlipping();
  showFlipFrame(Number(event.target.value));
};

el.flipBuild.onclick = async () => {
  if (flipIsBuilding || !state.videoLoaded) return;
  if (state.isPlaying) togglePlayback();

  const settingsKey = currentSettingsKey();
  if (settingsKey === flipSettingsKey && flipFrames.length) {
    startFlipping(); // nothing changed, reuse the frames
    return;
  }

  resetFlipPreview();
  flipIsBuilding = true;
  el.flipBuild.disabled = true;
  el.generateButton.disabled = true;

  const times = computeFrameTimes();
  const [rotatedWidth, rotatedHeight] = getRotatedSize();
  const aspect = (state.crop.w * rotatedWidth) / (state.crop.h * rotatedHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(FLIP_FRAME_HEIGHT * aspect));
  canvas.height = FLIP_FRAME_HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  try {
    const frames = [];
    for (let i = 0; i < times.length; i++) {
      await seekTo(times[i]);
      await nextAnimationFrame();
      renderFrame(ctx, canvas.width, canvas.height, state.crop);
      frames.push(canvas.toDataURL('image/jpeg', FLIP_JPEG_QUALITY));

      if (i % 5 === 0) {
        el.flipStatus.textContent = `Preparing frame ${i + 1} of ${times.length}…`;
      }
    }

    flipFrames = frames;
    flipSettingsKey = settingsKey;

    el.flipScrubber.max = frames.length - 1;
    [el.flipPlay, el.flipRealSpeed, el.flipScrubber].forEach((control) => {
      control.disabled = false;
    });
    el.flipImage.style.display = 'block';
    el.flipPlaceholder.style.display = 'none';

    el.flipFps.value = realTimeFps();
    showFlipFrame(0);
    startFlipping();
    el.flipStatus.textContent =
      `${frames.length} frames. "Real-time" matches the original video speed; a fast thumb ` +
      'flip is usually 15–25 frames/sec. Change any setting and click Build preview again ' +
      'to refresh.';
  } catch (err) {
    el.flipStatus.textContent = 'Preview failed: ' + err.message;
  } finally {
    flipIsBuilding = false;
    el.flipBuild.disabled = false;
    updateSummary();
  }
};
