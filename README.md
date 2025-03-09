# <img src="public/icon/48.png" align="absmiddle"> TabShield

TabShield is a browser extension that helps prevent accidental actions on important websites. Whether you're a developer working across different environments, a professional managing critical data, or a user who wants extra safeguards while browsing, TabShield will help you minimize mistakes and unintended changes.

# Features

**Custom labels**: Display a clear, colored label on tabs to easily differentiate environments or important websites.

**Confirmation for forms**: Add a confirmation step before submitting forms.

**Disable form inputs**: Block all input fields on selected websites to avoid unintended changes.

**Configuration Import/Export**: Save, share, and restore your TabShield settings effortlessly.

# Installation

## Chrome

Download the latest release from the Chrome Web Store.

## Firefox

Download the latest release from the Firefox Add-ons.

## Build Locally

Alternatively, you can build the extension locally using the following commands:

```sh
npm install # install dependencies
npm run bundle:firefox # build for Firefox
npm run bundle:chrome # build for Chrome
```

These commands will generate the extension packages under `dist-archives`.
