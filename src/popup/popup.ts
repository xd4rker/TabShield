import { ConfigService } from "../common/configService";
import { DomainConfig } from "../common/types";
import { UrlUtils } from "../common/utils/urlUtils";
import { DomUtils } from "../common/utils/domUtils";
import { BrowserUtils } from "../common/utils/browserUtils";
import { Storage } from "../common/storage/storage";

export class Popup {
    private configService = new ConfigService(new Storage());

    private readonly elements = {
        enableButton: DomUtils.getElement<HTMLElement>("enable-btn"),
        disableButton: DomUtils.getElement<HTMLElement>("disable-btn"),
        displayLabelCheckbox: DomUtils.getElement<HTMLInputElement>("display-label-checkbox"),
        enableConfirmCheckbox: DomUtils.getElement<HTMLInputElement>("enable-confirm-checkbox"),
        disableInputsCheckbox: DomUtils.getElement<HTMLInputElement>("disable-inputs-checkbox"),
        labelField: DomUtils.getElement<HTMLElement>("custom-label"),
        labelInput: DomUtils.getElement<HTMLInputElement>("label-input"),
        colorPicker: DomUtils.getElement<HTMLElement>("color-picker"),
        optionsButton: DomUtils.getElement<HTMLElement>("options-btn"),
        enabledContainer: DomUtils.getElement<HTMLElement>("enabled-container"),
        disabledContainer: DomUtils.getElement<HTMLElement>("disabled-container"),
        specialPageContainer: DomUtils.getElement<HTMLElement>("special-page-container"),
        versionElement: DomUtils.getElement<HTMLElement>("extension-version"),
        colorOptions: document.querySelectorAll(".color-option")
    };

    async init() {
        this.setVersion();
        this.initOptions();

        const url = await BrowserUtils.getCurrentTabUrl();
        if (!url || UrlUtils.isSpecialUrl(url)) {
            this.showSpecialPageContainer();
            return;
        }

        const hostname = UrlUtils.getHostname(url);
        if (!hostname) return;

        const currentConfig = await this.configService.getDomainConfig(hostname);
        this.toggleUI(Boolean(currentConfig));
        this.setupEventListeners(hostname, currentConfig);
    }

    private setVersion(): void {
        this.elements.versionElement.textContent = 'v' + BrowserUtils.getExtensionVersion();
    }

    private initOptions() {
        this.elements.optionsButton.addEventListener("click", () => {
            BrowserUtils.openOptionsPage("/src/options/options.html");
            window.close();
        });
    }

    private setupEventListeners(hostname: string, config: DomainConfig | null) {
        this.elements.enableButton.addEventListener("click", () => this.handleToggle(hostname, true));
        this.elements.disableButton.addEventListener("click", () => this.handleToggle(hostname, false));

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
            }, 400);
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
        await BrowserUtils.reloadCurrentTab();
        await this.init();
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
}

if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        new Popup().init();
    });
}
