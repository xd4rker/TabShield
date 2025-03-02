import { ConfigService } from "../common/configService";
import { Storage } from "../common/storage";
import { DomainConfig } from "../common/types";
import { DomUtils } from "../common/utils/domUtils";
import { BrowserUtils } from "../common/utils/browserUtils";

interface ImportResult {
    success: boolean;
    message: string;
}

export class Options {
    private configService = new ConfigService(new Storage());
    private domains: Record<string, DomainConfig> = {};

    private readonly elements = {
        websitesList: DomUtils.getElement<HTMLElement>("websites-list"),
        websiteTemplate: DomUtils.getElement<HTMLTemplateElement>("website-template"),
        exportButton: DomUtils.getElement<HTMLElement>("export-btn"),
        importButton: DomUtils.getElement<HTMLElement>("import-btn"),
        importFileInput: DomUtils.getElement<HTMLInputElement>("import-file"),
        importStatusMessage: DomUtils.getElement<HTMLElement>("import-status"),
        versionElement: DomUtils.getElement<HTMLElement>("extension-version"),
        versionElement2: DomUtils.getElement<HTMLElement>("extension-version-2")
    };

    async init(): Promise<void> {
        this.setVersion();
        await this.loadWebsites();
        this.setupEventListeners();
    }

    private setVersion(): void {
        const version = BrowserUtils.getExtensionVersion();
        this.elements.versionElement.textContent = 'v' + version;
        this.elements.versionElement2.textContent = 'v' + version;
    }

    private async loadWebsites(): Promise<void> {
        this.domains = await this.configService.loadDomainsConfig();
        const sortedDomains = Object.keys(this.domains).sort();
        const { websitesList } = this.elements;

        websitesList.innerHTML = '';

        if (sortedDomains.length === 0) {
            websitesList.appendChild(this.createEmptyMessage());
            return;
        }

        sortedDomains.forEach(domain => {
            this.createWebsiteElement(domain, this.domains[domain]);
        });
    }

    private createEmptyMessage(): HTMLElement {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No websites are currently enabled.';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#666';
        return emptyMessage;
    }

    private createWebsiteElement(domain: string, config: DomainConfig): void {
        const websiteItem = this.elements.websiteTemplate.content.cloneNode(true) as DocumentFragment;
        const container = websiteItem.querySelector('.website-item') as HTMLElement;

        this.setupWebsiteHeader(container, domain);
        this.setupWebsiteToggle(container);
        this.setupDeleteButton(container, domain);
        this.setupCheckboxes(container, domain, config);
        this.setupLabelInput(container, domain, config);
        this.setupColorPicker(container, domain, config);

        this.elements.websitesList.appendChild(container);
    }

