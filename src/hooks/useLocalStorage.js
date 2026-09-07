/**
 * Generic hook for reading/writing a value to localStorage, keeping React state
 * in sync. NOT used for auth session — Supabase handles that itself.
 */
import { useCallback, useState } from "react";

function readFromStorage(key, initialValue) {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) return JSON.parse(stored);
  } catch {
    // corrupted value — fall back to initialValue
  }
  return initialValue;
}

function writeToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Safari private browsing or storage full — fail silently
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValueState] = useState(() => readFromStorage(key, initialValue));

  const setValue = useCallback(
    (newValue) => {
      setValueState((prev) => {
        const resolved =
          typeof newValue === "function" ? newValue(prev) : newValue;
        writeToStorage(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, setValue];
}
