import synth from './synth.js';
import sampler from "./sampler.js";
import ui from "./ui/index2.js";
import Tone from 'tone';
import constants from "./constants";
import notes from "./notes.js";
import pitchColor from "./pitchColor.js";

export default {schedule,stop};

Tone.Transport.bpm.value = 64;

// number of measures in which to fit all the events (loops after this many measures)
const period = 16;

// spaces out the loops within each minute, so they don't all start on the same beat
let offset = '0';
// staggers the notes from one minute to the next, so that in the overlap period we're not playing double notes
let staggerNotes = false;
function schedule(groupNoteCounts) {
  const notesPerVisitor = ui.store.get('notesPerVisitor') <= 0 ? Math.pow(10,ui.store.get('notesPerVisitor') - 1) : ui.store.get('notesPerVisitor')
  const groups = Object.keys(groupNoteCounts).sort();
  offset = staggerNotes ? `${getMaxNotesPerMeasure(Math.round(groupNoteCounts[groups[0]] * notesPerVisitor)) * 4}n` : '0';
  staggerNotes = !staggerNotes;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    makeLoopsForGroup(Math.round(groupNoteCounts[group] * (ui.store.get("auth") ? notesPerVisitor : 1)),group);
    // offset += "+4n";
  }
}

function makeLoopsForGroup(numNotes,synthGrp) {
  let notesLeft = numNotes;
  if (constants.DEBUG.scheduler) console.log(`scheduling ${numNotes} for ${synthGrp}`);
  let notesPerMeasure = getMaxNotesPerMeasure(numNotes);
  let loopsMade = 0;
  while (notesLeft > period) {
    if (notesLeft > notesPerMeasure * period) {
      getLoop(`${notesPerMeasure}n`,offset,`${notesPerMeasure * 2}n`,synthGrp,loopsMade++);
      notesLeft -= notesPerMeasure * period;
      offset += `+${notesPerMeasure * 2}n`;
    } else {
      notesPerMeasure /= 2;
    }
  }
  let measuresPerNote = 1;
  while (notesLeft > 0) {
    if (notesLeft >= period / measuresPerNote) {
      const noteLength = measuresPerNote > 8 ? '2m' : (measuresPerNote === 1 ? '2n' : '1n');
      getLoop(`${measuresPerNote}m`,offset,noteLength,synthGrp,loopsMade++);
      notesLeft -= period / measuresPerNote;
      offset += `+${measuresPerNote > 8 ? '1m' : (measuresPerNote === 1 ? '4n' : '2n')}`;
    }
    measuresPerNote *= 2;
  }
}

function getMaxNotesPerMeasure(numNotes) {
  return Math.max(Math.pow(2,Math.round(Math.log2(numNotes)) - 1) / period,1);
}

