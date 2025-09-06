# IIM Indore Auto-Login (Chrome Extension)

A simple Chrome Extension that stores your campus Wi‑Fi credentials and auto‑logs you in when the login page loads.

## Files
- `manifest.json` — Extension configuration (MV3)
- `popup.html` / `popup.js` — UI to save and manage multiple credentials
- `content.js` — Auto‑fills and submits the login form on the captive portal
- `images/icon16.png`, `icon48.png`, `icon128.png` — Extension icons (Twemoji)

## Installation
1. Open Chrome and go to `chrome://extensions`.
2. Enable “Developer mode”.
3. Click “Load unpacked”.
4. Select the folder: `IIM Indore Wifi Login`.

## First‑time Setup
1. Click the extension icon in the toolbar.
2. Add one or more accounts: label, username, password.
3. Select a default account using the radio button in the list.

## Usage
- When redirected to `http://192.168.1.3:1000/login?...`, the extension fills your default account and submits the form automatically.

## Manage Multiple Accounts
- Add: Fill the form and click “Save Credential”.
- Edit: Click “Edit” next to an account, update fields, then “Update Credential”.
- Delete: Click “Delete”. If you delete the default, the first remaining becomes default.
- Set Default: Choose the radio button next to the account you want as default.

## Migration (from older version)
- If you previously saved a single username/password, they will be migrated automatically on first open of the popup, and set as your default account.

## Notes
- If the campus login page changes its field names or structure, update selectors in `content.js`.
- Credentials are stored using `chrome.storage.sync`.

## Icons and Attribution
- Icons are from [Twemoji](https://twemoji.twitter.com/) — © Twitter, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
