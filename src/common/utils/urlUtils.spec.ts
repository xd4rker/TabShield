import { UrlUtils } from "./urlUtils";

describe("UrlUtils.isSpecialUrl", () => {
    test("should return true for browser-specific URLs", () => {
        const urls = ["about:blank", "chrome://extensions", "edge://settings", "opera://startpage"];
        urls.forEach((url) => {
            expect(UrlUtils.isSpecialUrl(url)).toBe(true);
        });
    });

    test("should return false for regular HTTP/HTTPS URLs", () => {
        const urls = ["https://example.com", "http://localhost:3000", "https://sub.domain.com/path"];
        urls.forEach((url) => {
            expect(UrlUtils.isSpecialUrl(url)).toBe(false);
        });
    });

    test("should return false for invalid or non-matching URLs", () => {
        const urls = ["ftp://example.com", "file://local/file.txt", "data:text/plain;base64,SGVsbG8="];
        urls.forEach((url) => {
            expect(UrlUtils.isSpecialUrl(url)).toBe(false);
        });
    });
});

describe("getHostname", () => {
    test("should extract hostname from valid URLs", () => {
        expect(UrlUtils.getHostname("https://example.com")).toBe("example.com");
        expect(UrlUtils.getHostname("http://sub.example.co.com")).toBe("sub.example.co.com");
        expect(UrlUtils.getHostname("https://www.google.com/search?q=test")).toBe("www.google.com");
    });

    test("should return null for invalid URLs", () => {
        expect(UrlUtils.getHostname("invalid-url")).toBe(null);
        expect(UrlUtils.getHostname("not a url")).toBe(null);
        expect(UrlUtils.getHostname("ftp://example.com")).toBe("example.com");
    });

    test("should handle URLs with ports", () => {
        expect(UrlUtils.getHostname("http://localhost:8080")).toBe("localhost");
        expect(UrlUtils.getHostname("https://127.0.0.1:3000")).toBe("127.0.0.1");
    });

    test("should handle URLs with authentication info", () => {
        expect(UrlUtils.getHostname("https://user:pass@example.com")).toBe("example.com");
        expect(UrlUtils.getHostname("http://admin:1234@sub.example.com")).toBe("sub.example.com");
    });

    test("should handle URLs with unusual but valid formats", () => {
        expect(UrlUtils.getHostname("http://[2001:db8::1]:8080")).toBe("[2001:db8::1]");
    });
});
