import browser from "webextension-polyfill";
import { ConfigService } from "../common/configService";
import { Storage } from "../common/storage";
import { DomainConfig } from "../common/types";

export class Settings {
    private configService = new ConfigService(new Storage());
    private websitesList: HTMLElement;
    private websiteTemplate: HTMLTemplateElement;
    private exportButton: HTMLElement;
    private importButton: HTMLElement;
    private importFileInput: HTMLInputElement;
    private importStatusMessage: HTMLElement;
    private domains: Record<string, DomainConfig> = {};

    constructor() {
        this.websitesList = this.getElement("websites-list");
        this.websiteTemplate = this.getElement("website-template");
        this.exportButton = this.getElement("export-btn");
        this.importButton = this.getElement("import-btn");
        this.importFileInput = this.getElement("import-file");
        this.importStatusMessage = this.getElement("import-status");
    }

    async init(): Promise<void> {
        this.setVersion();
        await this.loadWebsites();
        this.setupEventListeners();
    }

    private setVersion(): void {
        const versionElement = this.getElement("extension-version");
        const versionElement2 = this.getElement("extension-version-2");
        versionElement.textContent = 'v' + browser.runtime.getManifest().version;
        versionElement2.textContent = 'v' + browser.runtime.getManifest().version;
    }

    private async loadWebsites(): Promise<void> {
        this.domains = await this.configService.loadDomainsConfig();

        // Sort domains alphabetically
        const sortedDomains = Object.keys(this.domains).sort();

        // Clear existing list
        this.websitesList.innerHTML = '';

        if (sortedDomains.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No websites are currently enabled.';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#666';
            this.websitesList.appendChild(emptyMessage);
            return;
        }

        // Create entries for each domain
        sortedDomains.forEach(domain => {
            this.createWebsiteElement(domain, this.domains[domain]);
        });
    }

