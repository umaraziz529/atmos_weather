# Atmos Weather — Firebase version

## Files
- `index.html`, `styles.css`: weather interface
- `app.js`: Open-Meteo forecast and optional consent-based location saving
- `firebase-config.js`: Firebase public web configuration
- `admin.html`, `admin.js`: protected admin dashboard
- `firestore.rules`: database access rules

## Setup
1. Create a project at https://console.firebase.google.com and register a Web App.
2. Copy the web config into `firebase-config.js`. Replace all `PASTE_...` values.
3. Firebase Authentication → Sign-in method: enable **Email/Password** and **Anonymous**.
4. Authentication → Settings → Authorized domains: add `umaraziz529.github.io` if missing.
5. Create Cloud Firestore in Production mode.
6. In Authentication → Users, create your admin email/password account. Copy that user's UID.
7. Replace `REPLACE_WITH_YOUR_ADMIN_AUTH_UID` in both `admin.js` and `firestore.rules` with that exact UID.
8. Publish `firestore.rules` from Firestore → Rules.
9. Upload all files in this folder to the root of GitHub repo `weather_forcast`, replacing old files, and commit.
10. Open https://umaraziz529.github.io/weather_forcast/ and test city weather, then browser location. Location is saved only if the separate consent checkbox is checked.

## Security
Firebase web config is public; never put service-account keys in the site. Rules let anonymous authenticated users create only consented records owned by their own UID. Only the hardcoded admin UID can read/delete. This starter has no rate limiting; automated submissions remain possible. Add Firebase App Check and monitoring before production use. A consent checkbox does not prove coordinates are genuine. Publish a clear privacy notice.
