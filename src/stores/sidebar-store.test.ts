/**
 * Unit tests for the sidebar store (pinned + recents).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useSidebarStore, SIDEBAR_LIMITS } from "./sidebar-store";

describe("sidebarStore", () => {
  beforeEach(() => {
    // Reset between tests
    useSidebarStore.getState().reset();
    localStorage.clear();
  });

  describe("pin / unpin", () => {
    it("pins a menu idempotently", () => {
      const { pin } = useSidebarStore.getState();
      pin("a");
      pin("a");
      pin("b");
      expect(useSidebarStore.getState().pinnedMenuIds).toEqual(["a", "b"]);
    });

    it("unpins idempotently", () => {
      const { pin, unpin } = useSidebarStore.getState();
      pin("a");
      unpin("a");
      unpin("a"); // no-op
      expect(useSidebarStore.getState().pinnedMenuIds).toEqual([]);
    });

    it("togglePin returns the new state", () => {
      const { togglePin } = useSidebarStore.getState();
      expect(togglePin("a")).toBe(true);
      expect(togglePin("a")).toBe(false);
    });

    it("reorderPinned moves items", () => {
      const { pin, reorderPinned } = useSidebarStore.getState();
      pin("a");
      pin("b");
      pin("c");
      reorderPinned(0, 2);
      expect(useSidebarStore.getState().pinnedMenuIds).toEqual(["b", "c", "a"]);
    });

    it("reorderPinned is a no-op for out-of-bounds", () => {
      const { pin, reorderPinned } = useSidebarStore.getState();
      pin("a");
      reorderPinned(0, 5);
      expect(useSidebarStore.getState().pinnedMenuIds).toEqual(["a"]);
    });
  });

  describe("recents", () => {
    it("records visits with move-to-top semantics", () => {
      const { recordVisit } = useSidebarStore.getState();
      recordVisit("/a");
      recordVisit("/b");
      recordVisit("/a"); // move to top
      expect(useSidebarStore.getState().recentPaths).toEqual(["/a", "/b"]);
    });

    it("ignores empty and root paths", () => {
      const { recordVisit } = useSidebarStore.getState();
      recordVisit("");
      recordVisit("/");
      expect(useSidebarStore.getState().recentPaths).toEqual([]);
    });

    it("caps at MAX_RECENT (5)", () => {
      const { recordVisit } = useSidebarStore.getState();
      for (let i = 1; i <= 8; i++) recordVisit(`/path-${i}`);
      const result = useSidebarStore.getState().recentPaths;
      expect(result).toHaveLength(SIDEBAR_LIMITS.MAX_RECENT);
      // Most recent first → /path-8 is at the top, /path-4 is the oldest kept
      expect(result[0]).toBe("/path-8");
      expect(result[4]).toBe("/path-4");
    });

    it("forgetPath removes a single entry", () => {
      const { recordVisit, forgetPath } = useSidebarStore.getState();
      recordVisit("/a");
      recordVisit("/b");
      forgetPath("/a");
      expect(useSidebarStore.getState().recentPaths).toEqual(["/b"]);
    });

    it("clearRecents keeps pinned intact", () => {
      const { pin, recordVisit, clearRecents } = useSidebarStore.getState();
      pin("a");
      recordVisit("/x");
      clearRecents();
      const s = useSidebarStore.getState();
      expect(s.recentPaths).toEqual([]);
      expect(s.pinnedMenuIds).toEqual(["a"]);
    });
  });

  describe("reset", () => {
    it("clears both pinned and recents", () => {
      const { pin, recordVisit, reset } = useSidebarStore.getState();
      pin("a");
      recordVisit("/x");
      reset();
      const s = useSidebarStore.getState();
      expect(s.pinnedMenuIds).toEqual([]);
      expect(s.recentPaths).toEqual([]);
    });
  });
});
