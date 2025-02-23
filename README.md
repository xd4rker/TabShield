# TabShield

TabShield is a browser extension designed to prevent accidental actions on important websites. Whether you're a developer working across different environments, a professional managing critical data, or a user who wants extra safeguards while browsing, TabShield will help you minimize mistakes and unintended changes.

# Features

- 🔖 **Custom Labels**: Display a clear, colored label on tabs to easily differentiate environments or important websites.
- ⚠️ **Confirmation for Forms**: Add a confirmation step before submitting forms.
- 🚫 **Disable Form Inputs**: Block all input fields on selected websites to avoid unintended modifications.

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