    private setupWebsiteHeader(container: HTMLElement, domain: string): void {
        const domainElement = container.querySelector('.website-domain') as HTMLElement;
        domainElement.textContent = domain;

        const header = container.querySelector('.website-header') as HTMLElement;
        header.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).closest('.delete-btn')) {
                this.toggleConfigSection(container);
            }
        });
    }

    private setupWebsiteToggle(container: HTMLElement): void {
        const toggleButton = container.querySelector('.toggle-btn') as HTMLElement;
        const toggleImage = toggleButton.querySelector('img') as HTMLImageElement;

        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleConfigSection(container, toggleImage);
        });
    }

    private toggleConfigSection(container: HTMLElement, toggleImage?: HTMLImageElement): void {
        const configSection = container.querySelector('.website-config') as HTMLElement;
        const isExpanded = configSection.style.display !== 'none';

        configSection.style.display = isExpanded ? 'none' : 'block';

        if (toggleImage) {
            toggleImage.src = isExpanded ? '/icon/down.png' : '/icon/up.png';
        } else {
            const img = container.querySelector('.toggle-btn img') as HTMLImageElement;
            if (img) {
                img.src = isExpanded ? '/icon/down.png' : '/icon/up.png';
            }
        }
    }

    private setupDeleteButton(container: HTMLElement, domain: string): void {
        const deleteButton = container.querySelector('.delete-btn') as HTMLElement;
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to remove TabShield from ${domain}?`)) {
                await this.configService.removeDomainConfig(domain);
                await this.loadWebsites();
            }
        });
    }

    private setupCheckboxes(container: HTMLElement, domain: string, config: DomainConfig): void {
        const checkboxes = container.querySelectorAll('.feature-checkbox') as NodeListOf<HTMLInputElement>;

        checkboxes.forEach(checkbox => {
            const featureName = checkbox.getAttribute('name') as keyof DomainConfig;
            if (!featureName) return;

            checkbox.checked = Boolean(config[featureName]);

            checkbox.addEventListener('change', async () => {
                const update = { [featureName]: checkbox.checked } as Partial<DomainConfig>;
                await this.configService.updateDomainConfig(domain, update);

                if (featureName === 'displayLabel') {
                    this.toggleLabelVisibility(container, checkbox.checked);
                }
            });

            if (featureName === 'displayLabel') {
                this.toggleLabelVisibility(container, checkbox.checked);
            }
        });
    }

    private toggleLabelVisibility(container: HTMLElement, show: boolean): void {
        const colorPicker = container.querySelector('.color-picker') as HTMLElement;
        const labelField = container.querySelector('.custom-label') as HTMLElement;

        colorPicker.style.display = show ? 'flex' : 'none';
        labelField.style.display = show ? 'flex' : 'none';
    }

    private setupLabelInput(container: HTMLElement, domain: string, config: DomainConfig): void {
        const labelInput = container.querySelector('.label-input') as HTMLInputElement;
        labelInput.value = config.label || '';

        const debouncedUpdate = this.debounce(async (value: string) => {
            await this.configService.updateDomainConfig(domain, { label: value });
        }, 400);

        labelInput.addEventListener('keyup', () => {
            debouncedUpdate(labelInput.value);
        });
    }

    private debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
        let timeout: number | undefined;

        return (...args: Parameters<T>) => {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => func(...args), wait);
        };
    }

    private setupColorPicker(container: HTMLElement, domain: string, config: DomainConfig): void {
        const colorOptions = container.querySelectorAll('.color-option') as NodeListOf<HTMLElement>;

        colorOptions.forEach(option => {
            if (option.getAttribute('data-color') === config.labelColor) {
                this.setSelectedColor(container, option);
            }

            option.addEventListener('click', async () => {
                this.setSelectedColor(container, option);
                const color = option.getAttribute('data-color') || ConfigService.DEFAULT_CONFIG.labelColor;
                await this.configService.updateDomainConfig(domain, { labelColor: color });
            });
        });
    }

    private setSelectedColor(container: HTMLElement, option: HTMLElement): void {
        const colorOptions = container.querySelectorAll('.color-option') as NodeListOf<HTMLElement>;
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    }

    private setupEventListeners(): void {
        this.elements.exportButton.addEventListener('click', () => {
            this.exportConfiguration();
        });

        this.elements.importButton.addEventListener('click', () => {
            this.elements.importFileInput.click();
        });

        this.elements.importFileInput.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                this.importConfiguration(file);
            }
        });
    }

    private exportConfiguration(): void {
        try {
            const jsonConfig = JSON.stringify(this.domains, null, 2);
            const blob = new Blob([jsonConfig], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            this.downloadFile(url, `tabshield-config-${new Date().toISOString().split('T')[0]}.json`);
            this.showStatusMessage('Configuration exported successfully.', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showStatusMessage('Failed to export configuration.', 'error');
        }
    }

    private downloadFile(url: string, filename: string): void {
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    }

    private async importConfiguration(file: File): Promise<void> {
        try {
            const fileContent = await this.readFileAsText(file);
            const importedConfig = JSON.parse(fileContent);

            if (!this.validateConfig(importedConfig)) {
                throw new Error('Invalid configuration file format');
            }

            const result = await this.handleConfigMerging(importedConfig);

            if (result.success) {
                await this.configService.saveDomainsConfig(this.domains);
                await this.loadWebsites();
            }

            this.showStatusMessage(result.message, result.success ? 'success' : 'error');
        } catch (error) {
            console.error('Import failed:', error);
            this.showStatusMessage(`Import failed: ${(error as Error).message}`, 'error');
        }

        this.elements.importFileInput.value = '';
    }

    private async handleConfigMerging(importedConfig: Record<string, DomainConfig>): Promise<ImportResult> {
        const hasExistingConfig = Object.keys(this.domains).length > 0;

        if (!hasExistingConfig) {
            this.domains = importedConfig;
            return { success: true, message: 'Configuration imported successfully.' };
        }

        const mergeConfirmed = confirm(
            'Existing configuration detected. Do you want to merge with your current settings? ' +
            'Click "OK" to merge or "Cancel" to replace all settings.'
        );

        if (mergeConfirmed) {
            Object.keys(importedConfig).forEach(domain => {
                if (!this.domains[domain]) {
                    this.domains[domain] = importedConfig[domain];
                }
            });
            return { success: true, message: 'Configuration merged successfully.' };
        } else {
            this.domains = importedConfig;
            return { success: true, message: 'Configuration replaced successfully.' };
        }
    }

    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(new Error('Failed to read file: ' + e));
            reader.readAsText(file);
        });
    }

    private validateConfig(config: any): boolean {
        if (!config || typeof config !== 'object') return false;

        for (const domain in config) {
            const domainConfig = config[domain];
            if (!domainConfig || typeof domainConfig !== 'object') return false;

            if (typeof domainConfig.displayLabel !== 'boolean' ||
                typeof domainConfig.confirmForms !== 'boolean' ||
                typeof domainConfig.disableInputs !== 'boolean' ||
                typeof domainConfig.labelColor !== 'string') {
                return false;
            }

            if (domainConfig.label !== undefined && typeof domainConfig.label !== 'string') {
                return false;
            }
        }

        return true;
    }

    private showStatusMessage(message: string, type: 'success' | 'error'): void {
        const { importStatusMessage } = this.elements;
        importStatusMessage.textContent = message;
        importStatusMessage.className = `status-message ${type}`;
        importStatusMessage.style.display = 'block';

        setTimeout(() => {
            importStatusMessage.style.display = 'none';
        }, 5000);
    }
}

if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        new Options().init();
    });
}