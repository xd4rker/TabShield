export function isSpecialUrl(url: string): boolean {
    return /^(about:|chrome:\/\/|edge:\/\/|opera:\/\/|brave:\/\/|safari-resource:\/\/|chrome-extension:|moz-extension:)/.test(url);
}

export function extractHostname(url: string): string | null {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}