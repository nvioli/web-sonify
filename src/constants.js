// conditional debugging depending on what part of the app you're working on. open your browser console.
let DEBUG = {
  synth: false,
  scheduler: false,
  ui: false,
  tone: false,
  // attempt to auth with google on pageload. Use this when the main users of the app should be logged in (i.e. not demo mode)
  autoAuth: false
};

// allows us to change the debug settings from the running app
window.DEBUG = DEBUG;

import Tone from 'tone';
if (DEBUG.tone) {
   window.Tone = Tone;
}

export default {
  // set up credentials at https://console.developers.google.com/apis/credentials/oauthclient/
  // you'll need to add any url(s) that you want to use this app at; seems to take a few hours to propagate :(
  CLIENT_ID:'514608082742-nn3d12l0v2j78gllt4n343l5iof88nup.apps.googleusercontent.com',

  // change these three values to customize for your own site:
  // google analytics > admin > account > account settings
  ACCOUNT_ID: '1836649',
  // google analytics > admin > account > property > property settings
  TRACKING_ID: 'UA-1836649-1',
  // google analytics > admin > account > property > view > view settings
  VIEW_ID: '3315059',
  
  SITE_NAME: 'GlobalGiving',
  
  DEBUG
}
