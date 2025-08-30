// thanks https://glitch.com/edit/#!/jidiji?path=pitch-color-maps.js:46:1

var PITCH_TO_COLOR_MAP = new Map();
var COLOR_TO_PITCH_MAP = new Map();

export default {getFromNote: note => getPitchColor(note)}

var BACKGROUND_COLOR = [255, 255, 255];

const COLOR_MAPPING = new Map([
  [0, [32, 0, 0]],  // C
  [1, [32, 16, 0]],  // C#
  [2, [32, 32, 0]],  // D
  [3, [16, 32, 0]],  // D#
  [4, [0, 32, 0]],  // E
  [5, [0, 32, 16]],  // F
  [6, [0, 32, 32]],  // F#
  [7, [0, 16, 32]],  // G
  [8, [0, 0, 32]],  // G#
  [9, [16, 0, 32]],  // A
  [10, [32, 0, 32]],  // A#
  [11, [32, 0, 16]]  // B
]);

function buildRGBString(rgbColors) {
  return 'rgb(' + rgbColors[0] + ', ' + rgbColors[1] + ', ' + rgbColors[2] + ')';
}

function getPitchColor(pitch) {
  if (pitch < 24) {
    pitch += 12;
  }
  const relativePitch = (pitch - 24) % 12;
  let colors = BACKGROUND_COLOR;
  if (COLOR_MAPPING.has(relativePitch)) {
    colors = COLOR_MAPPING.get(relativePitch);
    let multiplier = Math.floor(pitch / 12);
    colors = colors.map(x => x * multiplier);
  }
  return colors;
}

function initializePitchColorMaps() {
  // Go through all piano keys.
  for (let i = 21; i < 109; i++) {
    const color = getPitchColor(i);
    COLOR_TO_PITCH_MAP.set(buildRGBString(color), i);
    PITCH_TO_COLOR_MAP.set(i, color);
  }
}