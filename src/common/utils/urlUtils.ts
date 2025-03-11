export class UrlUtils {
  /**
   * Returns whether a given URL is special
   */
  static isSpecialUrl(url: string): boolean {
    return /^(about:|chrome:\/\/|edge:\/\/|opera:\/\/|brave:\/\/|safari-resource:\/\/|chrome-extension:|moz-extension:)/.test(
      url
    );
  }

  /**
   * Get hostname from URL
   */
  static getHostname(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }
}
