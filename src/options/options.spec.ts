/** @jest-environment jsdom */

import fs from "fs";
import path from "path";
import { Options } from "./options";
import { ConfigService } from "../common/configService";
import { FakeStorage } from "../common/storage/fakeStorage";

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

jest.mock("webextension-polyfill", () => ({
    tabs: {
        query: jest.fn(),
        reload: jest.fn(),
    },
    runtime: {
        getManifest: jest.fn(() => ({ version: '1.0.0' })),
    }
}));

describe("Options Page", () => {
    let options: Options;
    let configService: ConfigService;

    const htmlContent = fs.readFileSync(path.resolve(__dirname, "options.html"), "utf8");
    const cssContent = fs.readFileSync(path.resolve(__dirname, "options.css"), "utf8");

    beforeEach(() => {
        document.body.innerHTML = htmlContent;

        const style = document.createElement("style");
        style.innerHTML = cssContent;
        document.head.appendChild(style);

        configService = new ConfigService(new FakeStorage());
        options = new Options(configService);

        jest.clearAllMocks();
    });

    test("should initialize and set version", async () => {
        await options.init();
        expect(document.getElementById("extension-version")?.textContent).toBe("v1.0.0");
    });

    test("should render websites list correctly", async () => {
        await configService.updateDomainConfig('example.com', { displayLabel: true });
        await options.init();

        expect(document.querySelector(".website-item")).not.toBeNull();
        expect(document.querySelector(".website-domain")?.textContent).toBe("example.com");
    });

    test("should toggle website config section on header click", async () => {
        await configService.updateDomainConfig('example.com', { displayLabel: true });
        await options.init();

        const header = document.querySelector(".website-header") as HTMLElement;
        const configSection = document.querySelector(".website-config") as HTMLElement;
        expect(configSection.style.display).toBe("none");

        header.click();
        await delay(100);
        expect(configSection.style.display).toBe("block");

        header.click();
        await delay(100);
        expect(configSection.style.display).toBe("none");
    });

    test("should remove website config on delete button click", async () => {
        jest.spyOn(window, "confirm").mockImplementation(() => true);
        await configService.updateDomainConfig('example.com', { displayLabel: true });
        await options.init();

        const deleteButton = document.querySelector(".delete-btn") as HTMLElement;
        deleteButton.click();
        await delay(100);

        await new Promise((r) => setTimeout(r, 100));
        expect(document.querySelector(".website-item")).toBeNull();
    });
});
