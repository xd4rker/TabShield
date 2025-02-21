export interface DomainConfig {
    displayLabel: boolean,
    label?: string,
    confirmForms: boolean,
    disableInputs: boolean,
    labelColor: string,
}

interface DomainConfigStore {
    [domain: string]: DomainConfig;
}
