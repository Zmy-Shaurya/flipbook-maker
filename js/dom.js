// Every element the app touches, looked up once and given a readable name.
// The strings are the ids used in flipbook-maker.html.

const byId = (id) => document.getElementById(id);

const el = {
  // video + canvases
  video: byId('vid'),
  previewCanvas: byId('pv'),
  outputCanvas: byId('out'),

  // loading
  fileInput: byId('file'),
  meta: byId('meta'),

  // playback
  playButton: byId('play'),
  scrubber: byId('scrub'),
  currentTime: byId('tnow'),

  // clip range
  startTime: byId('tStart'),
  endTime: byId('tEnd'),
  setStartButton: byId('setStart'),
  setEndButton: byId('setEnd'),

  // rotate / flip
  rotateLeft: byId('rotL'),
  rotateRight: byId('rotR'),
  rotationLabel: byId('rotLbl'),
  flipHorizontal: byId('flipH'),

  // crop (percentages)
  cropX: byId('cx'),
  cropY: byId('cy'),
  cropWidth: byId('cw'),
  cropHeight: byId('ch'),
  cropReset: byId('cropReset'),

  // lighting sliders and their number labels
  brightness: byId('aBri'),
  brightnessLabel: byId('vBri'),
  contrast: byId('aCon'),
  contrastLabel: byId('vCon'),
  gamma: byId('aGam'),
  gammaLabel: byId('vGam'),
  saturation: byId('aSat'),
  saturationLabel: byId('vSat'),
  grayscale: byId('gray'),
  invert: byId('inv'),
  lightingReset: byId('adjReset'),

  // page / frame settings
  frameMode: byId('fMode'),
  frameValue: byId('fVal'),
  paper: byId('paper'),
  orientation: byId('orient'),
  frameHeight: byId('fh'),
  bindingTab: byId('tab'),
  dpi: byId('dpi'),
  reverseOrder: byId('rev'),
  summary: byId('info'),

  // flip book preview
  flipBuild: byId('fbBuild'),
  flipPlay: byId('fbPlay'),
  flipFps: byId('fbFps'),
  flipRealSpeed: byId('fbReal'),
  flipScrubber: byId('fbScrub'),
  flipCounter: byId('fbNum'),
  flipImage: byId('fbImg'),
  flipPlaceholder: byId('fbEmpty'),
  flipStatus: byId('fbStatus'),

  // PDF export
  generateButton: byId('gen'),
  cancelButton: byId('cancel'),
  progress: byId('prog'),
  status: byId('status'),
};

const previewCtx = el.previewCanvas.getContext('2d', { willReadFrequently: true });
const outputCtx = el.outputCanvas.getContext('2d', { willReadFrequently: true });
