export class LocalKV {
  store = new Map<string, string>();
  async get(key: string) { return this.store.get(key) || null; }
  async put(key: string, value: string) { this.store.set(key, value); }
}
