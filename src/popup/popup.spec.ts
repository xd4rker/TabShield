/** @jest-environment jsdom */

import fs from 'fs';
import path from 'path';
import browser from 'webextension-polyfill';
import { Popup } from './popup';
import { ConfigService } from '../common/configService';
import { FakeStorage } from '../common/storage/fakeStorage';
import { LabelColor } from '../common/types';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

jest.spyOn(window, 'close').mockImplementation(() => {});
jest.mock('webextension-polyfill', () => ({
  tabs: {
    query: jest.fn(),
    reload: jest.fn()
  },
  runtime: {
    getManifest: jest.fn(() => ({ version: '0.0.1' }))
  }
}));

describe('Popup', () => {
  let popup: Popup;
  let configService: ConfigService;

  const htmlContent = fs.readFileSync(
    path.resolve(__dirname, 'popup.html'),
    'utf8'
  );
  const cssContent = fs.readFileSync(
    path.resolve(__dirname, 'popup.css'),
    'utf8'
  );

  const style = document.createElement('style');
  style.innerHTML = cssContent;

  beforeEach(() => {
    document.body.innerHTML = htmlContent;

    document.head.appendChild(style);

    configService = new ConfigService(new FakeStorage());
    popup = new Popup(configService);

    jest.clearAllMocks();
  });

  test('should initialize and toggle UI based on domain config', async () => {
    const mockUrl = 'https://example.com';
    (browser.tabs.query as jest.Mock).mockResolvedValue([{ url: mockUrl }]);

    const config = {
      displayLabel: true,
      confirmForms: true,
      disableInputs: true,
      labelColor: LabelColor.RED
    };
    await configService.updateDomainConfig('example.com', config);
    await popup.init();

    expect(
      (document.getElementById('disabled-container') as HTMLElement).style
        .display
    ).toBe('none');
    expect(
      (document.getElementById('enabled-container') as HTMLElement).style
        .display
    ).toBe('block');
    expect(
      (document.getElementById('display-label-checkbox') as HTMLInputElement)
        .checked
    ).toBe(true);
    expect(
      (document.getElementById('enable-confirm-checkbox') as HTMLInputElement)
        .checked
    ).toBe(true);
    expect(
      (document.getElementById('disable-inputs-checkbox') as HTMLInputElement)
        .checked
    ).toBe(true);

    await delay(100);
    expect(
      (document.getElementById('color-picker') as HTMLElement).style.display
    ).toBe('flex');
    expect(
      (document.getElementById('custom-label') as HTMLElement).style.display
    ).toBe('flex');

    const selectedColor = document
      .querySelector(`.color-option.selected`)
      ?.getAttribute('data-color');
    expect(selectedColor).toEqual(config.labelColor);
  });

  test('should enable domain config through button', async () => {
    const mockUrl = 'https://example.com';
    (browser.tabs.query as jest.Mock).mockResolvedValue([{ url: mockUrl }]);

    await popup.init();

    expect(
      (document.getElementById('disabled-container') as HTMLElement).style
        .display
    ).toBe('block');
    expect(
      (document.getElementById('enabled-container') as HTMLElement).style
        .display
    ).toBe('none');

    const enableButton = document.getElementById('enable-btn');
    enableButton?.click();

    await delay(100);
    expect(
      (document.getElementById('disabled-container') as HTMLElement).style
        .display
    ).toBe('none');
    expect(
      (document.getElementById('enabled-container') as HTMLElement).style
        .display
    ).toBe('block');
    expect(
      (document.getElementById('display-label-checkbox') as HTMLInputElement)
        .checked
    ).toBe(true);
    expect(
      (document.getElementById('enable-confirm-checkbox') as HTMLInputElement)
        .checked
    ).toBe(false);
    expect(
      (document.getElementById('disable-inputs-checkbox') as HTMLInputElement)
        .checked
    ).toBe(false);
    expect(
      (document.getElementById('color-picker') as HTMLElement).style.display
    ).toBe('flex');
    expect(
      (document.getElementById('custom-label') as HTMLElement).style.display
    ).toBe('flex');

    const disableButton = document.getElementById('disable-btn');
    disableButton?.click();

    await delay(100);
    expect(
      (document.getElementById('disabled-container') as HTMLElement).style
        .display
    ).toBe('block');
    expect(
      (document.getElementById('enabled-container') as HTMLElement).style
        .display
    ).toBe('none');
  });

  test('Should toggle color/position picker and label input visibility', async () => {
    const mockUrl = 'https://example.com';
    (browser.tabs.query as jest.Mock).mockResolvedValue([{ url: mockUrl }]);

    await popup.init();

    const enableButton = document.getElementById('enable-btn');
    const displayLabelCheckbox = document.getElementById(
      'display-label-checkbox'
    ) as HTMLInputElement;
    const positionPicker = document.getElementById(
      'label-position-container'
    ) as HTMLElement;
    const colorPicker = document.getElementById('color-picker') as HTMLElement;
    const labelField = document.getElementById('custom-label') as HTMLElement;

    enableButton?.click();
    await delay(100);

    expect(positionPicker.style.display).toBe('block');
    expect(colorPicker.style.display).toBe('flex');
    expect(labelField.style.display).toBe('flex');

    displayLabelCheckbox.click();
    await delay(100);

    expect(positionPicker.style.display).toBe('none');
    expect(colorPicker.style.display).toBe('none');
    expect(labelField.style.display).toBe('none');
  });

  test('should update label input with debounce', async () => {
    const mockUrl = 'https://example.com';
    (browser.tabs.query as jest.Mock).mockResolvedValue([{ url: mockUrl }]);

    await popup.init();

    const enableButton = document.getElementById('enable-btn');
    enableButton?.click();
    await delay(100);

    jest.useFakeTimers();
    const labelInput = document.getElementById(
      'label-input'
    ) as HTMLInputElement;
    const label = 'New label';
    labelInput.value = label;
    labelInput.dispatchEvent(new Event('input'));

    jest.advanceTimersByTime(500);

    const config = await configService.getDomainConfig('example.com');
    expect(config).not.toEqual(null);
    expect(config?.label).toEqual(label);

    jest.useRealTimers();
  });

  test('should reload page when toggling settings', async () => {
    const mockTab = { id: 1, url: 'https://example.com' };
    (browser.tabs.query as jest.Mock).mockResolvedValue([mockTab]);

    await popup.handleToggle('example.com', true);

    expect(browser.tabs.reload).toHaveBeenCalledWith(1);
  });
});
