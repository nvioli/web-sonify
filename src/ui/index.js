import AppUI from './App.html';
import defaults from './defaults.js';
import { Store } from 'svelte/store.js';
import constants from '../constants.js';

const localData = JSON.parse(localStorage.getItem('svelte-store-data'));
let data;
if (!localData || !localData.version || localData.version < defaults.version) {
  //create a new object to break any link between the store and defaults object
  //this enables `reset` to always read pure data from defaults
  data = JSON.parse(JSON.stringify(defaults));
} else {
  data = localData;
}

const store = new Store(data);

if (constants.DEBUG.ui) {
  window.store = store;
  window.defaults = defaults;
}

// placeholder to put callback function to be run when store contents change. see synth.js
let updateCallback;
store.onchange((state,changed) => {
  const changedProp = Object.keys(changed)[0];
  if (constants.DEBUG.ui) {
    console.log(`updating ${changedProp}. Current state:`)
    console.log(state);
  }
  localStorage.setItem('svelte-store-data', JSON.stringify(state));
  
  if (updateCallback) {
    if (changedProp.startsWith('group')) {
      updateCallback(changedProp);
    } else if (changedProp === "effectsRemoved") {
      updateCallback("groupA");
      updateCallback("groupB");
      updateCallback("groupC");
    }
  }
});

var app = new AppUI({
  target: document.querySelector( '#main' ),
  store
});

//expose a function to set the updateCallback. see synth.js
app.attrUpdated = cb => {
  updateCallback = cb;
}

document.querySelector('#reset').addEventListener("click",() => {store.set(defaults)})

export default app;
