// Helpers for grabbing frames at exact times (used by PDF export and the flip preview).

// Resolves once the video is showing the frame at `time`.
function seekTo(time) {
  return new Promise((resolve) => {
    if (Math.abs(el.video.currentTime - time) < 1e-4) {
      resolve(); // already there, 'seeked' would never fire
      return;
    }
    const onSeeked = () => {
      el.video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    el.video.addEventListener('seeked', onSeeked);
    el.video.currentTime = time;
  });
}

// Waits one paint so the seeked frame is actually ready to be drawn.
const nextAnimationFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
