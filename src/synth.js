import ui from "./ui/index2.js";
import Tone from 'tone';
import samples from './samples.js';
import constants from "./constants.js";

export default {makeSynths,play,getReverb};

let synths = {};
let instruments = {};
// TODO centralize loops
let loops = [];

if (constants.DEBUG.synth) {
  window.synths = synths;
  window.loops = loops;
}

let limiter;

let bitcrushers = {};
let chebyshevs = {};
let reverbs = {};

function getReverb(grp) {return reverbs[grp]};

let liveNoteCounts = {
  groupA: {},
  groupB: {},
  groupC: {}
}

function reset() {
  Object.keys(liveNoteCounts).forEach(group => {
      liveNoteCounts[group] = {played: 0}
  });
  loops = [];
}

function stop() {
   loops.forEach(loop => {
     loop.stop("+0");
   });
   reset();
}

(function draw() {
  if (ui.store.get("animateNotes")) {
    for (let group in synths) {
    const opacity = synths[group].voices.reduce((result, item, index, array) => {
      result = Math.max(result,item.voice0.envelope.value);
      return result;
    },0);


    setTimeout(() => {
      //because we've set latencyHint = 0.5, sounds are delayed around a half second
      document.getElementById(`${group}`).style.background = `rgba(93,135,161,${opacity})`;
    },500);
  }
}

  requestAnimationFrame(draw);
})();

function makeSynths() {
  limiter = new Tone.Limiter(0);
  makeSynth("groupA");
  makeSynth("groupB");
  makeSynth("groupC");
  limiter.toMaster();
}

function makeSynth(grp) {
  if (!synths[grp]) {
    synths[grp] = new Tone.PolySynth(3,Tone.DuoSynth);

    const envelope = {
      attack:  '32n',
      decay:   '32n',
      sustain: 0.5,
      release: '16n'
    };

    synths[grp].set({
      voice0: {envelope},
      voice1: {envelope},
    });

    //these are declared in reverse according to their place in the audio chani, so later declared ones can connect to earlier declared
    bitcrushers[grp] = new Tone.BitCrusher().connect(limiter);
    chebyshevs[grp] = new Tone.Chebyshev().connect(bitcrushers[grp]);
    reverbs[grp] = new Tone.JCReverb().connect(chebyshevs[grp])

    synths[grp].connect(reverbs[grp])//.toMaster();//send this directly toMaster() to cut out the effects (for debugging);

    setupSynth(grp);
  }
}

function setupSynth(grp) {
  if (constants.DEBUG.synth) console.log(`setting up ${grp}`);
  const state = ui.store.get(grp);  

  synths[grp].set({harmonicity:Math.pow(Math.pow(2,1/12),state.harmonicity)});
  synths[grp].set({volume:state.volume});
  synths[grp].set({vibratoRate:state.vibratoRate});
  synths[grp].set({vibratoAmount:state.vibratoAmount});

  for (let voiceNum = 0; voiceNum <= 1; voiceNum++) {
    const uiData = state[`voice${voiceNum}`];

    if (!synths[grp].voices[voiceNum] || shouldUpdateVoiceData(grp,voiceNum,uiData)) {
      synths[grp].set({
        [`voice${voiceNum}`]:{
          oscillator: {
            type: getOscillatorType(uiData),
            mute: uiData.mute,
          }
        }
      });
      if (uiData.oscillatorTypePrefix !== "") {
        // these need to be set separately after the synth is defined or they won't be set until they're updated
        synths[grp].set({
          [`voice${voiceNum}`]:{
            oscillator: {
              //ignored if the type doesn't have an "am" prefix:
              harmonicity: Math.pow(Math.pow(2,1/12),uiData.harmonicity),
              modulationType: uiData.modulationType,
              //ignored if the type doesn't have an "fm" prefix:
              modulationIndex: uiData.modulationIndex
            },
          }
        });
      }
    }
  }
  setupEffects(grp,state);
}

function shouldUpdateVoiceData(grp,voiceNum,uiData) {
  // this type of update can cause cracking and popping in the sound, so it's best to minimize it until it's really necessary
  const synthVoice = synths[grp].get(`voice${voiceNum}`)[`voice${voiceNum}`];
  return !synthVoice
    || synthVoice.oscillator.type !== getOscillatorType(uiData)
    || synthVoice.oscillator.mute !== !!uiData.mute
    || (uiData.oscillatorTypePrefix === "am" && synths[grp].voices[0][`voice${voiceNum}`].oscillator.modulationType != uiData.modulationType)
    || (uiData.oscillatorTypePrefix === "fm" && synths[grp].voices[0][`voice${voiceNum}`].oscillator.modulationIndex.value != uiData.modulationIndex)
    || (
        (uiData.oscillatorTypePrefix === "am" || uiData.oscillatorTypePrefix === "fm")
          && Math.abs(synths[grp].voices[0][`voice${voiceNum}`].oscillator.harmonicity.value - Math.pow(Math.pow(2,1/12),uiData.harmonicity)) > 0.01
       )
}

function setupEffects(grp,state) {
    bitcrushers[grp].set({
    bits: state.bitcrusherBits,
    wet: ui.store.get("effectsRemoved") ? 0 : state.bitcrusherWet
  });
  chebyshevs[grp].set({
    order: state.chebyshevOrder,
    oversample: state.chebyshevOversample,
    wet: ui.store.get("effectsRemoved") ? 0 : state.chebyshevWet
  });
  reverbs[grp].set({
    roomSize: state.reverbRoomSize,
    wet: ui.store.get("effectsRemoved") ? 0 : state.reverbWet
  });
}

function getOscillatorType(voiceData) {
  return `${voiceData.oscillatorTypePrefix}${voiceData.oscillatorType}${voiceData.oscillatorPartials}`;
}

function play(grp,note,length,time,incrementCounter) {
   synths[grp].triggerAttackRelease(note,length,time);
   // if (incrementCounter) {
   //   Tone.Draw.schedule(function(){
   //     liveNoteCounts[grp].played++;
   //     document.getElementById(`${grp}Title`).innerText = `${liveNoteCounts[grp].played}`;
   //   }, time + 1);
   // }
}
 
ui.attrUpdated(setupSynth);
