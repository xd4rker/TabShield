import { ConfigService } from './configService';
import { FakeStorage } from './storage/fakeStorage';
import { DomainConfig, LabelColor, LabelPosition } from './types';

describe('ConfigService', () => {
  let configService: ConfigService;
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
    configService = new ConfigService(storage);
  });

  test('should return null if domain config does not exist', async () => {
    const config = await configService.getDomainConfig('example.com');
    expect(config).toBeNull();
  });

  test('should return the correct domain config when it exists', async () => {
    const expectedConfig: DomainConfig = {
      displayLabel: true,
      confirmForms: true,
      disableInputs: false,
      labelColor: LabelColor.RED,
      labelPosition: LabelPosition.BOTTOM_MIDDLE
    };
    await storage.set('domains', { 'example.com': expectedConfig });

    const config = await configService.getDomainConfig('example.com');
    expect(config).toEqual(expectedConfig);
  });

  test('should set and persist a domain config', async () => {
    const domainConfig: DomainConfig = {
      displayLabel: false,
      confirmForms: true,
      disableInputs: true,
      labelColor: LabelColor.RED,
      labelPosition: LabelPosition.BOTTOM_MIDDLE
    };

    const config = await configService.getDomainConfig('example.com');
    expect(config).toBeNull();

    await configService.updateDomainConfig('example.com', domainConfig);
    const cfg = await configService.getDomainConfig('example.com');
    expect(cfg).toEqual(domainConfig);
  });

  test('should update a specific property while keeping other values', async () => {
    const domainConfig: DomainConfig = {
      displayLabel: true,
      confirmForms: false,
      disableInputs: false,
      labelColor: LabelColor.RED,
      labelPosition: LabelPosition.BOTTOM_MIDDLE
    };
    await configService.updateDomainConfig('example.com', domainConfig);

    const newConfig = { confirmForms: true };
    await configService.updateDomainConfig('example.com', newConfig);

    const cfg = await configService.getDomainConfig('example.com');
    expect(cfg).toEqual({
      ...domainConfig,
      ...newConfig
    });
  });

  test('should remove a domain config', async () => {
    const domainConfig: DomainConfig = {
      displayLabel: true,
      confirmForms: false,
      disableInputs: false,
      labelColor: LabelColor.RED,
      labelPosition: LabelPosition.BOTTOM_MIDDLE
    };
    await configService.updateDomainConfig('example.com', domainConfig);
    await configService.removeDomainConfig('example.com');

    const config = await configService.getDomainConfig('example.com');
    expect(config).toBeNull();
  });

  test('should return an empty object when storage is empty', async () => {
    const domainsConfig = await configService.loadDomainsConfig();
    expect(domainsConfig).toEqual({});
  });

  test('should return all stored domains config', async () => {
    const storedConfig = {
      'example.com': {
        displayLabel: false,
        confirmForms: false,
        disableInputs: true,
        labelColor: LabelColor.RED,
        labelPosition: LabelPosition.BOTTOM_MIDDLE
      }
    };

    await configService.updateDomainConfig(
      'example.com',
      storedConfig['example.com']
    );
    const domainsConfig = await configService.loadDomainsConfig();
    expect(domainsConfig).toEqual(storedConfig);
  });
});
