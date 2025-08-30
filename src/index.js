// library dependencies:
import Tone from 'tone';
import StartAudioContext from 'startaudiocontext';
import googleClientApi from 'google-client-api';
// internal components:
import constants from "./constants";
import gaQuery from "./gaQuery.js";
import notes from "./notes.js";
import scheduler from "./scheduler.js";
import synth from "./synth.js";
import ui from "./ui/index2.js";

// import './export.js';

let gapi;
const startButton = document.getElementById('start');
StartAudioContext(Tone.context, '#start').then(function(){
   startButton.hidden = true;

   new Tone.Context();
   Tone.context.latencyHint = 1;
   Tone.Transport.start("+0.1");

   synth.makeSynths();

   googleClientApi()
     .then(myGapi => {
       gapi = myGapi;
     
       ui.store.set({auth:false});
     
       if (constants.DEBUG.autoAuth) {
         authorize();
       } else {
         playDemo();
       }
     });

})

// Add an event listener to the 'auth-button'.
document.getElementById('auth-button').addEventListener('click', authorize);

function authorize(event) {
  // Handles the authorization flow.
  // `autoLoggedIn` should be false when invoked from the button click.
  const autoLoggedIn = event ? false : true;
  const authData = {
    client_id: constants.CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    immediate: autoLoggedIn
  };

  gapi.auth2.authorize(authData, authCb);
}

function authCb(response) {
   if (response.error) {
    ui.store.set({auth:false});
    playDemo();
  } else {
    // we're authorized, so get live data from the ga realtime api
    // the queryAccounts function recurses, so it continues the "song" perpetually.
    ui.store.set({auth:true});
    scheduler.stop();
    clearTimeout(demoTimeout);
    gaQuery.queryAccounts(gapi,authorize);
  }
}

let demoTimeout;
function playDemo() {
  const visitorCounts = {
    groupA: ui.store.get('groupA').noteCount,
    groupB: ui.store.get('groupB').noteCount,
    groupC: ui.store.get('groupC').noteCount
  }
  // synth.reset();
  scheduler.schedule(visitorCounts);
  notes.keyChange();

  demoTimeout = setTimeout(() => {
    playDemo();
    ['groupA','groupB','groupC'].forEach(group => {
      // change the number of notes randomly between 90% and 110% of the previous value
      const prevVal = ui.store.get(group).noteCount;
      const newVal = Math.ceil(prevVal * (0.9 + Math.random() * 0.2));
      
      ui.store.set({
        [group]:Object.assign(ui.store.get(group),{noteCount:newVal})
      });
    })
  } ,60000);
}

// when the user changes the number of notes being played (by changing any input with class `restartOnChange`)
// we need to stop the loops that are currently playing and generate new ones
function restart() {
  // window.location.reload(false); 

  scheduler.stop();
  clearTimeout(demoTimeout);
  gaQuery.cancelTimeout();
  if (ui.store.get('auth')) {
    gaQuery.queryAccounts(gapi,authorize);
  } else {
    playDemo();
  }
}

// add click handlers for restart
let restartTimeout;
[].forEach.call(document.getElementsByClassName('restartOnChange'), function (el) {
  el.addEventListener("input",() => {
    // restart after 1s to prevent stuttering when the range elements are changed
    clearTimeout(restartTimeout);
    restartTimeout = setTimeout(restart,1000);
  });
});

// window.onfocus = restart;