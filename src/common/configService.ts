import { StorageInterface } from './storage/storageInterface';
import { DomainConfig, LabelColor, LabelPosition } from './types';

export class ConfigService {
  private static readonly CONFIG_KEY_DOMAINS = 'domains';

  public static readonly DEFAULT_CONFIG: Readonly<DomainConfig> = Object.freeze(
    {
      displayLabel: true,
      labelColor: LabelColor.RED,
      labelPosition: LabelPosition.BOTTOM_MIDDLE,
      confirmForms: false,
      disableInputs: false
    }
  );

  constructor(private readonly storage: StorageInterface) {}

  /**
   * Updates configuration for a specific domain
   */
  async updateDomainConfig(
    domain: string,
    value: Partial<DomainConfig>
  ): Promise<void> {
    const domains = await this.loadDomainsConfig();
    domains[domain] = {
      ...ConfigService.DEFAULT_CONFIG,
      ...domains[domain],
      ...value
    };
    await this.saveDomainsConfig(domains);
  }

  /**
   * Retrieves configuration for a specific domain
   */
  async getDomainConfig(domain: string): Promise<DomainConfig | null> {
    const domains = await this.loadDomainsConfig();
    return domains[domain] || null;
  }

  /**
   * Removes configuration for a specific domain
   */
  async removeDomainConfig(domain: string): Promise<void> {
    const domains = await this.loadDomainsConfig();
    delete domains[domain];
    await this.saveDomainsConfig(domains);
  }

  /**
   * Saves all domain configurations
   */
  public async saveDomainsConfig(
    domains: Record<string, DomainConfig>
  ): Promise<void> {
    await this.storage.set(ConfigService.CONFIG_KEY_DOMAINS, domains);
  }

  /**
   * Loads all domain configurations
   */
  public async loadDomainsConfig(): Promise<Record<string, DomainConfig>> {
    return (
      (await this.storage.get<Record<string, DomainConfig>>(
        ConfigService.CONFIG_KEY_DOMAINS
      )) || {}
    );
  }
}
