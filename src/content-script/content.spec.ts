/** @jest-environment jsdom */

import { ConfigService } from '../common/configService';
import { FakeStorage } from '../common/storage/fakeStorage';
import { LabelColor } from '../common/types';
import { ContentScript } from './content';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: jest.fn(() => 'localhost')
  },
  storage: {
    sync: {
      set: jest.fn(),
      get: jest.fn(() => {
        return {};
      }),
      remove: jest.fn()
    }
  }
}));

jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
  callback(0);
  return 0;
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('ContentScript', () => {
  let contentScript: ContentScript;
  let configService: ConfigService;

  beforeEach(() => {
    document.body.innerHTML = '';
    configService = new ConfigService(new FakeStorage());
    contentScript = new ContentScript(configService);
  });

  afterEach(() => {
    contentScript.cleanup();
  });

  describe('init', () => {
    it('should do nothing if no config is returned', async () => {
      await contentScript.init();
      expect(document.body.innerHTML).toBe('');
    });

    it('should display label when displayLabel is true', async () => {
      const config = {
        displayLabel: true,
        confirmForms: false,
        disableInputs: false,
        labelColor: LabelColor.RED
      };
      await configService.updateDomainConfig('localhost', config);
      await contentScript.init();

      const label = document.body.querySelector('div');
      expect(label).not.toBeNull();
      expect(label?.textContent).toContain('TabShield Enabled');
    });

    it('should display custom label', async () => {
      const config = {
        displayLabel: true,
        confirmForms: false,
        disableInputs: false,
        labelColor: LabelColor.RED,
        label: 'Custom Label'
      };
      await configService.updateDomainConfig('localhost', config);
      await contentScript.init();

      const label = document.body.querySelector('div');
      expect(label).not.toBeNull();
      expect(label?.textContent).toContain('Custom Label');
    });

    it('should intercept form submission and trigger confirmation when confirmForms is true', async () => {
      const config = {
        displayLabel: false,
        confirmForms: true,
        disableInputs: false
      };
      await configService.updateDomainConfig('localhost', config);
      await contentScript.init();

      const form = document.createElement('form');
      const submitSpy = jest.fn();
      form.submit = submitSpy;
      document.body.appendChild(form);

      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // The first button is the "Yes" button.
      const confirmButton = document.body.querySelector(
        'button'
      ) as HTMLButtonElement;
      expect(confirmButton).not.toBeNull();

      confirmButton.click();
      await delay(100);

      expect(submitSpy).toHaveBeenCalled();
    });

    it('should disable interactive elements when disableInputs is true', async () => {
      const config = {
        displayLabel: false,
        confirmForms: false,
        disableInputs: true
      };
      await configService.updateDomainConfig('localhost', config);

      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const select = document.createElement('select');
      const button = document.createElement('button');
      document.body.appendChild(input);
      document.body.appendChild(textarea);
      document.body.appendChild(select);
      document.body.appendChild(button);

      await contentScript.init();

      expect(input.disabled).toBe(true);
      expect(button.disabled).toBe(true);
      expect(textarea.disabled).toBe(true);
      expect(select.disabled).toBe(true);
      expect(input.style.filter).toBe('grayscale(100%) opacity(0.5)');
      expect(button.style.cursor).toBe('not-allowed');
    });
  });

  describe('createConfirmationDialog', () => {
    it('should resolve true when the confirm button is clicked', async () => {
      const promise: Promise<boolean> = (
        contentScript as any
      ).createConfirmationDialog();
      const modal = document.body.querySelector('div');
      expect(modal).not.toBeNull();

      // The first button is the "Yes" button.
      const confirmButton = document.body.querySelector(
        'button'
      ) as HTMLButtonElement;
      expect(confirmButton).not.toBeNull();

      confirmButton.click();
      const result = await promise;
      expect(result).toBe(true);
      expect(document.body.contains(modal!)).toBe(false);
    });

    it('should resolve false when the cancel button is clicked', async () => {
      const promise: Promise<boolean> = (
        contentScript as any
      ).createConfirmationDialog();
      const modal = document.body.querySelector('div');
      expect(modal).not.toBeNull();

      // The second button is the "No" button.
      const buttons = document.body.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(1);
      const cancelButton = buttons[1] as HTMLButtonElement;

      cancelButton.click();
      const result = await promise;
      expect(result).toBe(false);
      expect(document.body.contains(modal!)).toBe(false);
    });
  });

  describe('disableInteractiveElements', () => {
    it('should disable interactive elements and apply proper styles', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const select = document.createElement('select');
      const button = document.createElement('button');

      const clickable = document.createElement('div');
      clickable.setAttribute('onclick', "alert('clicked')");
      document.body.append(input, textarea, select, button, clickable);

      (contentScript as any).disableInteractiveElements();

      expect(input.disabled).toBe(true);
      expect(textarea.disabled).toBe(true);
      expect(select.disabled).toBe(true);
      expect(button.disabled).toBe(true);

      expect(clickable.style.pointerEvents).toBe('none');
    });
  });
});
