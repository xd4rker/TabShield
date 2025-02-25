export function isSpecialUrl(url: string): boolean {
    return /^(about:|chrome:\/\/|edge:\/\/|opera:\/\/|safari-resource:\/\/|moz-extension:\/\/)/.test(url);
}

export function extractHostname(url: string): string | null {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}