# <img src="public/icon/48.png" align="absmiddle"> TabShield

[<img src="https://user-images.githubusercontent.com/7257362/196050028-71dd50f6-19a8-4405-ab7e-a022eb5a4287.png">](https://chromewebstore.google.com/detail/tabshield/einfknhcpbipilnjckhfkgaekljghame) [<img src="https://user-images.githubusercontent.com/7257362/196050056-9afc4687-bc02-4b7f-ad4a-3b2e86e65507.png">](https://addons.mozilla.org/en-US/firefox/addon/tabshield/)

**TabShield** is a cross-browser extension designed to help prevent accidental changes on your important websites.  
Whether you're a developer working across different environments, a professional managing critical data, or a user who wants extra safeguards while browsing, TabShield will help you minimize mistakes and unintended actions.

> ![A coder’s worst feeling ever](https://github.com/user-attachments/assets/26584936-2122-45f4-8b86-02b2a38c7d46)
>
> _A coder's worst feeling ever. By [CommitStrip](https://www.commitstrip.com/en/2013/10/09/la-pire-sensation-du-codeur/)._

## Features

- **Custom Labels**: Display a clear, colored label on tabs to easily differentiate environments or important websites.
- **Form Confirmation**: Add a confirmation step before submitting forms.
- **Disable Form Inputs**: Block all input fields on selected websites to avoid unintended changes.
- **Configuration Import/Export**: Save, share, and restore your TabShield settings effortlessly.

## Installation

- **Chrome**: [Chrome Web Store](https://chromewebstore.google.com/detail/tabshield/einfknhcpbipilnjckhfkgaekljghame)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tabshield/)

## Build Locally

To build TabShield locally, run:

```sh
npm install # Install dependencies
npm run bundle:chrome # Build for Chrome
npm run bundle:firefox # Build for Firefox
```

This will build the extension packages under `dist-archives`.
