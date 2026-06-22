import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export class LocalKV {
  store = new Map<string, string>();
  private filePath: string;

  constructor(name?: string) {
    this.filePath = join(process.cwd(), `.kv-store${name ? '-' + name : ''}.json`);
    this.load();
  }

  private load() {
    try {
      if (existsSync(this.filePath)) {
        const data = JSON.parse(readFileSync(this.filePath, 'utf-8'));
        for (const [k, v] of Object.entries(data)) {
          this.store.set(k, v as string);
        }
      }
    } catch (e) {}
  }

  private save() {
    try {
      const data: Record<string, string> = {};
      for (const [k, v] of this.store.entries()) {
        data[k] = v;
      }
      writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {}
  }

  async get(key: string) { return this.store.get(key) || null; }
  async put(key: string, value: string) { this.store.set(key, value); this.save(); }
}
