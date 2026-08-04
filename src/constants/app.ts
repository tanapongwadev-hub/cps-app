/**
 * App-wide constants
 */

export const APP_NAME = "CPS";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "CPS Production Management System";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_DATE_FORMAT = "dd MMM yyyy";
export const DEFAULT_DATETIME_FORMAT = "dd MMM yyyy HH:mm";
export const DEFAULT_TIME_FORMAT = "HH:mm";

export const SESSION_STORAGE_KEYS = {
  AUTH_TOKEN: "admin.auth.token",
  REFRESH_TOKEN: "admin.auth.refresh_token",
  USER: "admin.auth.user",
  PERMISSIONS: "admin.auth.permissions",
  MENU: "admin.auth.menu",
  THEME: "admin.theme",
  LANGUAGE: "admin.language",
  SIDEBAR_COLLAPSED: "admin.sidebar.collapsed",
  SIDEBAR_PREFS: "admin.sidebar.prefs",
  RECENT_SEARCH: "admin.search.recent",
} as const;

export const QUERY_KEYS = {
  AUTH: {
    ME: ["auth", "me"] as const,
    SESSION: ["auth", "session"] as const,
  },
  USERS: {
    ALL: ["users"] as const,
    LIST: (params: unknown) => ["users", "list", params] as const,
    DETAIL: (id: string) => ["users", "detail", id] as const,
    ACCESS_SUMMARY: (id: string) => ["users", "access-summary", id] as const,
  },
  MATERIALS: {
    ALL: ["materials"] as const,
    LIST: (params: unknown) => ["materials", "list", params] as const,
    DETAIL: (id: string) => ["materials", "detail", id] as const,
    LOOKUPS: ["materials", "lookups"] as const,
  },
  UNITS: {
    ALL: ["units"] as const,
    LIST: (params: unknown) => ["units", "list", params] as const,
    DETAIL: (id: string) => ["units", "detail", id] as const,
  },
  SUPPLIERS: {
    ALL: ["suppliers"] as const,
    LIST: (params: unknown) => ["suppliers", "list", params] as const,
    DETAIL: (id: string) => ["suppliers", "detail", id] as const,
  },
  MATERIAL_MODELS: {
    ALL: ["material-models"] as const,
    LIST: (params: unknown) => ["material-models", "list", params] as const,
    DETAIL: (id: string) => ["material-models", "detail", id] as const,
  },
  DELIVERY_TYPES: {
    ALL: ["delivery-types"] as const,
    LIST: (params: unknown) => ["delivery-types", "list", params] as const,
    DETAIL: (id: string) => ["delivery-types", "detail", id] as const,
  },
  LOADING_POINTS: {
    ALL: ["loading-points"] as const,
    LIST: (params: unknown) => ["loading-points", "list", params] as const,
    DETAIL: (id: string) => ["loading-points", "detail", id] as const,
  },
  CATEGORIES: {
    ALL: ["categories"] as const,
    LIST: (params: unknown) => ["categories", "list", params] as const,
    DETAIL: (id: string) => ["categories", "detail", id] as const,
  },
  STATUS_ITEMS: {
    ALL: ["status-items"] as const,
    LIST: (params: unknown) => ["status-items", "list", params] as const,
    DETAIL: (id: string) => ["status-items", "detail", id] as const,
  },
  ORGANIZATIONS: {
    ALL: ["organizations"] as const,
    LIST: (params: unknown) => ["organizations", "list", params] as const,
    DETAIL: (id: string) => ["organizations", "detail", id] as const,
  },
  ROLES: {
    ALL: ["roles"] as const,
    LIST: (params: unknown) => ["roles", "list", params] as const,
    DETAIL: (id: string) => ["roles", "detail", id] as const,
  },
  DEPARTMENTS: {
    ALL: ["departments"] as const,
    LIST: (params: unknown) => ["departments", "list", params] as const,
    DETAIL: (id: string) => ["departments", "detail", id] as const,
    TREE: ["departments", "tree"] as const,
  },
  MENUS: {
    ALL: ["menus"] as const,
    TREE: ["menus", "tree"] as const,
  },
  TICKETS: {
    ALL: ["tickets"] as const,
    LIST: (params: unknown) => ["tickets", "list", params] as const,
    DETAIL: (id: string) => ["tickets", "detail", id] as const,
  },
  DASHBOARD: {
    STATS: ["dashboard", "stats"] as const,
    ACTIVITIES: ["dashboard", "activities"] as const,
  },
  ACTIVITY_LOGS: {
    LIST: (params: unknown) => ["activity-logs", "list", params] as const,
  },
  MASTER_DATA: {
    CATEGORIES: ["master-data", "categories"] as const,
    STATUSES: ["master-data", "statuses"] as const,
    ORGANIZATIONS: ["master-data", "organizations"] as const,
  },
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;
