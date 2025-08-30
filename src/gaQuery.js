// this file is mostly taken from google example docs
// https://developers.google.com/analytics/devguides/reporting/realtime/v3/libraries
import gaSetup from "./gaSetup.js";
import constants from "./constants.js";

export default { queryAccounts, cancelTimeout }

let myAuthorize;
let myGapi;
function queryAccounts(gapi,authFn) {
  myAuthorize = authFn;
  myGapi = gapi;
  // Load the Google Analytics client library.
  myGapi.client.load('analytics', 'v3').then(() => {
    // Get a list of all Google Analytics accounts for this user
    myGapi.client.analytics.management.accounts.list().then(handleAccounts);
  });
}

function handleAccounts(response) {
  // Handles the response from the accounts list method.
  if (response.result.items && response.result.items.length) {
    // Get the first Google Analytics account.
    const firstAccountId = response.result.items[0].id;

    // Query for properties.
    queryProperties(firstAccountId);
  } else {
    console.log('No accounts found for this user.');
  }
}

function queryProperties(accountId) {
  // Get a list of all the properties for the account.
  myGapi.client.analytics.management.webproperties.list({accountId})
    .then(handleProperties)
    .then(null, err => {
      // Log any errors.
      console.log(err);
    });
}

function handleProperties(response) {
  // Handles the response from the webproperties list method.
  if (response.result.items && response.result.items.length) {
    // Get the first Google Analytics account
    const firstAccountId = response.result.items[0].accountId;

    // Get the first property ID
    const firstPropertyId = response.result.items[0].id;

    // Query for Views (Profiles).
    queryProfiles(firstAccountId, firstPropertyId);
  } else {
    console.log('No properties found for this user.');
  }
}

function queryProfiles(accountId, webPropertyId) {
  // Get a list of all Views (Profiles) for the first property
  // of the first Account.
  myGapi.client.analytics.management.profiles.list({accountId,webPropertyId})
    .then(handleProfiles)
    .then(null, err => {
      // Log any errors.
      console.log(err);
    });
}

let firstProfileId;
function handleProfiles(response) {
  // Handles the response from the profiles list method.
  if (response.result.items && response.result.items.length) {
    // Get the first View (Profile) ID.
    firstProfileId = response.result.items[0].id;

    // Query the Core Reporting API.
    queryCoreReportingApi(firstProfileId);
  } else {
    console.log('No views (profiles) found for this user.');
  }
}

function queryCoreReportingApi(profileId) {
  var request = myGapi.client.analytics.management.goals.list({
    'accountId': constants.ACCOUNT_ID,
    'webPropertyId': constants.TRACKING_ID,
    'profileId': constants.VIEW_ID
  });
  request.execute(response => {
    gaSetup.oneTimeCb(response);
    liveQuery(profileId);
  });
}

let queryTimeout;
function liveQuery(profileId) {
  myGapi.client.analytics.data.realtime.get({
    ids: `ga:${constants.VIEW_ID}`,
    metrics: "rt:activeUsers",
    dimensions: "rt:goalId"
    // more could be added here; would have to update the callback and other affected pieces as well.
    // for all metrics and dimensions see: https://developers.google.com/analytics/devguides/reporting/realtime/dimsmets/
  }).then(response => {
      gaSetup.liveQueryCb(response);
      // recurse every minute
      queryTimeout = setTimeout(() => liveQuery(profileId),60000);
    })
    .then(null, err => {
      if (err.status === 401) {
        console.log("needs reauthorization");
        myAuthorize();
      } else {
        // Log any errors.
        console.log(err);
        // and try again
        queryTimeout = setTimeout(() => liveQuery(profileId),1000);
      }
    });
}

function cancelTimeout() {
  clearTimeout(queryTimeout);
}