function getLoop(repeat,offset,duration,grp,noteNum) {
  const initialNote = notes.getNoteInChord(grp,noteNum,ui.store.get("key"));
  const initialNoteWithOctave = notes.getNoteAndOctave(initialNote[0],ui.store.get(grp).octave);
  const noteLength = initialNote.length > 1 ? "6n" : duration; // single notes dictate their duration; cadences are a constant 6n
  if (constants.DEBUG.scheduler) {
    console.log(`making a loop of ${grp === "groupC" ? 'a cadence starting with ' : ''} ${initialNote} for ${duration} repeating at ${repeat}, offset ${offset}, with synth ${grp}`)
  }

  const color = pitchColor.getFromNote(sampler.noteToValue(initialNoteWithOctave));
  const displayOffset = 100 * ((noteStrToPct(offset) % noteStrToPct(repeat)) % 4) / 4;
  const loopUIObj = {
    duration: noteLength,
    repeat,
    rawOffset:offset,
    displayOffset,
    // playingNoteRaw:0,
    opacity:0,
    color,
    altCss:getAltCss(offset,noteLength,repeat),
    wrappedNote: ""
  };
  
  let loopStartTime;
  const loop = new Tone.Loop(time => {
    if (!loopStartTime) loopStartTime = time;
    
    const note = notes.getNoteInChord(grp,noteNum,ui.store.get("key"));
    const baseOctave = ui.store.get(grp).octave;

    let playFn;
    if (ui.store.get(grp).instrument === "Synth") {
      playFn = synth.play;
    } else {
      playFn = sampler.play;
    }
    playFn(grp,notes.getNoteAndOctave(note[0],baseOctave), noteLength, time, true);
    if (note.length > 1) {
      playFn(grp,notes.getNoteAndOctave(note[1],baseOctave), noteLength, `${time}+16n`, false);
    }
    if (note.length > 2) {
      playFn(grp,notes.getNoteAndOctave(note[2],baseOctave), noteLength, `${time}+16n+16n`, false);
    }
    
    Tone.Draw.schedule(function(innerTime) {
      const timePlayedPct = (time - loopStartTime) * 64 / 60 / 4;
      // console.log(timePlayed);
      loopUIObj.playingNoteLeft = 100 * ((noteStrToPct(offset) + timePlayedPct ) % 4) / 4;
      // loopUIObj.playingNoteRaw++;
      // loopUIObj.playingNoteLeft = 100 * ((noteStrToPct(offset) + loopUIObj.playingNoteRaw * noteStrToPct(repeat)) % 4) / 4;
      
      if (loopUIObj.playingNoteLeft + noteStrToPct(noteLength) * 100 / 4 > 100) {
        loopUIObj.wrappedNote = "wrappedNote";
      } else {
        loopUIObj.wrappedNote = "";
      }
      
      loopUIObj.opacity = 1;
      modifyLoop(loopUIObj,grp);
    },time + 1);
    
    Tone.Draw.schedule(function(innerTime) {
      loopUIObj.opacity = 0;
      modifyLoop(loopUIObj,grp);
    },`1 + ${time} + ${noteLength}`);

  }, repeat);
  loop.start(`+${offset}`).stop(`+16m + ${offset}`);
  loopUIObj.toneLoop = loop;

  Tone.Transport.schedule(function(innerTime) {
    addLoop(loopUIObj,grp);
  }, `+${offset}`);
  
  // if (repeat == "8m") {
  //   Tone.Transport.schedule(function(innerTime) {
  //     addLoop(loopUIObj,grp);
  //   }, `+${offset} + 12m`);
  // }
  
  const removeTime = repeat === "16m" ? `+1m + ${offset} + ${noteLength}` : `+16m + ${offset}`;
  
  Tone.Transport.schedule(function(innerTime){
    removeLoop(loopUIObj,grp);
  }, removeTime);
}

function getAltCss(offset,noteLength,repeat) {
  let playhead = noteStrToPct(offset);
  const notePct = noteStrToPct(noteLength);
  const repeatPct = noteStrToPct(repeat);
  while (playhead < 4) {
    if (playhead + notePct > 4) {
      return "loop-alt";
    }
    playhead += repeatPct;
  }
  return "";
}

function noteStrToPct(noteStr) {
  const parts = noteStr.split('+');
  let pct = 0;
  parts.forEach(part => {
    if (part !== "0") {
      const num = part.slice(0,-1);
      const letter = part.slice(-1);
      if (letter === 'm') {
        pct += 1 * num;
      } else {
        pct += 1 / num;
      }
    }
  });
  // return 100 * simpleOffset;
  return pct;
}

let loops = {
  groupA: ui.store.get("groupA").loops,
  groupB: ui.store.get("groupB").loops,
  groupC: ui.store.get("groupC").loops
};

function addLoop(loop,grp) {
  loops[grp].push(loop);

  updateLoopsUI(grp);
}

function removeLoop(loop,grp) {
  var index = loops[grp].indexOf(loop);
  if (index > -1) {
    loops[grp].splice(index, 1);
  }

  updateLoopsUI(grp);
}

function modifyLoop(loop,grp) {
  var index = loops[grp].indexOf(loop);
  if (index > -1) {
    loops[grp][index] = loop;
  }

  updateLoopsUI(grp);
}

function updateLoopsUI(grp) {
  ui.store.set({
    [grp]:Object.assign(ui.store.get(grp),{loops: loops[grp]})
  });
}

window.onfocus = () => {
  refreshLoopState("groupA");
  refreshLoopState("groupB");
  refreshLoopState("groupC");
}

function refreshLoopState(grp) {
  loops[grp].forEach(loopUI => {
    if (loopUI.toneLoop.state === "stopped") {
      removeLoop(loopUI,grp);
    }
    loopUI.opacity = 0;
    modifyLoop(loopUI,grp);
  });
  // updateLoopsUI(grp);
}

function stop() {
  Object.keys(loops).forEach(grp => {
    loops[grp].forEach(loopUI => {
     loopUI.toneLoop.stop("+0").cancel().dispose();
    });
  });
  loops = {groupA:[],groupB:[],groupC:[]};
}