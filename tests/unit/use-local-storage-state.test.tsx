// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLocalStorageState, useIsHydrated } from '@/hooks/useLocalStorageState';

/**
 * localStorage-backed state.
 *
 * This replaced a read-in-an-effect + setState pair on the schedule page, so
 * what matters is that the persistence behaviour survived the swap: values are
 * read back, writes reach storage, and a corrupt entry does not take the page
 * down.
 */
const KEY = 'test_key';
const EMPTY: string[] = [];

beforeEach(() => {
  localStorage.clear();
});

describe('useLocalStorageState', () => {
  it('returns the fallback when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));
    expect(result.current[0]).toEqual([]);
  });

  it('reads an existing value on first render, with no effect pass needed', () => {
    localStorage.setItem(KEY, JSON.stringify(['bir', 'ikki']));

    const { result } = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));

    // The old effect-based version rendered [] first and filled in afterwards.
    expect(result.current[0]).toEqual(['bir', 'ikki']);
  });

  it('persists a written value', () => {
    const { result } = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));

    act(() => result.current[1](['yangi']));

    expect(result.current[0]).toEqual(['yangi']);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(['yangi']);
  });

  it('supports a functional update', () => {
    localStorage.setItem(KEY, JSON.stringify(['bir']));
    const { result } = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));

    act(() => result.current[1]((previous) => [...previous, 'ikki']));

    expect(result.current[0]).toEqual(['bir', 'ikki']);
  });

  it('survives a reload', () => {
    const first = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));
    act(() => first.result.current[1](['saqlangan']));
    first.unmount();

    const second = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));
    expect(second.result.current[0]).toEqual(['saqlangan']);
  });

  it('falls back instead of throwing on a corrupt entry', () => {
    localStorage.setItem(KEY, '{not json');

    const { result } = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));
    expect(result.current[0]).toEqual([]);
  });

  it('keeps a stable value identity while the raw string is unchanged', () => {
    localStorage.setItem(KEY, JSON.stringify(['bir']));
    const { result, rerender } = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));

    const before = result.current[0];
    rerender();

    // Re-parsing on every render would hand back a new array each time and
    // retrigger anything memoised on it.
    expect(result.current[0]).toBe(before);
  });

  it('picks up a write from another tab', () => {
    const { result } = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));

    act(() => {
      localStorage.setItem(KEY, JSON.stringify(['boshqa tabdan']));
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    });

    expect(result.current[0]).toEqual(['boshqa tabdan']);
  });

  it('keeps two hooks on the same key in step', () => {
    const a = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));
    const b = renderHook(() => useLocalStorageState<string[]>(KEY, EMPTY));

    act(() => a.result.current[1](['a yozdi']));

    expect(b.result.current[0]).toEqual(['a yozdi']);
  });
});

describe('useIsHydrated', () => {
  it('is true once mounted on the client', () => {
    const { result } = renderHook(() => useIsHydrated());
    expect(result.current).toBe(true);
  });
});
