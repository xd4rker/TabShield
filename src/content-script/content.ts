import browser from "webextension-polyfill";
import { ConfigService } from "../common/configService";
import { Storage } from "../common/storage";

export class ContentScript {
    private configService = new ConfigService(new Storage());
    private mutationObserver: MutationObserver | null = null;

    public async init(): Promise<void> {
        const hostname = window.location.hostname;
        const config = await this.configService.getDomainConfig(hostname);
        if (!config) return;

        if (config.displayLabel) {
            this.displayLabel(config.labelColor, config.label);
        }
        if (config.confirmForms) {
            this.preventFormSubmission();
        }
        if (config.disableInputs) {
            this.disableInputs();
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
            async (event: Event) => {
                event.preventDefault();
                event.stopPropagation();

                const form = event.target as HTMLFormElement;
                if (form) {
                    const shouldSubmit = await this.createConfirmationDialog();
                    if (shouldSubmit) {
                        form.submit();
                    }
                }
            },
            true
        );
    }

    private disableInputs(): void {
        this.disableInteractiveElements();
        this.disableForms();

        this.mutationObserver = new MutationObserver(() => {
            this.disableForms();
            this.disableInteractiveElements();
        });
        this.mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    private displayLabel(color: string = "#dd2d23", text: string = ""): void {
        const labelText = text.trim() || "TabShield Enabled";
        const label = document.createElement("div");
        label.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <img src="${browser.runtime.getURL(
            "/icon/shield-white.png"
        )}" width="20" height="20" style="flex-shrink: 0;">
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
            width: "50%",
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
            document.body.appendChild(modal);
        });
    }

    private disableInteractiveElements(): void {
        const interactiveSelectors = "input, textarea, select, button";
        document.querySelectorAll<HTMLElement>(interactiveSelectors).forEach((element) => {
            element.setAttribute("disabled", "true");
            this.applyStyles(element, {
                filter: "grayscale(100%) opacity(0.5)",
                cursor: "not-allowed",
            });
        });

        document.querySelectorAll<HTMLElement>("[onclick]").forEach((element) => {
            element.onclick = () => false;
            this.applyStyles(element, {
                pointerEvents: "none",
                filter: "grayscale(100%) opacity(0.5)",
            });
        });
    }

    private disableForms(): void {
        document.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
            form.addEventListener("submit", (event: Event) => event.preventDefault());
        });
    }

    private applyStyles(
        element: HTMLElement,
        styles: Partial<CSSStyleDeclaration>
    ): void {
        Object.assign(element.style, styles);
    }
}

new ContentScript().init();
