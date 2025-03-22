import browser from 'webextension-polyfill';
import { ConfigService } from '../common/configService';
import { SyncStorage } from '../common/storage/synStorage';
import { LabelColor, LabelPosition } from '../common/types';

export class ContentScript {
  private readonly configService;
  private mutationObserver: MutationObserver | null = null;
  private observerThrottleTimeout: number | null = null;

  private static readonly THROTTLE_DELAY = 500;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  public async init(): Promise<void> {
    const config = await this.configService.getDomainConfig(
      window.location.hostname
    );
    if (!config) return;

    if (config.displayLabel) {
      this.displayLabel(config.labelColor, config.label, config.labelPosition);
    }

    if (config.confirmForms) this.preventFormSubmission();
    if (config.disableInputs) {
      this.disableInteractiveElements();
      this.observeDOMChanges();
    }
  }

  public cleanup(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  private preventFormSubmission(): void {
    document.addEventListener(
      'submit',
      async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const form = event.target as HTMLFormElement;
        if (!form) return;
        if (await this.createConfirmationDialog()) form.submit();
      },
      { capture: true, passive: false }
    );
  }

  private observeDOMChanges(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      const hasRelevantChanges = mutations.some(
        (mutation) => mutation.addedNodes.length > 0
      );
      if (!hasRelevantChanges) return;

      // Throttle processing
      if (this.observerThrottleTimeout === null) {
        this.observerThrottleTimeout = window.setTimeout(() => {
          this.disableInteractiveElements();
          this.observerThrottleTimeout = null;
        }, ContentScript.THROTTLE_DELAY);
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  private getPositionStyles(position: LabelPosition) {
    switch (position) {
      case LabelPosition.UP_LEFT:
        return { top: '10px', left: '10px', transform: 'none' };
      case LabelPosition.UP_MIDDLE:
        return { top: '10px', left: '50%', transform: 'translateX(-50%)' };
      case LabelPosition.UP_RIGHT:
        return { top: '10px', right: '10px', transform: 'none' };
      case LabelPosition.BOTTOM_LEFT:
        return { bottom: '10px', left: '10px', transform: 'none' };
      case LabelPosition.BOTTOM_MIDDLE:
        return {
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case LabelPosition.BOTTOM_RIGHT:
        return { bottom: '10px', right: '10px', transform: 'none' };
    }
  }

  private displayLabel(
    color: string = LabelColor.RED,
    text: string = '',
    position: LabelPosition = LabelPosition.BOTTOM_MIDDLE
  ): void {
    if (document.getElementById('tabshield-label')) return;

    const label = document.createElement('div');
    label.id = 'tabshield-label';

    const container = document.createElement('div');

    this.applyStyles(container, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    });

    const img = document.createElement('img');
    img.src = browser.runtime.getURL('/icon/icon-white.png');
    img.width = 20;
    img.height = 20;

    this.applyStyles(img, {
      flexShrink: '0'
    });

    const span = document.createElement('span');
    span.textContent = text.trim() || 'TabShield Enabled';

    container.appendChild(img);
    container.appendChild(span);
    label.appendChild(container);

    const positionStyles = this.getPositionStyles(position);

    this.applyStyles(label, {
      position: 'fixed',
      backgroundColor: color,
      color: 'white',
      padding: '10px 20px',
      borderRadius: '5px',
      boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
      fontSize: '15px',
      fontWeight: 'bold',
      zIndex: '999999',
      textAlign: 'center',
      fontFamily: 'Consolas, monaco, monospace',
      ...positionStyles
    });

    requestAnimationFrame(() => {
      document.body.appendChild(label);
    });
  }

  private createConfirmationDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      const fragment = document.createDocumentFragment();
      this.applyStyles(modal, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '1000'
      });

      const dialog = document.createElement('div');
      this.applyStyles(dialog, {
        background: '#fff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        minWidth: '350px',
        fontFamily: 'Consolas, monaco, monospace'
      });

      const message = document.createElement('p');
      message.textContent =
        'TabShield is enabled. Are you sure you want to submit this form?';
      this.applyStyles(message, {
        marginBottom: '20px',
        fontSize: '18px',
        color: '#333'
      });

      const buttonContainer = document.createElement('div');
      this.applyStyles(buttonContainer, {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
      });

      const confirmButton = document.createElement('button');
      confirmButton.textContent = 'Yes';
      this.applyStyles(confirmButton, {
        background: '#000',
        color: '#fff',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px'
      });
      confirmButton.onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'No';
      this.applyStyles(cancelButton, {
        background: '#fff',
        color: '#000',
        border: '2px solid #000',
        padding: '12px 24px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px'
      });
      cancelButton.onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };

      buttonContainer.append(confirmButton, cancelButton);
      dialog.append(message, buttonContainer);
      modal.append(dialog);
      fragment.appendChild(modal);

      requestAnimationFrame(() => {
        document.body.appendChild(fragment);
      });
    });
  }

  private disableInteractiveElements(): void {
    const interactiveElements = document.querySelectorAll<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), form, [onclick]'
    );

    interactiveElements.forEach((element) => {
      const tagName = element.tagName.toLowerCase();

      if (tagName === 'form') {
        element.addEventListener(
          'submit',
          (event: Event) => event.preventDefault(),
          { passive: false }
        );
        return;
      }

      if (element.hasAttribute('onclick')) {
        element.onclick = () => false;
        this.applyStyles(element, {
          pointerEvents: 'none',
          filter: 'grayscale(100%) opacity(0.5)'
        });
        return;
      }

      element.setAttribute('disabled', 'true');
      this.applyStyles(element, {
        filter: 'grayscale(100%) opacity(0.5)',
        cursor: 'not-allowed'
      });
    });
  }

  private applyStyles(
    element: HTMLElement,
    styles: Partial<CSSStyleDeclaration>
  ): void {
    Object.assign(element.style, styles);
  }
}

const init = async () => {
  const configService = new ConfigService(new SyncStorage());
  const contentScript = new ContentScript(configService);
  await contentScript.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
