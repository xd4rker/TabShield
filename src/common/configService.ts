import { Storage } from "./storage";
import { DomainConfig } from "./types";

export class ConfigService {
    private static readonly CONFIG_KEY_DOMAINS = "domains";
    public static readonly DEFAULT_CONFIG: Readonly<DomainConfig> = {
        displayLabel: true,
        confirmForms: false,
        disableInputs: false,
        labelColor: '#dd2d23',
    } as const;

    constructor(private readonly storage: Storage) { }

    async updateDomainConfig(domain: string, value: Partial<DomainConfig>): Promise<void> {
        const domains = await this.loadDomainsConfig();
        domains[domain] = { ...ConfigService.DEFAULT_CONFIG, ...domains[domain], ...value };
        await this.saveDomainsConfig(domains);
    }

    async getDomainConfig(domain: string): Promise<DomainConfig | null> {
        const domains = await this.loadDomainsConfig();
        return domains[domain] || null;
    }

    async removeDomainConfig(domain: string): Promise<void> {
        const domains = await this.loadDomainsConfig();
        delete domains[domain];
        await this.saveDomainsConfig(domains);
    }

    private async saveDomainsConfig(domains: Record<string, DomainConfig>): Promise<void> {
        await this.storage.set(ConfigService.CONFIG_KEY_DOMAINS, domains);
    }

    public async loadDomainsConfig(): Promise<Record<string, DomainConfig>> {
        return (await this.storage.get<Record<string, DomainConfig>>(ConfigService.CONFIG_KEY_DOMAINS)) || {};
    }
}
