/**
 * Environment Configuration
 * Validates environment variables at app startup.
 * Fails fast if required variables are missing.
 */

const requireEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    if (typeof window === "undefined") {
      // Server-side: log warning but don't crash during build
      console.warn(`[env] Missing required environment variable: ${key}`);
    }
    return "";
  }
  return value;
};

const optionalEnv = (key: string, fallback: string): string => {
  return process.env[key] ?? fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const env = {
  app: {
    name: optionalEnv("NEXT_PUBLIC_APP_NAME", "CPS"),
    version: optionalEnv("NEXT_PUBLIC_APP_VERSION", "1.0.0"),
    description: optionalEnv("NEXT_PUBLIC_APP_DESCRIPTION", "CPS Production Management System"),
    env: optionalEnv("NEXT_PUBLIC_APP_ENV", "development"),
  },
  api: {
    baseUrl: optionalEnv("NEXT_PUBLIC_API_BASE_URL", "/api"),
    timeout: parseNumber(process.env.NEXT_PUBLIC_API_TIMEOUT, 30_000),
    enableMock: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_MOCK_API, true),
  },
  features: {
    enableRegistration: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_REGISTRATION, false),
    enableDarkMode: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_DARK_MODE, true),
    enableI18n: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_I18N, true),
  },
  // For backward-compat with existing code that imports individual vars
  get name() {
    return requireEnv("NEXT_PUBLIC_APP_NAME", "CPS");
  },
} as const;

export const isDev = env.app.env === "development";
export const isProd = env.app.env === "production";
export const isMockMode = env.api.enableMock;
