export class DomUtils {
    /**
     * Safely retrieves an HTML element by ID with type checking
     */
    static getElement<T extends HTMLElement>(id: string): T {
        const element = document.getElementById(id) as T | null;
        if (!element) throw new Error(`Element with ID '${id}' not found`);
        return element;
    }
}
