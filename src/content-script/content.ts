import browser from "webextension-polyfill";
import { ConfigService } from "../common/configService";
import { SyncStorage } from "../common/storage/synStorage";

export class ContentScript {
    private readonly configService;
    private mutationObserver: MutationObserver | null = null;
    private observerThrottleTimeout: number | null = null;

    private static readonly THROTTLE_DELAY = 500;

    constructor(configService: ConfigService) {
        this.configService = configService;
    }

    public async init(): Promise<void> {
        const config = await this.configService.getDomainConfig(window.location.hostname);
        if (!config) return;

        if (config.displayLabel) this.displayLabel(config.labelColor, config.label);
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
            "submit",
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
            const hasRelevantChanges = mutations.some(mutation => mutation.addedNodes.length > 0);
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

    private displayLabel(color: string = "#dd2d23", text: string = ""): void {
        const labelText = text.trim() || "TabShield Enabled";
        const label = document.createElement("div");
        label.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <img src="${browser.runtime.getURL("/icon/icon-white.png")}" width="20" height="20" style="flex-shrink: 0;">
        <span>${labelText}</span>
      </div>
    `;

        this.applyStyles(label, {
            position: "fixed",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: color,
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
            fontSize: "15px",
            fontWeight: "bold",
            zIndex: "999999",
            textAlign: "center",
            fontFamily: "Consolas, monaco, monospace",
        });

        document.body.appendChild(label);
    }

    private createConfirmationDialog(): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = document.createElement("div");
            this.applyStyles(modal, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: "1000",
            });

            const dialog = document.createElement("div");
            this.applyStyles(dialog, {
                background: "#fff",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                textAlign: "center",
                minWidth: "350px",
                fontFamily: "Consolas, monaco, monospace",
            });

            const message = document.createElement("p");
            message.textContent =
                "TabShield is enabled. Are you sure you want to submit this form?";
            this.applyStyles(message, {
                marginBottom: "20px",
                fontSize: "18px",
                color: "#333",
            });

            const buttonContainer = document.createElement("div");
            this.applyStyles(buttonContainer, {
                display: "flex",
                justifyContent: "center",
                gap: "15px",
            });

            const confirmButton = document.createElement("button");
            confirmButton.textContent = "Yes";
            this.applyStyles(confirmButton, {
                background: "#000",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
            });
            confirmButton.onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };

            const cancelButton = document.createElement("button");
            cancelButton.textContent = "No";
            this.applyStyles(cancelButton, {
                background: "#fff",
                color: "#000",
                border: "2px solid #000",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
            });
            cancelButton.onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };

            buttonContainer.appendChild(confirmButton);
            buttonContainer.appendChild(cancelButton);
            dialog.appendChild(message);
            dialog.appendChild(buttonContainer);
            modal.appendChild(dialog);

            requestAnimationFrame(() => {
                document.body.appendChild(modal);
            });
        });
    }

    private disableInteractiveElements(): void {
        const interactiveElements = document.querySelectorAll<HTMLElement>(
            "input, textarea, select, button, form, [onclick]"
        );

        interactiveElements.forEach(element => {
            const tagName = element.tagName.toLowerCase();

            if (tagName === "form") {
                element.addEventListener("submit", (event: Event) => event.preventDefault(), { passive: false });
                return;
            }

            if (element.hasAttribute("onclick")) {
                element.onclick = () => false;
                this.applyStyles(element, {
                    pointerEvents: "none",
                    filter: "grayscale(100%) opacity(0.5)"
                });
                return;
            }

            element.setAttribute("disabled", "true");
            this.applyStyles(element, {
                filter: "grayscale(100%) opacity(0.5)",
                cursor: "not-allowed"
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

const configService = new ConfigService(new SyncStorage());
new ContentScript(configService).init();
