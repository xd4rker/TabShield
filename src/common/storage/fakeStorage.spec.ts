import { FakeStorage } from "./fakeStorage";

describe("FakeStorage", () => {
    let storage: FakeStorage;

    beforeEach(() => {
        storage = new FakeStorage();
    });

    test("should store and retrieve a value", async () => {
        await storage.set("key", "value");
        const result = await storage.get("key");
        expect(result).toBe("value");
    });

    test("should store and retrieve an object", async () => {
        const obj = { a: 1, b: "test" };
        await storage.set("key", obj);
        const result = await storage.get("key");
        expect(result).toEqual(obj);
    });

    test("should return null for non-existent key", async () => {
        const result = await storage.get("missing");
        expect(result).toBeNull();
    });

    test("should remove a stored value", async () => {
        await storage.set("key", "value");
        await storage.remove("key");
        const result = await storage.get("key");
        expect(result).toBeNull();
    });
});
