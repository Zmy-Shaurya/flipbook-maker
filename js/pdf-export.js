// Builds the printable PDF: frames laid out in a grid, with cut lines,
// a staple guide and a frame number on each binding tab.

const JPEG_QUALITY = 0.88;
const MIN_TAB_FOR_GUIDES = 0.25; // inches; narrower tabs get no staple line or number

el.cancelButton.onclick = () => {
  state.cancelRequested = true;
};

el.generateButton.onclick = async () => {
  if (state.isPlaying) togglePlayback();

  const layout = computePageLayout();
  const times = computeFrameTimes();
  const frameCount = times.length;
  const pageCount = Math.ceil(frameCount / layout.framesPerPage);

  // Off-screen canvas that each frame is rendered into at print resolution.
  const dpi = Number(el.dpi.value);
  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = Math.round(layout.frameWidth * dpi);
  frameCanvas.height = Math.round(layout.frameHeight * dpi);
  const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    unit: 'in',
    format: el.paper.value,
    orientation: el.orientation.value === 'l' ? 'landscape' : 'portrait',
    compress: true,
  });

  // Centre the grid horizontally; start at the top margin.
  const gridLeft = (layout.pageWidth - layout.columns * layout.cellWidth) / 2;
  const gridTop = PAGE_MARGIN;

  // Which video frame goes in each slot (reversed => flip the book the other way).
  const frameOrder = [...Array(frameCount).keys()];
  if (el.reverseOrder.checked) frameOrder.reverse();

  startExportUi(frameCount);
  const startedAt = performance.now();

  try {
    for (let slot = 0; slot < frameCount; slot++) {
      if (state.cancelRequested) {
        el.status.textContent = 'Cancelled.';
        return;
      }

      const frameIndex = frameOrder[slot];
      await seekTo(times[frameIndex]);
      await nextAnimationFrame();
      renderFrame(frameCtx, frameCanvas.width, frameCanvas.height, state.crop);
      const jpeg = frameCanvas.toDataURL('image/jpeg', JPEG_QUALITY);

      const slotOnPage = slot % layout.framesPerPage;
      if (slotOnPage === 0 && slot > 0) pdf.addPage();
      if (slotOnPage === 0) {
        drawPageFooter(pdf, layout, Math.floor(slot / layout.framesPerPage) + 1, pageCount);
      }

      const column = slotOnPage % layout.columns;
      const row = Math.floor(slotOnPage / layout.columns);
      const cellX = gridLeft + column * layout.cellWidth;
      const cellY = gridTop + row * layout.cellHeight;
      drawCell(pdf, layout, jpeg, cellX, cellY, frameIndex + 1);

      el.progress.value = slot + 1;
      const secondsLeft = estimateSecondsLeft(startedAt, slot + 1, frameCount);
      el.status.textContent = `Rendering frame ${slot + 1} of ${frameCount} · about ${secondsLeft}s left`;
    }

    el.status.textContent = 'Building PDF file…';
    await nextAnimationFrame();

    const baseName = (el.fileInput.files[0]?.name || 'video').replace(/\.[^.]+$/, '');
    const fileName = `${baseName}_flipbook_${frameCount}f.pdf`;
    pdf.save(fileName);

    el.status.textContent =
      `Done: ${frameCount} frames on ${pageCount} pages saved as ${fileName}. ` +
      'Print at 100% scale ("Actual size"), cut along the grey lines, stack in order, ' +
      'and bind along the dotted line.';
  } catch (err) {
    el.status.innerHTML =
      `<span class="warn">Failed: ${err.message}. Try fewer frames or a lower print quality.</span>`;
  } finally {
    endExportUi();
  }
};

function startExportUi(frameCount) {
  state.cancelRequested = false;
  el.generateButton.disabled = true;
  el.flipBuild.disabled = true;
  el.cancelButton.hidden = false;
  el.progress.hidden = false;
  el.progress.max = frameCount;
}

function endExportUi() {
  el.generateButton.disabled = false;
  el.flipBuild.disabled = false;
  el.cancelButton.hidden = true;
  el.progress.hidden = true;
}

function estimateSecondsLeft(startedAt, framesDone, frameCount) {
  const elapsed = (performance.now() - startedAt) / 1000;
  return Math.ceil((elapsed / framesDone) * (frameCount - framesDone));
}

function drawPageFooter(pdf, layout, pageNumber, pageCount) {
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  pdf.text(`Page ${pageNumber} of ${pageCount}`, layout.pageWidth / 2, layout.pageHeight - 0.15, {
    align: 'center',
  });
}

// One frame: the picture, a cut-line box around it and its binding tab.
function drawCell(pdf, layout, jpeg, x, y, frameNumber) {
  pdf.addImage(jpeg, 'JPEG', x + layout.tabWidth, y, layout.frameWidth, layout.frameHeight, undefined, 'FAST');

  // Cut line around the whole cell (tab + picture).
  pdf.setDrawColor(150);
  pdf.setLineWidth(0.006);
  pdf.rect(x, y, layout.cellWidth, layout.cellHeight);

  if (layout.tabWidth < MIN_TAB_FOR_GUIDES) return;

  // Dotted staple guide down the middle of the tab.
  const stapleX = x + layout.tabWidth * 0.5;
  pdf.setDrawColor(200);
  pdf.setLineDashPattern([0.03, 0.03], 0);
  pdf.line(stapleX, y + 0.08, stapleX, y + layout.cellHeight - 0.08);
  pdf.setLineDashPattern([], 0);

  // Frame number in the tab's corner.
  pdf.setFontSize(Math.min(10, Math.max(6, layout.frameHeight * 5)));
  pdf.setTextColor(60);
  pdf.text(String(frameNumber), x + 0.06, y + 0.18);
}
