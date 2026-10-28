// Source code of the web worker that runs ffmpeg (compiled to WebAssembly).
//
// It is kept as a string because a worker started from a plain file:// page
// cannot load a script file; converter.js turns this string into a Blob URL.
//
// Messages it understands:
//   { type: 'load', core }               -> loads ffmpeg, replies 'loaded'
//   { type: 'run', data, args, out }     -> runs ffmpeg, replies 'done' with the output bytes
// It also posts 'log', 'progress' and 'error' messages.

const CONVERTER_WORKER_SOURCE = `
let ffmpegCore;

self.onmessage = async (event) => {
  const message = event.data;

  try {
    if (message.type === 'load') {
      importScripts(message.core + 'ffmpeg-core.js');

      const wasmUrl = message.core + 'ffmpeg-core.wasm';
      ffmpegCore = await self.createFFmpegCore({
        mainScriptUrlOrBlob:
          message.core + 'ffmpeg-core.js#' + btoa(JSON.stringify({ wasmURL: wasmUrl })),
      });

      ffmpegCore.setLogger((log) => postMessage({ type: 'log', msg: log.message }));
      ffmpegCore.setProgress((info) => postMessage({ type: 'progress', p: info.progress }));
      postMessage({ type: 'loaded' });
    } else if (message.type === 'run') {
      ffmpegCore.FS.writeFile('in', new Uint8Array(message.data));
      ffmpegCore.exec(...message.args);
      const exitCode = ffmpegCore.ret;
      ffmpegCore.reset();

      let output = null;
      try {
        output = ffmpegCore.FS.readFile(message.out);
        ffmpegCore.FS.unlink(message.out);
      } catch (_) {}
      try {
        ffmpegCore.FS.unlink('in');
      } catch (_) {}

      if (!output || exitCode !== 0) {
        postMessage({ type: 'error', msg: 'Conversion failed (code ' + exitCode + ').' });
        return;
      }
      postMessage({ type: 'done', data: output.buffer }, [output.buffer]);
    }
  } catch (err) {
    postMessage({ type: 'error', msg: String((err && err.message) || err) });
  }
};
`;
