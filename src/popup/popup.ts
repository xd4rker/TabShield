import browser from "webextension-polyfill";
import { ConfigService } from "../common/configService";
import { Storage } from "../common/storage";
import { DomainConfig } from "../common/types";
import { extractHostname, isSpecialUrl } from "../common/urlUtil";

export class Popup {
    private configService = new ConfigService(new Storage());
    private enableButton: HTMLElement;
    private disableButton: HTMLElement;
    private displayLabelCheckbox: HTMLInputElement;
    private enableConfirmCheckbox: HTMLInputElement;
    private disableInputsCheckbox: HTMLInputElement;
    private labelField: HTMLElement;
    private labelInput: HTMLInputElement;
    private colorPicker: HTMLElement;
    private colorOptions: NodeListOf<Element>;
    private optionsButton: HTMLElement;

    constructor() {
        this.enableButton = this.getElement("enable-btn");
        this.disableButton = this.getElement("disable-btn");
        this.displayLabelCheckbox = this.getElement("display-label-checkbox");
        this.enableConfirmCheckbox = this.getElement("enable-confirm-checkbox");
        this.disableInputsCheckbox = this.getElement("disable-inputs-checkbox");
        this.labelField = this.getElement("custom-label");
        this.labelInput = this.getElement("label-input");
        this.colorPicker = this.getElement("color-picker");
        this.colorOptions = document.querySelectorAll(".color-option");
        this.optionsButton = this.getElement("options-btn");
    }

    async init() {
        this.setVersion();

        const url = await this.getCurrentUrl();
        if (!url || isSpecialUrl(url)) {
            this.showSpecialPageContainer();
            return;
        }

        const hostname = extractHostname(url);
        if (!hostname) return;

        const currentConfig = await this.configService.getDomainConfig(hostname);
        this.toggleUI(Boolean(currentConfig));
        this.setupEventListeners(hostname, currentConfig);

        this.optionsButton.addEventListener("click", () => {
            browser.tabs.create({ url: "/src/options/options.html" });
        });
    }

    private setVersion(): void {
        const versionElement = this.getElement("extension-version");
        versionElement.textContent = 'v' + browser.runtime.getManifest().version;
    }

    private setupEventListeners(hostname: string, config: DomainConfig | null) {
        this.enableButton.addEventListener("click", () => this.handleToggle(hostname, true));
        this.disableButton.addEventListener("click", () => this.handleToggle(hostname, false));

        if (!config) {
            return;
        }

        this.initializeFeatureCheckbox(this.displayLabelCheckbox, hostname, "displayLabel", config.displayLabel);
        this.initializeFeatureCheckbox(this.enableConfirmCheckbox, hostname, "confirmForms", config.confirmForms);
        this.initializeFeatureCheckbox(this.disableInputsCheckbox, hostname, "disableInputs", config.disableInputs);

        this.labelInput.value = config?.label ?? "";
        this.setupLabelInputListener(hostname);
        this.setupColorPicker(hostname, config);
    }

    private async updateConfig(hostname: string, config: Partial<DomainConfig>): Promise<void> {
        await this.configService.updateDomainConfig(hostname, config);
        this.reloadPage();
    }

    private initializeFeatureCheckbox(checkbox: HTMLInputElement, hostname: string, key: string, state: boolean) {
        checkbox.addEventListener("change", async () => {
            await this.updateConfig(hostname, { [key]: checkbox.checked });
            if (key === "displayLabel") {
                this.toggleLabelVisibility(checkbox.checked);
            }
        });

        if (state && !checkbox.checked) {
            checkbox.checked = true;
        }

        if (key === "displayLabel") {
            this.toggleLabelVisibility(checkbox.checked);
        }
    }

    private setupLabelInputListener(hostname: string) {
        let timeout: NodeJS.Timeout;
        this.labelInput.addEventListener("keyup", () => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                await this.updateConfig(hostname, { label: this.labelInput.value });
            }, 400);
        });
    }

    private setupColorPicker(hostname: string, config: Partial<DomainConfig>) {
        this.colorOptions.forEach(option => {
            if (option.getAttribute("data-color") === config?.labelColor) {
                this.setSelectedColor(option);
            }

            option.addEventListener("click", async () => {
                this.setSelectedColor(option);
                const color = option.getAttribute("data-color") ?? '#dd2d23';
                await this.updateConfig(hostname, { labelColor: color });
            });
        });
    }

    private setSelectedColor(option: Element) {
        this.colorOptions.forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
    }

    public async handleToggle(hostname: string, enable: boolean) {
        if (enable) {
            await this.updateConfig(hostname, ConfigService.DEFAULT_CONFIG);
        } else {
            await this.configService.removeDomainConfig(hostname);
        }
        this.toggleUI(enable);
        this.reloadPage();
        this.init();
    }

    private toggleUI(enabled: boolean) {
        this.getElement("enabled-container").style.display = enabled ? "block" : "none";
        this.getElement("disabled-container").style.display = enabled ? "none" : "block";
    }

    private toggleLabelVisibility(show: boolean) {
        this.colorPicker.style.display = show ? "flex" : "none";
        this.labelField.style.display = show ? "flex" : "none";
    }

    private async getCurrentUrl(): Promise<string | null> {
        const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0] ?? null;
        return tab?.url || null;
    }

    private showSpecialPageContainer() {
        this.getElement("special-page-container").style.display = "block";
    }

    private async reloadPage(): Promise<void> {
        const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0] ?? null;
        if (tab) browser.tabs.reload(tab.id);
    }

    private getElement<T extends HTMLElement>(id: string): T {
        const element = document.getElementById(id) as T | null;
        if (!element) throw new Error(`Element with ID '${id}' not found`);
        return element;
    }
}

if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        const popup = new Popup();
        popup.init();
    });
}