    private createWebsiteElement(domain: string, config: DomainConfig): void {
        // Clone template
        const websiteItem = this.websiteTemplate.content.cloneNode(true) as DocumentFragment;
        const container = websiteItem.querySelector('.website-item') as HTMLElement;

        // Set domain name
        const domainElement = container.querySelector('.website-domain') as HTMLElement;
        domainElement.textContent = domain;

        // Set up toggle functionality
        const toggleButton = container.querySelector('.toggle-btn') as HTMLElement;
        const configSection = container.querySelector('.website-config') as HTMLElement;
        const toggleImage = toggleButton.querySelector('img') as HTMLImageElement;

        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = configSection.style.display !== 'none';
            configSection.style.display = isExpanded ? 'none' : 'block';
            toggleImage.src = isExpanded ? '/icon/down.png' : '/icon/up.png';
        });

        // Set up header click to expand/collapse
        const header = container.querySelector('.website-header') as HTMLElement;
        header.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).closest('.delete-btn')) {
                const isExpanded = configSection.style.display !== 'none';
                configSection.style.display = isExpanded ? 'none' : 'block';
                toggleImage.src = isExpanded ? '/icon/down.png' : '/icon/up.png';
            }
        });

        // Set up delete functionality
        const deleteButton = container.querySelector('.delete-btn') as HTMLElement;
        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to remove TabShield protection from ${domain}?`)) {
                await this.configService.removeDomainConfig(domain);
                await this.loadWebsites();
            }
        });

        // Set up feature checkboxes
        this.setupCheckboxes(container, domain, config);

        // Set up label input
        this.setupLabelInput(container, domain, config);

        // Set up color picker
        this.setupColorPicker(container, domain, config);

        // Add to DOM
        this.websitesList.appendChild(container);
    }

    private setupCheckboxes(container: HTMLElement, domain: string, config: DomainConfig): void {
        const checkboxes = container.querySelectorAll('.feature-checkbox') as NodeListOf<HTMLInputElement>;

        checkboxes.forEach(checkbox => {
            const featureName = checkbox.getAttribute('name') as keyof DomainConfig;
            if (!featureName) return;

            // Set initial state
            checkbox.checked = Boolean(config[featureName]);

            // Add change listener
            checkbox.addEventListener('change', async () => {
                const update = { [featureName]: checkbox.checked } as Partial<DomainConfig>;
                await this.configService.updateDomainConfig(domain, update);

                // Toggle display of label and color picker
                if (featureName === 'displayLabel') {
                    this.toggleLabelVisibility(container, checkbox.checked);
                }
            });

            // Initialize visibility of label and color picker
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

        let timeout: number | undefined;
        labelInput.addEventListener('keyup', () => {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(async () => {
                await this.configService.updateDomainConfig(domain, { label: labelInput.value });
            }, 400);
        });
    }

    private setupColorPicker(container: HTMLElement, domain: string, config: DomainConfig): void {
        const colorOptions = container.querySelectorAll('.color-option') as NodeListOf<HTMLElement>;

        colorOptions.forEach(option => {
            if (option.getAttribute('data-color') === config.labelColor) {
                this.setSelectedColor(container, option);
            }

            option.addEventListener('click', async () => {
                this.setSelectedColor(container, option);
                const color = option.getAttribute('data-color') || '#dd2d23';
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
        // Export configuration
        this.exportButton.addEventListener('click', () => {
            this.exportConfiguration();
        });

        // Import configuration
        this.importButton.addEventListener('click', () => {
            this.importFileInput.click();
        });

        this.importFileInput.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                this.importConfiguration(file);
            }
        });
    }

    private exportConfiguration(): void {
        try {
            // Create formatted JSON
            const jsonConfig = JSON.stringify(this.domains, null, 2);

            // Create blob and download link
            const blob = new Blob([jsonConfig], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `tabshield-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(downloadLink);
            downloadLink.click();

            // Clean up
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);

            this.showStatusMessage('Configuration exported successfully!', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showStatusMessage('Failed to export configuration.', 'error');
        }
    }

    private async importConfiguration(file: File): Promise<void> {
        try {
            const fileContent = await this.readFileAsText(file);
            const importedConfig = JSON.parse(fileContent);

            // Validate config structure
            if (!this.validateConfig(importedConfig)) {
                throw new Error('Invalid configuration file format');
            }

            // Handle conflicts
            if (Object.keys(this.domains).length > 0) {
                const mergeConfirmed = confirm('Existing configuration detected. Do you want to merge with your current settings? Click "OK" to merge or "Cancel" to replace all settings.');

                if (mergeConfirmed) {
                    // Merge configurations (existing settings take precedence for conflicts)
                    Object.keys(importedConfig).forEach(domain => {
                        if (!this.domains[domain]) {
                            this.domains[domain] = importedConfig[domain];
                        }
                    });
                } else {
                    // Replace all settings
                    this.domains = importedConfig;
                }
            } else {
                // No existing config, just use imported
                this.domains = importedConfig;
            }

            // Save and reload
            await this.configService.saveDomainsConfig(this.domains);
            await this.loadWebsites();

            this.showStatusMessage('Configuration imported successfully!', 'success');
        } catch (error) {
            console.error('Import failed:', error);
            this.showStatusMessage(`Import failed: ${(error as Error).message}`, 'error');
        }

        // Reset input
        this.importFileInput.value = '';
    }

    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(new Error('Failed to read file' + e));
            reader.readAsText(file);
        });
    }

    private validateConfig(config: any): boolean {
        if (!config || typeof config !== 'object') return false;

        // Check structure of each domain config
        for (const domain in config) {
            const domainConfig = config[domain];
            if (!domainConfig || typeof domainConfig !== 'object') return false;

            // Check required properties
            if (typeof domainConfig.displayLabel !== 'boolean' ||
                typeof domainConfig.confirmForms !== 'boolean' ||
                typeof domainConfig.disableInputs !== 'boolean' ||
                typeof domainConfig.labelColor !== 'string') {
                return false;
            }

            // Optional label property
            if (domainConfig.label !== undefined && typeof domainConfig.label !== 'string') {
                return false;
            }
        }

        return true;
    }

    private showStatusMessage(message: string, type: 'success' | 'error'): void {
        this.importStatusMessage.textContent = message;
        this.importStatusMessage.className = `status-message ${type}`;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.importStatusMessage.style.display = 'none';
        }, 5000);
    }

    private getElement<T extends HTMLElement>(id: string): T {
        const element = document.getElementById(id) as T | null;
        if (!element) throw new Error(`Element with ID '${id}' not found`);
        return element;
    }
}

// Add to ConfigService.ts
declare module "../common/configService" {
    interface ConfigService {
        saveDomainsConfig(domains: Record<string, DomainConfig>): Promise<void>;
    }
}

if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        const settings = new Settings();
        settings.init();
    });
}