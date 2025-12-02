import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('dark-mode');
    if (stored != null) return stored === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('dark-mode', String(enabled));
  }, [enabled]);

  return [enabled, setEnabled] as const;
}
