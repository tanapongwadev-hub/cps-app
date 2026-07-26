/**
 * Sidebar Store — user-specific sidebar customisation
 *
 * Persisted to localStorage so favourites + recents survive reloads.
 * Keyed under `admin.sidebar.prefs` (separate from UI store so the sidebar
 * preferences are easy to clear independently).
 *
 * Two slices:
 *   - `pinnedMenuIds` — menu item IDs the user has starred (shown in a "PINNED"
 *     section at the top of the sidebar)
 *   - `recentPaths`   — last 5 menu paths the user has visited (shown in a
 *     "RECENT" section). Auto-evicted in FIFO order; capped at 5.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SESSION_STORAGE_KEYS } from "@/constants/app";

const MAX_RECENT = 5;

interface SidebarState {
  pinnedMenuIds: string[];
  recentPaths: string[];

  /** Pin a menu (idempotent). */
  pin: (menuId: string) => void;
  /** Unpin a menu (idempotent). */
  unpin: (menuId: string) => void;
  /** Toggle pin state. Returns the new state. */
  togglePin: (menuId: string) => boolean;
  /** Reorder pinned items (e.g. drag-drop). */
  reorderPinned: (fromIndex: number, toIndex: number) => void;

  /** Record a visit to `path` (idempotent — moving a path to the top). */
  recordVisit: (path: string) => void;
  /** Remove a single path from recents. */
  forgetPath: (path: string) => void;
  /** Clear all recents (keeps pinned). */
  clearRecents: () => void;
  /** Clear all sidebar customisation (pinned + recents). */
  reset: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      pinnedMenuIds: [],
      recentPaths: [],

      pin: (menuId) =>
        set((state) =>
          state.pinnedMenuIds.includes(menuId)
            ? state
            : { pinnedMenuIds: [...state.pinnedMenuIds, menuId] },
        ),

      unpin: (menuId) =>
        set((state) => ({
          pinnedMenuIds: state.pinnedMenuIds.filter((id) => id !== menuId),
        })),

      togglePin: (menuId) => {
        const isPinned = get().pinnedMenuIds.includes(menuId);
        if (isPinned) {
          get().unpin(menuId);
          return false;
        }
        get().pin(menuId);
        return true;
      },

      reorderPinned: (fromIndex, toIndex) =>
        set((state) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.pinnedMenuIds.length ||
            toIndex >= state.pinnedMenuIds.length
          ) {
            return state;
          }
          const next = [...state.pinnedMenuIds];
          const moved = next.splice(fromIndex, 1)[0];
          if (moved !== undefined) next.splice(toIndex, 0, moved);
          return { pinnedMenuIds: next };
        }),

      recordVisit: (path) =>
        set((state) => {
          if (!path || path === "/") return state;
          // Move-to-top semantics: remove existing, prepend, cap length.
          const next = [path, ...state.recentPaths.filter((p) => p !== path)].slice(
            0,
            MAX_RECENT,
          );
          return { recentPaths: next };
        }),

      forgetPath: (path) =>
        set((state) => ({
          recentPaths: state.recentPaths.filter((p) => p !== path),
        })),

      clearRecents: () => set({ recentPaths: [] }),

      reset: () => set({ pinnedMenuIds: [], recentPaths: [] }),
    }),
    {
      name: SESSION_STORAGE_KEYS.SIDEBAR_PREFS,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** Hook selector — re-renders only when the pin set for a given id changes. */
export const useIsPinned = (menuId: string): boolean =>
  useSidebarStore((s) => s.pinnedMenuIds.includes(menuId));

export const SIDEBAR_LIMITS = { MAX_RECENT } as const;
