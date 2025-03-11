import browser from 'webextension-polyfill';
import { BrowserUtils } from './browserUtils';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getManifest: jest.fn().mockReturnValue({ version: '1.0.0' })
  },
  tabs: {
    query: jest.fn(),
    reload: jest.fn(),
    create: jest.fn()
  }
}));

describe('BrowserUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return the extension version', () => {
    expect(BrowserUtils.getExtensionVersion()).toBe('1.0.0');
  });

  test('should return the URL of the active tab', async () => {
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { url: 'https://example.com' }
    ]);

    const url = await BrowserUtils.getCurrentTabUrl();
    expect(url).toBe('https://example.com');
  });

  test('should return null if there is no active tab', async () => {
    (browser.tabs.query as jest.Mock).mockResolvedValue([]);
    const url = await BrowserUtils.getCurrentTabUrl();
    expect(url).toBeNull();
  });

  test('should reload the current tab', async () => {
    (browser.tabs.query as jest.Mock).mockResolvedValue([{ id: 123 }]);
    await BrowserUtils.reloadCurrentTab();
    expect(browser.tabs.reload).toHaveBeenCalledWith(123);
  });

  test('should not reload if there is no active tab', async () => {
    (browser.tabs.query as jest.Mock).mockResolvedValue([]);
    await BrowserUtils.reloadCurrentTab();
    expect(browser.tabs.reload).not.toHaveBeenCalled();
  });

  test('should open a new tab with the given URL', () => {
    BrowserUtils.openUrl('https://example.com');
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'https://example.com'
    });
  });
});
