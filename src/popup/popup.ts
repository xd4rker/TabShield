import { ConfigService } from "../common/configService";
import { DomainConfig } from "../common/types";
import { UrlUtils } from "../common/utils/urlUtils";
import { DomUtils } from "../common/utils/domUtils";
import { BrowserUtils } from "../common/utils/browserUtils";
import { SyncStorage } from "../common/storage/synStorage";

export class Popup {
    private readonly configService;
    private readonly elements = this.getElements();

    constructor(configService: ConfigService) {
        this.configService = configService;
    }

    private getElements() {
        return {
            controls: {
                enable: DomUtils.getElement<HTMLElement>("enable-btn"),
                disable: DomUtils.getElement<HTMLElement>("disable-btn"),
                options: DomUtils.getElement<HTMLElement>("options-btn"),
            },
            displayLabelCheckbox: DomUtils.getElement<HTMLInputElement>("display-label-checkbox"),
            enableConfirmCheckbox: DomUtils.getElement<HTMLInputElement>("enable-confirm-checkbox"),
            disableInputsCheckbox: DomUtils.getElement<HTMLInputElement>("disable-inputs-checkbox"),
            labelField: DomUtils.getElement<HTMLElement>("custom-label"),
            labelInput: DomUtils.getElement<HTMLInputElement>("label-input"),
            colorPicker: DomUtils.getElement<HTMLElement>("color-picker"),
            enabledContainer: DomUtils.getElement<HTMLElement>("enabled-container"),
            disabledContainer: DomUtils.getElement<HTMLElement>("disabled-container"),
            specialPageContainer: DomUtils.getElement<HTMLElement>("special-page-container"),
            versionElement: DomUtils.getElement<HTMLElement>("extension-version"),
            colorOptions: document.querySelectorAll(".color-option")
        }
    }

    async init() {
        this.setVersion();
        this.initOptionsButton();

        const url = await BrowserUtils.getCurrentTabUrl();
        if (!url) {
            console.error('Could not get current tab URL');
            return;
        }

        if (UrlUtils.isSpecialUrl(url)) {
            this.showSpecialPageContainer();
            return;
        }

        const hostname = UrlUtils.getHostname(url);
        if (!hostname) return;

        const config = await this.configService.getDomainConfig(hostname);
        this.toggleUI(Boolean(config));
        this.setupEventListeners(hostname, config);
    }

    private setVersion(): void {
        this.elements.versionElement.textContent = 'v' + BrowserUtils.getExtensionVersion();
    }

    private initOptionsButton() {
        this.elements.controls.options.addEventListener("click", () => {
            BrowserUtils.openOptionsPage("/src/options/options.html");
            this.close();
        });
    }

    private setupEventListeners(hostname: string, config: DomainConfig | null) {
        this.elements.controls.enable.addEventListener("click", () => this.handleToggle(hostname, true));
        this.elements.controls.disable.addEventListener("click", () => this.handleToggle(hostname, false));

        if (!config) return;

        this.initializeCheckboxes(hostname, config);
        this.setupLabelInput(hostname, config);
        this.setupColorPicker(hostname, config);
    }

    private async updateConfig(hostname: string, config: Partial<DomainConfig>): Promise<void> {
        await this.configService.updateDomainConfig(hostname, config);
        await BrowserUtils.reloadCurrentTab();
    }

    private initializeCheckboxes(hostname: string, config: DomainConfig): void {
        this.initializeFeatureCheckbox(
            this.elements.displayLabelCheckbox,
            hostname,
            "displayLabel",
            config.displayLabel,
            (checked) => this.toggleLabelVisibility(checked)
        );

        this.initializeFeatureCheckbox(
            this.elements.enableConfirmCheckbox,
            hostname,
            "confirmForms",
            config.confirmForms
        );

        this.initializeFeatureCheckbox(
            this.elements.disableInputsCheckbox,
            hostname,
            "disableInputs",
            config.disableInputs
        );
    }

    private initializeFeatureCheckbox(
        checkbox: HTMLInputElement,
        hostname: string,
        key: keyof DomainConfig,
        state: boolean,
        callback?: (checked: boolean) => void
    ): void {
        checkbox.checked = state;

        checkbox.addEventListener("change", async () => {
            await this.updateConfig(hostname, { [key]: checkbox.checked } as Partial<DomainConfig>);

            if (callback) {
                callback(checkbox.checked);
            }
        });

        if (key === "displayLabel" && callback) {
            callback(checkbox.checked);
        }
    }

    private setupLabelInput(hostname: string, config: DomainConfig) {
        let timeout: NodeJS.Timeout;
        this.elements.labelInput.addEventListener("keyup", () => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                await this.updateConfig(hostname, { label: this.elements.labelInput.value });
            }, 500);
        });

        const { labelInput } = this.elements;
        labelInput.value = config?.label ?? "";

        const debouncedUpdate = this.debounce(async (value: string) => {
            await this.updateConfig(hostname, { label: value });
        }, 400);

        labelInput.addEventListener("keyup", () => {
            debouncedUpdate(labelInput.value);
        });
    }

    private debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    private setupColorPicker(hostname: string, config: Partial<DomainConfig>) {
        this.elements.colorOptions.forEach(option => {
            if (option.getAttribute("data-color") === config?.labelColor) {
                this.setSelectedColor(option);
            }

            option.addEventListener("click", async () => {
                this.setSelectedColor(option);
                const color = option.getAttribute("data-color") ?? ConfigService.DEFAULT_CONFIG.labelColor;
                await this.updateConfig(hostname, { labelColor: color });
            });
        });
    }

    private setSelectedColor(option: Element) {
        this.elements.colorOptions.forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
    }

    public async handleToggle(hostname: string, enable: boolean) {
        if (enable) {
            await this.updateConfig(hostname, ConfigService.DEFAULT_CONFIG);
        } else {
            await this.configService.removeDomainConfig(hostname);
        }

        this.toggleUI(enable);
        await this.init();
        await BrowserUtils.reloadCurrentTab();
        if (!enable) this.close();
    }

    private toggleUI(enabled: boolean) {
        this.elements.enabledContainer.style.display = enabled ? "block" : "none";
        this.elements.disabledContainer.style.display = enabled ? "none" : "block";
    }

    private toggleLabelVisibility(show: boolean) {
        this.elements.colorPicker.style.display = show ? "flex" : "none";
        this.elements.labelField.style.display = show ? "flex" : "none";
    }

    private showSpecialPageContainer() {
        this.elements.specialPageContainer.style.display = "block";
    }

    private close() {
        window.close();
    }
}

if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        const configService = new ConfigService(new SyncStorage());
        new Popup(configService).init();
    });
}
