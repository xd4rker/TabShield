export class FakeStorage {
    private store: Record<string, unknown> = {};

    async set<T>(key: string, value: T): Promise<void> {
        this.store[key] = value;
    }

    async get<T>(key: string): Promise<T | null> {
        return (this.store[key] as T) ?? null;
    }

    async remove(key: string): Promise<void> {
        delete this.store[key];
    }
}
