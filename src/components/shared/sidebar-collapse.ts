export function getInitialSidebarCollapsed(storageKey: string, legacyStorageKey?: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const saved = window.localStorage.getItem(storageKey);
  if (saved !== null) {
    return saved === "true";
  }

  if (legacyStorageKey) {
    const legacy = window.localStorage.getItem(legacyStorageKey);
    if (legacy !== null) {
      window.localStorage.setItem(storageKey, legacy);
      window.localStorage.removeItem(legacyStorageKey);
      return legacy === "true";
    }
  }

  return false;
}
