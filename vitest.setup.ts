import "@testing-library/jest-dom/vitest";

// Node.js 25 introduced a native `localStorage` global that requires
// `--localstorage-file` to initialise. In jsdom test environments we replace
// it with a simple in-memory Map-backed implementation so tests that exercise
// localStorage (e.g. useQuestionProgress) work without extra CLI flags.
if (typeof window !== "undefined") {
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  Object.defineProperty(window, "localStorage", {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
}
