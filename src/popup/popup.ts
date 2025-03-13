import { ConfigService } from '../common/configService';
import { DomainConfig } from '../common/types';
import { UrlUtils } from '../common/utils/urlUtils';
import { DomUtils } from '../common/utils/domUtils';
import { BrowserUtils } from '../common/utils/browserUtils';
import { SyncStorage } from '../common/storage/synStorage';

export class Popup {
  private readonly configService;
  private readonly elements = this.getElements();

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  private getElements() {
    return {
      controls: {
        enable: DomUtils.getElement<HTMLElement>('enable-btn'),
        disable: DomUtils.getElement<HTMLElement>('disable-btn'),
        options: DomUtils.getElement<HTMLElement>('options-btn')
      },
      checkboxes: {
        displayLabel: DomUtils.getElement<HTMLInputElement>(
          'display-label-checkbox'
        ),
        enableConfirm: DomUtils.getElement<HTMLInputElement>(
          'enable-confirm-checkbox'
        ),
        disableInputs: DomUtils.getElement<HTMLInputElement>(
          'disable-inputs-checkbox'
        )
      },
      label: {
        field: DomUtils.getElement('custom-label'),
        input: DomUtils.getElement<HTMLInputElement>('label-input')
      },
      color: {
        picker: DomUtils.getElement('color-picker'),
        options: document.querySelectorAll('.color-option')
      },
      containers: {
        enabled: DomUtils.getElement('enabled-container'),
        disabled: DomUtils.getElement('disabled-container'),
        specialPage: DomUtils.getElement('special-page-container')
      },
      version: DomUtils.getElement('extension-version')
    };
  }

  async init(): Promise<void> {
    this.setVersion();
    this.setupCommonControls();
    await this.applyConfig();
  }

  private setVersion(): void {
    this.elements.version.textContent = `v${BrowserUtils.getExtensionVersion()}`;
  }

  private setupCommonControls(): void {
    this.elements.controls.options.addEventListener(
      'click',
      () => this.openOptionsPage(),
      { once: true }
    );
  }

  private async applyConfig(): Promise<void> {
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
    this.setupDomainControls(hostname, config);
  }

  private setupDomainControls(
    hostname: string,
    config: DomainConfig | null
  ): void {
    this.elements.controls.enable.addEventListener(
      'click',
      () => this.handleToggle(hostname, true),
      { once: true }
    );
    this.elements.controls.disable.addEventListener(
      'click',
      () => this.handleToggle(hostname, false),
      { once: true }
    );

    if (!config) return;

    this.setupCheckboxes(hostname, config);
    this.setupLabelInput(hostname, config);
    this.setupColorPicker(hostname, config);
  }

  private openOptionsPage(): void {
    BrowserUtils.openUrl('/src/options/options.html');
    this.close();
  }

  public async handleToggle(hostname: string, enable: boolean): Promise<void> {
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

  private async updateConfig(
    hostname: string,
    config: Partial<DomainConfig>
  ): Promise<void> {
    await this.configService.updateDomainConfig(hostname, config);
    await BrowserUtils.reloadCurrentTab();
  }

  private setupCheckboxes(hostname: string, config: DomainConfig): void {
    this.setupCheckbox(
      this.elements.checkboxes.displayLabel,
      hostname,
      'displayLabel',
      config.displayLabel,
      (checked) => this.toggleLabelVisibility(checked)
    );

    this.setupCheckbox(
      this.elements.checkboxes.enableConfirm,
      hostname,
      'confirmForms',
      config.confirmForms
    );

    this.setupCheckbox(
      this.elements.checkboxes.disableInputs,
      hostname,
      'disableInputs',
      config.disableInputs
    );
  }

  private setupCheckbox(
    checkbox: HTMLInputElement,
    hostname: string,
    key: keyof DomainConfig,
    state: boolean,
    callback?: (checked: boolean) => void
  ): void {
    checkbox.checked = state;
    checkbox.onchange = async () => {
      await this.updateConfig(hostname, { [key]: checkbox.checked });
      callback?.(checkbox.checked);
    };

    if (key === 'displayLabel') {
      callback?.(checkbox.checked);
    }
  }

  private setupLabelInput(hostname: string, config: DomainConfig): void {
    const input = this.elements.label.input;
    input.value = config?.label ?? '';

    const debouncedUpdate = this.debounce(async (value: string) => {
      await this.updateConfig(hostname, { label: value });
    }, 400);

    input.oninput = () => debouncedUpdate(input.value);
  }

  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  private setupColorPicker(
    hostname: string,
    config: Partial<DomainConfig>
  ): void {
    this.elements.color.options.forEach((option) => {
      const color = option.getAttribute('data-color');
      if (color === config?.labelColor) {
        this.setSelectedColor(option);
      }

      option.addEventListener('click', async () => {
        this.setSelectedColor(option);
        await this.updateConfig(hostname, {
          labelColor: color || ConfigService.DEFAULT_CONFIG.labelColor
        });
      });
    });
  }

  private setSelectedColor(option: Element): void {
    this.elements.color.options.forEach((opt) =>
      opt.classList.remove('selected')
    );
    option.classList.add('selected');
  }

  private toggleUI(enabled: boolean): void {
    this.elements.containers.enabled.style.display = enabled ? 'block' : 'none';
    this.elements.containers.disabled.style.display = enabled
      ? 'none'
      : 'block';
  }

  private toggleLabelVisibility(show: boolean): void {
    this.elements.color.picker.style.display = show ? 'flex' : 'none';
    this.elements.label.field.style.display = show ? 'flex' : 'none';
  }

  private showSpecialPageContainer(): void {
    this.elements.containers.specialPage.style.display = 'block';
  }

  private close(): void {
    window.close();
  }
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const configService = new ConfigService(new SyncStorage());
    new Popup(configService).init();
  });
}
