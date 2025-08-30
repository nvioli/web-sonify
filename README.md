# WebSonify

[View the demo](https://web-sonify.glitch.me/) / [View the slides](https://web-sonify.glitch.me/slides/)

## Sonify your own site's traffic

1. Click to [remix this app](https://glitch.com/edit/#!/remix/web-sonify)
1. Create an OAuth 2.0 client ID
    1. Go to the [API section of the Google developer console](https://console.developers.google.com/apis/credentials/oauthclient/). Log in if necessary
    1. Choose (or create) a project in the header
    1. Under "Create credentials", choose "OAuth Client ID"
    1. Choose "Web Application", choose a name, and in the "Authorized JavaScript origins", add the URI where you intend to run your app.
    1. Click "Create"
    1. Copy the generated Client ID, and replace the current `CLIENT_ID` value in [constants.js](https://glitch.com/edit/#!/web-sonify?path=src/constants.js:1:0)
1. Fill in the rest of the IDs in [constants.js](https://glitch.com/edit/#!/web-sonify?path=src/constants.js:1:0) with values you get out of Google Analytics. Change the `SITE_NAME` value, which will change the title of the page
1. Launch your app. In my experience, the OAuth step sometimes took a few hours to propagate, so if it doesn't work right away, go take a walk and try again later.

## Contact / Support

WebSonify was built as a side project in my spare time, so to date I've valued function over clean, readable, reusable code. If you're interested in contributing, need help using it on your site, or have any questions about it at all, feel free to reach out!

[nvioli](https://twitter.com/nvioli/) on twitter / same thing at gmail.com