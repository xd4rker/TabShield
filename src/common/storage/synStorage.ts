import browser from 'webextension-polyfill';
import { StorageInterface } from './storageInterface';

export class SyncStorage implements StorageInterface {
  async set<T>(key: string, value: T): Promise<void> {
    await browser.storage.sync.set({ [key]: value });
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await browser.storage.sync.get(key);
    return result[key] ?? null;
  }

  async remove(key: string): Promise<void> {
    await browser.storage.sync.remove(key);
  }
}
