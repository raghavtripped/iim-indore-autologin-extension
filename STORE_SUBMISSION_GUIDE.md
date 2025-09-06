# Chrome Web Store Submission Guide

## Required Assets Checklist

### 1. Extension Files (Ready ✅)
- [x] manifest.json (v1.0)
- [x] content.js (production-ready, no console.log)
- [x] popup.html
- [x] popup.js
- [x] images/ folder with all icons
- [x] privacy_policy.md

### 2. Store Listing Assets (To Create)

#### Screenshots (Required)
**Dimensions:** 1280x800 pixels or 640x400 pixels

**Screenshot 1: Extension Popup**
- Take a screenshot of the extension popup showing:
  - The "Saved Accounts" section with at least one saved account
  - The form fields for adding/editing credentials
  - The radio button selection for default account

**Screenshot 2: Before Auto-Login**
- Take a screenshot of the IIM Indore login page (http://192.168.1.3:1000/login?...)
- Show the empty username and password fields
- This demonstrates the problem the extension solves

**Screenshot 3: After Auto-Login (Optional)**
- Take a screenshot after successful login
- Show the logged-in state or success message

#### Store Listing Text

**Short Description (Max 132 characters):**
```
Securely saves your IIM Indore Wi-Fi credentials and automatically logs you in. Supports multiple accounts.
```

**Full Description:**
```
IIM Indore Auto-Login Extension

Automatically logs you into the IIM Indore campus Wi-Fi network without having to manually enter your credentials every time.

Features:
• Secure credential storage using Chrome's built-in storage
• Support for multiple Wi-Fi accounts
• Set a default account for automatic login
• Edit or delete saved accounts
• Automatic migration from previous versions

Usage:
1. Click the extension icon in your browser toolbar
2. Add your Wi-Fi credentials using the "Add New Credential" form
3. Set one account as default (optional)
4. Visit the IIM Indore login page - you'll be automatically logged in!

Manage Multiple Accounts:
• Add multiple sets of credentials for different users
• Edit existing accounts by clicking the "Edit" button
• Delete accounts you no longer need
• Set any account as your default for automatic login
• All data is stored securely on your device

Privacy & Security:
• Your credentials are stored locally on your device
• No data is transmitted to external servers
• Uses Chrome's secure storage API
• Data syncs only across your own devices

Perfect for IIM Indore students, faculty, and staff who frequently connect to the campus Wi-Fi network.
```

#### Promotional Tile (Optional but Recommended)
**Dimensions:** 440x280 pixels
- Simple graphic with the extension icon and name
- Can include "Auto-Login" or "Wi-Fi" text
- Use the same color scheme as your icons

### 3. Privacy Policy
The privacy policy is already created in `privacy_policy.md`. You can:
- Host it on GitHub Gist (as suggested in the guide)
- Host it on your own website
- Use the Chrome Web Store's built-in privacy policy section

### 4. ZIP File Creation
1. Select all files in the project folder:
   - manifest.json
   - content.js
   - popup.html
   - popup.js
   - images/ folder
   - privacy_policy.md (optional, but good to include)
2. Right-click → "Compress" or "Send to > Compressed (zipped) folder"
3. Name it: `iim-indore-autologin-v1.0.zip`
4. **CRITICAL:** Ensure manifest.json is at the root level inside the zip

## Chrome Web Store Submission Process

### Step 1: Developer Registration
1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Pay the $5 one-time registration fee
3. Accept the developer agreement

### Step 2: Upload Extension
1. Click "New Item"
2. Upload your `iim-indore-autologin-v1.0.zip` file
3. Wait for upload to complete

### Step 3: Fill Store Listing
Navigate through these tabs:

**Package Tab:**
- Your zip file should already be uploaded

**Store Listing Tab:**
- **Name:** IIM Indore Auto-Login
- **Summary:** [Use the short description above]
- **Description:** [Use the full description above]
- **Category:** Productivity
- **Language:** English
- **Icon:** Upload images/icon128.png
- **Screenshots:** Upload your 3 screenshots
- **Promotional tile:** Upload if you created one

**Privacy Practices Tab (CRITICAL):**
- **Single Purpose:** "To securely store a user's campus Wi-Fi credentials and automatically log them in to the IIM Indore captive portal"
- **Permission Justification:**
  - Permission: storage
  - Justification: "This permission is required to securely save the user's Wi-Fi username and password on their local device, enabling the auto-login feature"
- **Data Usage:**
  - "Yes, I am collecting this data"
  - Check: "Authentication information (e.g., passwords, credentials, security questions)"
  - Usage: "It is used for the extension's core functionality"
  - Transfer: "I do not sell or transfer user data to third parties..."

**Distribution Tab:**
- **Visibility:** Public
- **Countries:** All countries (or India if preferred)

### Step 4: Submit for Review
1. Click "Save draft"
2. Click "Submit for review"
3. Wait for Google's review (few days to 2 weeks)

## Post-Submission
- You'll receive email notifications about the review status
- If rejected, fix the issues and resubmit with incremented version number
- If approved, your extension goes live automatically

## Future Updates
- Increment version number in manifest.json (e.g., "1.1", "1.0.1")
- Create new zip file with updated version
- Upload through the same dashboard
- No additional fees for updates
