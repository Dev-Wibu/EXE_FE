import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

interface UseDashboardScrollRestorationOptions {
  enabled?: boolean;
  maxEntries?: number;
  scopeKey?: string;
}

const SCROLL_STORAGE_KEY = "dashboard_scroll_positions_v1";

const canUseSessionStorage = () => {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
};

const readStoredPositions = () => {
  if (!canUseSessionStorage()) {
    return new Map<string, number>();
  }

  try {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!raw) {
      return new Map<string, number>();
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return new Map<string, number>();
    }

    const positions = new Map<string, number>();
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        positions.set(key, value);
      }
    }

    return positions;
  } catch {
    return new Map<string, number>();
  }
};

const writeStoredPositions = (positions: Map<string, number>) => {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    const serialized = Object.fromEntries(positions.entries());
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // Ignore storage write failures (private mode/quota) and continue with in-memory cache.
  }
};

const upsertPosition = (
  positions: Map<string, number>,
  key: string,
  value: number,
  maxEntries: number
) => {
  if (positions.has(key)) {
    positions.delete(key);
  }

  positions.set(key, Math.max(0, value));

  while (positions.size > maxEntries) {
    const oldestKey = positions.keys().next().value;
    if (!oldestKey) {
      break;
    }
    positions.delete(oldestKey);
  }
};

export function useDashboardScrollRestoration(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseDashboardScrollRestorationOptions = {}
) {
  const { enabled = true, maxEntries = 100, scopeKey } = options;
  const location = useLocation();
  const navigationType = useNavigationType();
  const positionsRef = useRef<Map<string, number>>(readStoredPositions());
  const previousViewRef = useRef<{ entryKey: string; locationSignature: string } | null>(null);
  const maxEntriesLimit =
    Number.isFinite(maxEntries) && maxEntries > 0 ? Math.floor(maxEntries) : 100;
  const routeKey = `${location.pathname}${location.search}${location.hash}`;
  const historyEntryKey = location.key || routeKey;
  const entryKey = scopeKey ? `${historyEntryKey}::${scopeKey}` : historyEntryKey;
  const locationSignature = `${location.pathname}${location.search}${location.hash}::${
    location.key || "no-key"
  }`;

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || !enabled) {
      return;
    }

    const previousView = previousViewRef.current;
    const isInitialRender = previousView === null;
    const didLocationChange =
      !isInitialRender && previousView.locationSignature !== locationSignature;
    const shouldRestoreFromPop = navigationType === "POP" && didLocationChange;

    if (shouldRestoreFromPop) {
      container.scrollTop = positionsRef.current.get(entryKey) ?? 0;
    } else {
      container.scrollTop = 0;
    }

    previousViewRef.current = {
      entryKey,
      locationSignature,
    };

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const saveCurrentPosition = () => {
      upsertPosition(positionsRef.current, entryKey, container.scrollTop, maxEntriesLimit);
      writeStoredPositions(positionsRef.current);
    };

    const handleScroll = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        saveCurrentPosition();
      }, 120);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      saveCurrentPosition();
    };
  }, [containerRef, enabled, entryKey, locationSignature, maxEntriesLimit, navigationType]);
}
