import ui from "./ui/index2.js";
import Tone from 'tone';
import samples from './samples.js';
import constants from "./constants";
import synth from "./synth.js";

export default {play,noteToValue};

const OCTAVE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const loadedPlayers = {};
const loadingPlayers = {};
const connectedInstruments = {};
 
function play(grp,note,length,time,incrementCounter) {
   const instrument = ui.store.get(grp).instrument;

   const nearestSample = getNearestSample(instrument,note);
   const distance = getNoteDistance(note,nearestSample);
   const playbackRate = getPlaybackRate(distance);

   if (loadedPlayers[instrument]) {
     let playersForThisNote = loadedPlayers[instrument][nearestSample];
     for (let i = 0; i < playersForThisNote.length; i++) {
       if (playersForThisNote[i].state === "stopped") {
         // we have a player that's not being used. use it!
         const player = playersForThisNote[i];

          player.playbackRate = playbackRate;
          player.volume.value = ui.store.get(grp).volume;
         
          setEnvelopeAndStart(player,length,time); 
          if (incrementCounter && ui.store.get(grp).volume > -100) {
            Tone.Draw.schedule(function(){
              if (constants.DEBUG.synth) console.log(`playing ${note} on the ${instrument} at ${playbackRate} speed with ${nearestSample}#${i} for ${length} at ${time}`);
              // TODO update UI
              // liveNoteCounts[grp].played++;
              //  document.getElementById(`${grp}Title`).innerText = `${liveNoteCounts[grp].played}`;
            }, time + 1);
          }

         break;
      }
      if (i === playersForThisNote.length - 1) {
         // all players are playing, so make a new one!
        new Tone.Player(samples[instrument][nearestSample],newPlayer => {
          newPlayer.connect(synth.getReverb(grp));

          newPlayer.playbackRate = playbackRate;
          newPlayer.volume.value = ui.store.get(grp).volume;
           
          // attempt to play the note. if the setup has taken too long, we'll miss this one but the player will be ready next time.
          setEnvelopeAndStart(newPlayer,length,time);

          if (incrementCounter && ui.store.get(grp).volume > -100) {
            Tone.Draw.schedule(function(){
              if (constants.DEBUG.synth) console.log(`playing ${note} on the ${instrument} at ${playbackRate} speed with ${nearestSample}#${i} for ${length} at ${time}`);
              // TODO update UI
              // liveNoteCounts[grp].played++;
              //  document.getElementById(`${grp}Title`).innerText = `${liveNoteCounts[grp].played}`;
            }, time + 1);
          }

           loadedPlayers[instrument][nearestSample].push(newPlayer);
         });
          // Tone.Draw.schedule(function(){
          //    document.getElementById(`${grp}Title`).innerText = `Loading ${instrument}`
          // }, time + 1);
       }
     }
  } else {
    if (!loadingPlayers[instrument]) {
      loadSamples(instrument,grp);
      loadingPlayers[instrument] = true;
    }
      // Tone.Draw.schedule(function(){
      //    document.getElementById(`${grp}Title`).innerText = `Loading ${instrument}`
      // }, time + 1);
  }

}

function setEnvelopeAndStart(player,length,time) {
  const num = length.slice(0,-1);
  const letter = length.slice(-1);
  if (letter === "n" && num > 16) {
     player.fadeIn = `${num*4}n`;
     player.fadeOut = `${num*4}n`;
  } else {
     player.fadeIn = '32n';
     player.fadeOut = '32n';
  }
  player.start(time,0,length);
}

function loadSamples(instrument,grp) {
   new Tone.Players(samples[instrument],players => {
      loadedPlayers[instrument] = {};
      Object.keys(samples[instrument]).map(note => {
         const player = players.get(note);
         player.fadeIn = '32n';
         player.fadeOut = '32n';
         loadedPlayers[instrument][note] = [player];
      });
      
   }).connect(synth.getReverb(grp));
  connectedInstruments[grp] = instrument;
}

function noteToValue(noteStr) {
  const pitch = noteStr.substring(0,noteStr.length-1);
  const octave = noteStr.substring(noteStr.length-1,noteStr.length);
  return octave * 12 + OCTAVE.indexOf(pitch);
}

function getNoteDistance(note1, note2) {
  return noteToValue(note1) - noteToValue(note2);
}

function getNearestSample(instrument, note) {
  let sortedBank = Object.keys(samples[instrument]).slice().sort((sampleA, sampleB) => {
    let distanceToA =
      Math.abs(getNoteDistance(note, sampleA));
    let distanceToB =
      Math.abs(getNoteDistance(note, sampleB));
    return distanceToA - distanceToB;
  });
  return sortedBank[0];
}

function getPlaybackRate(noteDistance) {
  return Math.pow(2, noteDistance / 12);
}

function uiUpdated(grp) {
  if (constants.DEBUG.synth) console.log(`setting up ${grp}`);
  const state = ui.store.get(grp);  

  if (loadedPlayers[state.instrument]) {
    Object.keys(loadedPlayers[state.instrument]).forEach(note => {
      loadedPlayers[state.instrument][note].forEach(player => {
        player.volume.value = state.volume;
        if (connectedInstruments[grp] !== state.instrument) {
          player.disconnect();
          player.connect(synth.getReverb(grp));
          connectedInstruments[grp] = state.instrument;
        }
      });
    });
  }
}

ui.attrUpdated(uiUpdated);
