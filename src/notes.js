import ui from "./ui/index2.js";

export default {getNoteAndOctave,getNoteInChord,keyChange}

const keys = {
  // "'' indicates next higher octave; "-" indicates next lower octave
  C:   ["C", "D", "E", "F", "G", "A", "B" ],
  D:   ["D", "E", "Gb","G", "A", "B", "Db'"],
  E:   ["E", "Gb","Ab","A", "B", "Db'","Eb'"],
  F:   ["F", "G", "A", "Bb","C'", "D'", "E'" ],
  G:   ["G", "A", "B", "C'", "D'", "E'", "Gb'"],
  A:   ["A", "B", "Db'","D'", "E'", "Gb'","Ab'"],
  B:   ["B", "Db'","Eb'","E'", "Gb'","Ab'","Bb'"],

  Cm:  ["C", "D", "Eb","F", "G", "Ab","Bb"],
  Dm:  ["D", "E", "F", "G", "A", "Bb","C'" ],
  Em:  ["E", "Gb","G", "A", "B", "C'", "D'" ],
  Fm:  ["F", "G", "Ab","Bb","C'", "Db'","Eb'"],
  Gm:  ["G", "A", "Bb","C'", "D'", "Eb'","F'" ],
  Am:  ["A", "B", "C'", "D'", "E'", "F'", "G'" ],
  Bm:  ["B", "Db'","D'", "E'", "Gb'","G'", "A'" ],

  Cb:  ["Cb","Db","Eb","Fb","Gb","Ab","Bb"],
  Db:  ["Db","Eb","F", "Gb","Ab","Bb","C'" ],
  Eb:  ["Eb","F", "G", "Ab","Bb","C'", "D'" ],
  Fb:  ["Fb","Gb","Ab","A", "Cb'","Db'","Eb'"],
  Gb:  ["Gb","Ab","Bb","B", "Db'","Eb'","F'" ],
  Ab:  ["Ab","Bb","C'", "Db'","Eb'","F'", "G'" ],
  Bb:  ["Bb","C'", "D'", "Eb'","F'", "G'", "A'" ],

  Cbm: ["Cb","Db","D", "Fb","Gb","G", "A" ],
  Dbm: ["Db","Eb","E", "Gb","Ab","A", "B'" ],
  Ebm: ["Eb","F", "Gb","Ab","Bb","B'", "Db'"],
  Fbm: ["Fb","Gb","G", "A", "Cb'","C'", "D'" ],
  Gbm: ["Gb","Ab","A", "B", "Db'","D'", "E'" ],
  Abm: ["Ab","Bb","B", "Db'","Eb'","E'", "Gb'"],
  Bbm: ["Bb","C'", "Db'","Eb'","F'", "Gb'","Ab'"]
}

function keyChange() {
  if ( 0 === Math.floor(Math.random() * 8)) {
    // key change approximately every eight minutes
    const oldKey = ui.store.get('key');
    let newKey;
    if (oldKey === "F") newKey = "Am" // major to minor
    else if (oldKey === "Dm") newKey = "C" // minor to major
    else {
      newKey = keys[oldKey][4];
      if (newKey.endsWith("'") || newKey.endsWith("-")) {
        newKey = newKey.slice(0,-1);
      }
      if (oldKey.endsWith("m")) newKey += "m";
    }
    // console.log(`changing keys from ${oldKey} to ${newKey}`)
    ui.store.set({key:newKey});
  }
}

function getNoteAndOctave(note,octave) {
  if (note.endsWith("-")) {
    return getNoteAndOctave(note.slice(0, -1),Number(octave) - 1);
  } else if (note.endsWith("'")) {
    return getNoteAndOctave(note.slice(0, -1),Number(octave) + 1);
  }
  return note + octave;
}

// not a great name anymore; this is the main function where the notes are defined for each group.
// Remember that javascript arrays are zero-based but music theory calls the root the I!
// must return an array! single notes are singleton arrays; cadences have multiple notes
function getNoteInChord(synthGrp,noteNum,key) {
  const scale = keys[key]
  let notes;

  if (synthGrp === "groupA") {
    notes = [scale[0],scale[4],`${scale[0]}'`,`${scale[4]}'`,`${scale[0]}-`,`${scale[3]}-`];
    return [notes[noteNum % notes.length]];
  } else if (synthGrp === "groupB") {
    notes = [scale[3],scale[5],`${scale[3]}'`,`${scale[5]}'`,`${scale[3]}-`,`${scale[5]}-`];
    return [notes[noteNum % notes.length]];
  } else if (synthGrp === "groupC") {
    notes = [
      [`${scale[3]}'`,`${scale[2]}'`],
      [scale[6],`${scale[0]}'`],
      [`${scale[1]}'`,`${scale[0]}'`],
      [scale[5],scale[4]],
      [scale[5],scale[6],`${scale[0]}'`],
      [scale[6],`${scale[1]}'`,`${scale[0]}'`],

      [scale[3],scale[2]],
      [`${scale[6]}-`,scale[0]],
      [scale[1],scale[0]],
      [`${scale[5]}'`,`${scale[4]}'`],
      [`${scale[5]}-`,`${scale[6]}-`,scale[0]],
      [`${scale[6]}-`,scale[1],scale[0]]
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }
}
