import { useCallback, useEffect, useState } from 'react';

export interface Attempt {
  correct: boolean;
  at: number;
}

type Store = { attempts: Record<string, Attempt>; bookmarks: string[] };

const KEY = 'stats1-pyq:v1';
const EVENT = 'stats1-pyq:change';

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { attempts: {}, bookmarks: [], ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return { attempts: {}, bookmarks: [] };
}

function write(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Per-browser progress: which questions were attempted/correct, and bookmarks. */
export function useProgress() {
  const [store, setStore] = useState<Store>(read);

  useEffect(() => {
    const sync = () => setStore(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const record = useCallback((uid: string, correct: boolean) => {
    const s = read();
    s.attempts[uid] = { correct, at: Date.now() };
    write(s);
  }, []);

  const toggleBookmark = useCallback((uid: string) => {
    const s = read();
    s.bookmarks = s.bookmarks.includes(uid) ? s.bookmarks.filter((b) => b !== uid) : [...s.bookmarks, uid];
    write(s);
  }, []);

  const reset = useCallback(() => write({ attempts: {}, bookmarks: [] }), []);

  return { ...store, record, toggleBookmark, reset };
}

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const t = localStorage.getItem('stats1-pyq:theme');
      if (t === 'light' || t === 'dark') return t;
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('stats1-pyq:theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}
