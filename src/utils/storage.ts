/**
 * Safe localStorage / sessionStorage wrapper
 */

const isBrowser = (): boolean => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const storage = {
  get<T = unknown>(key: string, fallback: T | null = null): T | null {
    if (!isBrowser()) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T = unknown>(key: string, value: T): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },

  remove(key: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  clear(): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  },
};

export const sessionStorage = {
  get<T = unknown>(key: string, fallback: T | null = null): T | null {
    if (!isBrowser() || typeof window.sessionStorage === "undefined") return fallback;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T = unknown>(key: string, value: T): void {
    if (!isBrowser() || typeof window.sessionStorage === "undefined") return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },

  remove(key: string): void {
    if (!isBrowser() || typeof window.sessionStorage === "undefined") return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
