// Safe localStorage wrapper with in-memory fallback for SSR & restricted sandbox contexts

const memoryStorage = new Map<string, string>();

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`[storage] Failed to read ${key} from localStorage`, e);
  }
  return memoryStorage.get(key) || null;
}

export function safeSetItem(key: string, value: string): void {
  memoryStorage.set(key, value);
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`[storage] Failed to write ${key} to localStorage`, e);
  }
}

export function safeRemoveItem(key: string): void {
  memoryStorage.delete(key);
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`[storage] Failed to remove ${key} from localStorage`, e);
  }
}
