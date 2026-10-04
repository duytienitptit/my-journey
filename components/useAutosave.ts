"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "saving" | "error";

/** Serial saves with a durable local draft. A failed request never clears the draft. */
export function useAutosave<T>(key: string, initial: T, onSave: (value: T) => Promise<void>) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(initial);
  const saved = useRef(JSON.stringify(initial));
  const inFlight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);
  const mounted = useRef(true);
  useEffect(() => { saveRef.current = onSave; }, [onSave]);

  const flush = useCallback(async function saveLatest(): Promise<boolean> {
    if (timer.current) clearTimeout(timer.current);
    if (inFlight.current) {
      const ok = await inFlight.current;
      return ok ? saveLatest() : false;
    }
    const snapshot = latest.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === saved.current) {
      try {
        if (localStorage.getItem(key) === serialized) localStorage.removeItem(key);
      } catch { /* The server already has this value. */ }
      if (mounted.current) { setStatus("saved"); setError(null); }
      return true;
    }
    setStatus("saving");
    setError(null);
    const request = (async () => {
      try {
        await saveRef.current(snapshot);
        saved.current = serialized;
        if (JSON.stringify(latest.current) === serialized) {
          try {
            if (localStorage.getItem(key) === serialized) localStorage.removeItem(key);
          } catch { /* Keep the in-memory draft if browser storage is unavailable. */ }
          if (mounted.current) setStatus("saved");
        }
        return true;
      } catch {
        if (mounted.current) {
          setStatus("error");
          setError("Could not save. Your draft is still here — try again.");
        }
        return false;
      }
    })();
    inFlight.current = request;
    const ok = await request;
    inFlight.current = null;
    if (ok && mounted.current && JSON.stringify(latest.current) !== saved.current) return saveLatest();
    return ok;
  }, [key]);

  useEffect(() => {
    mounted.current = true;
    try {
      const draft = localStorage.getItem(key);
      if (draft && draft !== saved.current) {
        const recovered = JSON.parse(draft) as T;
        latest.current = recovered;
        // External local draft is read once on mount, before any user editing.
        setValue(recovered);
        setStatus("error");
        setError("Unsaved draft recovered. Save it when you are ready.");
      }
    } catch { /* A corrupt draft must not prevent editing. */ }
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key]);

  function change(next: T) {
    latest.current = next;
    setValue(next);
    setStatus("saving");
    setError(null);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {
      setError("Local draft storage is unavailable. Keep this page open until Saved appears.");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 800);
  }

  return { value, change, status, error, flush };
}
