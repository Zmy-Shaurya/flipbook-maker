// Fallback converter for videos the browser cannot play (phone HEVC/H.265, .MOV...).
// Runs ffmpeg-in-WebAssembly inside a worker, entirely on the user's computer.

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/';

let worker = null;
let workerReady = null; // promise, so the 32 MB download only happens once

function loadConverter() {
  if (workerReady) return workerReady;

  const workerUrl = URL.createObjectURL(
    new Blob([CONVERTER_WORKER_SOURCE], { type: 'text/javascript' }),
  );
  worker = new Worker(workerUrl);

  workerReady = new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      if (event.data.type === 'loaded') resolve();
      else if (event.data.type === 'error') reject(new Error(event.data.msg));
    };
    worker.onerror = (event) => reject(new Error(event.message || 'converter failed to start'));
    worker.postMessage({ type: 'load', core: FFMPEG_CORE_URL });
  });

  // If loading fails, allow another attempt next time.
  workerReady.catch(() => {
    workerReady = null;
  });
  return workerReady;
}

// Pick an output format this browser can actually play back.
function chooseOutputFormat() {
  const canPlayH264 = el.video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';

  if (canPlayH264) {
    return {
      fileName: 'out.mp4',
      mimeType: 'video/mp4',
      encoderArgs: ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-pix_fmt', 'yuv420p'],
    };
  }
  return {
    fileName: 'out.webm',
    mimeType: 'video/webm',
    encoderArgs: [
      ...['-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8'],
      ...['-b:v', '6M', '-pix_fmt', 'yuv420p'],
    ],
  };
}

// Shrink so the longest side is at most 1280px (keeps conversion fast), drop audio.
const SCALE_FILTER =
  "scale=w='if(gte(iw,ih),min(1280,iw),-2)':h='if(gte(iw,ih),-2,min(1280,ih))'";

// Sends the file to the worker and resolves with the converted bytes.
function runConversion(fileBytes, format) {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const message = event.data;

      if (message.type === 'progress' && message.p >= 0 && message.p <= 1) {
        el.progress.value = message.p;
        el.status.textContent = `Converting video on this computer… ${Math.round(message.p * 100)}%`;
      } else if (message.type === 'done') {
        resolve(message.data);
      } else if (message.type === 'error') {
        reject(new Error(message.msg));
      }
    };

    const args = ['-i', 'in', '-an', '-vf', SCALE_FILTER, ...format.encoderArgs, format.fileName];
    worker.postMessage({ type: 'run', data: fileBytes, out: format.fileName, args }, [fileBytes]);
  });
}

async function convertVideo(file) {
  state.isConverting = true;
  state.triedConverting = true;
  const format = chooseOutputFormat();

  try {
    el.status.innerHTML =
      "Your browser can't play this video format directly (common with phone videos in " +
      'HEVC/H.265 or .MOV). Converting it on this computer…<br>' +
      'Loading converter (about 32 MB, first time only, needs internet). ' +
      'Your video is not uploaded.';
    await loadConverter();

    el.status.textContent =
      'Converting video on this computer… (long or 4K videos can take a few minutes)';
    el.progress.hidden = false;
    el.progress.max = 1;
    el.progress.value = 0;

    const converted = await runConversion(await file.arrayBuffer(), format);

    el.progress.hidden = true;
    el.status.textContent = 'Converted. Ready to edit.';
    loadVideoBlob(new Blob([converted], { type: format.mimeType }));
  } catch (err) {
    el.progress.hidden = true;
    el.status.innerHTML =
      `<span class="warn">Could not convert this video: ${err.message}<br>` +
      'If you are viewing this inside the Claude app preview, download the file and open it ' +
      'in Chrome or Edge. Otherwise check your internet connection (needed once to load the ' +
      'converter) and try again.</span>';
    el.meta.textContent = 'Video not loaded';
  } finally {
    state.isConverting = false;
  }
}
