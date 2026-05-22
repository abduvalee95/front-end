'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';

interface UseDebounceSearchOptions {
  /** Debounce delay in ms (default: 300) */
  delay?: number;
  /** Called when debounced value actually changes — useful for resetting page to 1 */
  onDebouncedChange?: () => void;
}

interface UseDebounceSearchReturn {
  /** Immediate input value for controlled input */
  value: string;
  /** Debounced value — use this for API calls and filtering */
  debouncedValue: string;
  /** Set the search input value */
  handleChange: (input: string) => void;
  /** Clear search completely (both immediate and debounced) */
  clearSearch: () => void;
  /** True while waiting for debounce to settle */
  isPending: boolean;
}

export function useDebounceSearch(
  options: UseDebounceSearchOptions = {},
): UseDebounceSearchReturn {
  const { delay = 300, onDebouncedChange } = options;

  const [value, setValueState] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isPending, setIsPending] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(onDebouncedChange);
  useLayoutEffect(() => {
    callbackRef.current = onDebouncedChange;
  });

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleChange = useCallback(
    (input: string) => {
      setValueState(input);

      // Empty string — apply immediately, no waiting
      if (input.trim() === '') {
        cleanup();
        setDebouncedValue('');
        setIsPending(false);
        callbackRef.current?.();
        return;
      }

      setIsPending(true);
      cleanup();

      timerRef.current = setTimeout(() => {
        setDebouncedValue(input);
        setIsPending(false);
        callbackRef.current?.();
      }, delay);
    },
    [delay, cleanup],
  );

  const clearSearch = useCallback(() => {
    cleanup();
    setValueState('');
    setDebouncedValue('');
    setIsPending(false);
    callbackRef.current?.();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  return { value, debouncedValue, handleChange, clearSearch, isPending };
}
