// WIP
var bufferToWav = require('audiobuffer-to-wav')
import Tone from 'tone';
window.Tone = Tone;

var audioContext = Tone.context;

var anchor = document.createElement('a')
document.body.appendChild(anchor)
// anchor.style = 'display: none'

audioContext.decodeAudioData(audioContext, function (buffer) {
  var wav = bufferToWav(buffer)
  var blob = new window.Blob([ new DataView(wav) ], {
    type: 'audio/wav'
  })

  var url = window.URL.createObjectURL(blob)
  anchor.href = url
  anchor.download = 'audio.wav'
  // anchor.click()
  window.URL.revokeObjectURL(url)
}, function () {
  throw new Error('Could not decode audio data.')
})
