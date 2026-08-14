'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * State that lives in localStorage.
 *
 * Read through useSyncExternalStore rather than "read in an effect, then
 * setState". That pattern renders once with an empty value, sets state, and
 * renders again — the cascading render React's lint rule warns about — and it
 * needs a separate `hydrated` flag so the UI can avoid flashing empty on the
 * way through. localStorage is an external store; this is the hook for
 * subscribing to one.
 *
 * The snapshot is the RAW STRING, not the parsed value. getSnapshot must be
 * referentially stable between renders or React re-renders forever chasing a
 * value that never settles, and JSON.parse hands back a fresh object every
 * call. Parsing happens in a memo keyed on that string instead.
 *
 * getServerSnapshot returns null so SSR and the hydration render both see the
 * fallback, which is what keeps the markup identical on both sides.
 */

/** Same-tab writes: the 'storage' event only fires in OTHER tabs. */
const LOCAL_WRITE_EVENT = 'local-storage-write';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(LOCAL_WRITE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(LOCAL_WRITE_EVENT, onChange);
  };
}

export function useLocalStorageState<T>(
  key: string,
  fallback: T,
): [T, (update: T | ((previous: T) => T)) => void] {
  const getSnapshot = useCallback((): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      // Private mode, disabled storage, quota — treat as "nothing stored".
      return null;
    }
  }, [key]);

  const getServerSnapshot = useCallback((): string | null => null, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Corrupt or hand-edited entry: fall back rather than crash the page.
      return fallback;
    }
    // `fallback` is intentionally not a dependency — callers pass a literal,
    // and depending on it would re-parse on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const setValue = useCallback(
    (update: T | ((previous: T) => T)) => {
      const next =
        typeof update === 'function' ? (update as (previous: T) => T)(value) : update;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Out of quota: the in-memory render still reflects the attempt on the
        // next event, and losing a todo list is not worth throwing over.
      }
      window.dispatchEvent(new Event(LOCAL_WRITE_EVENT));
    },
    [key, value],
  );

  return [value, setValue];
}

/**
 * False on the server and on the hydration render, true afterwards.
 *
 * Lets a component tell "nothing stored yet" apart from "not read yet" — a
 * skeleton vs an empty state — without keeping a boolean in state and setting
 * it from an effect.
 */
const alwaysTrue = () => true;
const alwaysFalse = () => false;

export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, alwaysTrue, alwaysFalse);
}
