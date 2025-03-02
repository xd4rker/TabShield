import browser from "webextension-polyfill";

export class BrowserUtils {
    /**
     * Gets the extension version from manifest
     */
    static getExtensionVersion(): string {
        return browser.runtime.getManifest().version;
    }

    /**
     * Gets the URL of the currently active tab
     */
    static async getCurrentTabUrl(): Promise<string | null> {
        const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0] ?? null;
        return tab?.url || null;
    }

    /**
     * Reloads the current tab
     */
    static async reloadCurrentTab(): Promise<void> {
        const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0] ?? null;
        if (tab?.id) browser.tabs.reload(tab.id);
    }

    /**
     * Opens a new tab with the specified URL
     */
    static openOptionsPage(url: string): void {
        browser.tabs.create({ url });
    }
}
