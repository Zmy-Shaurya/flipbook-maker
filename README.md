# Flip Book Maker

Turn a video into a printable flip book PDF. Everything runs in your browser; your video is never uploaded.

## How to use

1. Open `flipbook-maker.html` in Chrome or Edge (double-click it, no server needed).
2. Choose a video file.
3. Set the clip range, rotate/crop, and adjust lighting if you like.
4. Pick paper size, frame height and frame count, then click **Build preview** to try the flip.
5. Click **Generate** to download the PDF.
6. Print at 100% scale ("Actual size"), cut along the grey lines, stack the pages in order and bind along the dotted line.

Videos the browser can't play (e.g. HEVC/H.265 phone videos, `.MOV`) are converted on your computer with ffmpeg. This downloads about 32 MB once, so it needs an internet connection the first time.

## Files

| File | What it is |
| --- | --- |
| `flipbook-maker.html` | The app (markup only). Use this one. |
| `flipbook-maker-standalone.html` | The same app as one big self-contained file, with the CSS, JS and jsPDF inlined. |
| `css/style.css` | Styles |
| `js/` | App code, one file per feature (see below) |
| `js/lib/jspdf.js` | Third-party PDF library |

### The `js/` folder

The scripts are plain `<script>` tags (not ES modules, so it works from `file://`) and load in this order:

| File | Purpose |
| --- | --- |
| `dom.js` | Looks up every page element once, with readable names |
| `state.js` | Shared app state |
| `converter-worker.js` | Source of the ffmpeg web worker |
| `converter.js` | Converts unplayable videos |
| `video-loader.js` | File picking and video load events |
| `playback.js` | Play, pause, scrub bar, set start/end |
| `lighting.js` | Brightness, contrast, gamma, saturation, grayscale, invert |
| `render.js` | Draws one rotated, cropped, lit frame onto a canvas |
| `preview.js` | Main preview and output thumbnail |
| `crop.js` | Crop by dragging or typing |
| `rotation.js` | Rotate and flip |
| `layout.js` | Page grid maths and which frames to capture |
| `frame-capture.js` | Seek to an exact frame |
| `pdf-export.js` | Builds the PDF |
| `flip-preview.js` | Flip book preview |
| `main.js` | Entry point |

If you add a script, add its `<script>` tag to `flipbook-maker.html` after anything it depends on.
