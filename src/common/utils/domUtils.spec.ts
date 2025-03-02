/** @jest-environment jsdom */

import { DomUtils } from "./domUtils";

describe("DomUtils", () => {
    let element: HTMLDivElement;

    beforeEach(() => {
        element = document.createElement("div");
        element.id = "test-element";
        document.body.appendChild(element);
    });

    afterEach(() => {
        document.body.removeChild(element);
    });

    test("should retrieve an existing element by ID", () => {
        const retrievedElement = DomUtils.getElement<HTMLDivElement>("test-element");
        expect(retrievedElement).toBeInstanceOf(HTMLDivElement);
        expect(retrievedElement.id).toBe("test-element");
    });

    test("should throw an error when element does not exist", () => {
        expect(() => DomUtils.getElement<HTMLDivElement>("non-existent"))
            .toThrow("Element with ID 'non-existent' not found");
    });
});
