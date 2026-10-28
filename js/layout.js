// Page maths: how many frames fit on a page, which video times become frames,
// and the summary line shown under the settings.

const PAPER_SIZES_INCHES = {
  a4: [8.27, 11.69],
  letter: [8.5, 11],
  legal: [8.5, 14],
  a3: [11.69, 16.54],
};
const PAGE_MARGIN = 0.3; // inches, on every side
const FOOTER_SPACE = 0.2; // inches reserved at the bottom for "Page 1 of 5"
const MAX_COMFORTABLE_FRAMES = 600;

// Works out the grid of frames on one page. All sizes are in inches.
// A "cell" is one frame plus its binding tab on the left.
function computePageLayout() {
  let [pageWidth, pageHeight] = PAPER_SIZES_INCHES[el.paper.value];
  if (el.orientation.value === 'l') [pageWidth, pageHeight] = [pageHeight, pageWidth];

  // Before a video is loaded, pretend it is 16:9 so the summary still works.
  const [rotatedWidth, rotatedHeight] = state.videoLoaded ? getRotatedSize() : [16, 9];
  const { crop } = state;
  const aspect = (crop.w * rotatedWidth) / (crop.h * rotatedHeight);

  const frameHeight = Number(el.frameHeight.value);
  const frameWidth = frameHeight * aspect;
  const tabWidth = Number(el.bindingTab.value);
  const cellWidth = tabWidth + frameWidth;
  const cellHeight = frameHeight;

  // The tiny epsilon stops floating point error from losing a whole column.
  const columns = Math.floor((pageWidth - 2 * PAGE_MARGIN + 1e-6) / cellWidth);
  const rows = Math.floor((pageHeight - 2 * PAGE_MARGIN - FOOTER_SPACE + 1e-6) / cellHeight);

  return {
    pageWidth,
    pageHeight,
    frameWidth,
    frameHeight,
    tabWidth,
    cellWidth,
    cellHeight,
    columns,
    rows,
    framesPerPage: columns * rows,
  };
}

// The video times (in seconds) of every frame that will be captured.
function computeFrameTimes() {
  const start = Number(el.startTime.value);
  const end = Number(el.endTime.value);
  const clipLength = Math.max(0, end - start);
  const amount = Math.max(1, Number(el.frameValue.value));

  // Mode is either "frames per second" or "total number of frames".
  const frameCount =
    el.frameMode.value === 'fps'
      ? Math.max(1, Math.round(clipLength * amount))
      : Math.round(amount);

  const times = [];
  for (let i = 0; i < frameCount; i++) {
    const time = start + (i * clipLength) / frameCount;
    times.push(Math.min(el.video.duration - 0.001, time));
  }
  return times;
}

// Rewrites the "N frames, M pages" line and enables/disables the Generate button.
function updateSummary() {
  const layout = computePageLayout();
  const size = `${layout.frameWidth.toFixed(2)}×${layout.frameHeight.toFixed(2)}`;

  if (layout.columns < 1 || layout.rows < 1) {
    el.summary.innerHTML =
      `<span class="warn">Frame is ${layout.cellWidth.toFixed(2)}×${layout.cellHeight.toFixed(2)} ` +
      'in with margin, too big for this paper. Reduce frame height or margin, ' +
      'or switch orientation.</span>';
    el.generateButton.disabled = true;
    return;
  }

  if (!state.videoLoaded) {
    el.summary.textContent =
      `${layout.framesPerPage} frames per page (${layout.columns}×${layout.rows}), ` +
      `each ${size} in.`;
    return;
  }

  const frameCount = computeFrameTimes().length;
  const pageCount = Math.ceil(frameCount / layout.framesPerPage);
  const clipLength = Number(el.endTime.value) - Number(el.startTime.value);
  const framesPerSecond = (frameCount / Math.max(clipLength, 0.001)).toFixed(1);

  let html =
    `<b>${frameCount}</b> frames (${framesPerSecond} per second of clip) · ` +
    `${layout.columns}×${layout.rows} = ${layout.framesPerPage} per page · ` +
    `<b>${pageCount}</b> pages · picture ${size} in`;
  if (frameCount > MAX_COMFORTABLE_FRAMES) {
    html +=
      '<br><span class="warn">That is a thick book. Over ~600 frames the PDF gets large ' +
      'and generation takes a few minutes.</span>';
  }
  el.summary.innerHTML = html;
  el.generateButton.disabled = !(clipLength > 0);
}

// Any setting that changes the frame count or page grid refreshes the summary.
[
  el.frameMode,
  el.frameValue,
  el.paper,
  el.orientation,
  el.frameHeight,
  el.bindingTab,
  el.startTime,
  el.endTime,
].forEach((input) => input.addEventListener('input', updateSummary));
