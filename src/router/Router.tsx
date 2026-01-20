import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

function normalizePath(path: string) {
  if (!path) return '/';
  // query/hashを除外
  const p = path.split('?')[0].split('#')[0];
  // 末尾スラッシュ削除（/memo/ → /memo）
  const cleaned = p.length > 1 ? p.replace(/\/+$/, '') : p;
  return cleaned || '/';
}

function getInitialPath() {
  const p = normalizePath(window.location.pathname);
  if (!p || p === '/') return '/login';
  return p;
}

export function Router({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(() => getInitialPath());

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    const next = normalizePath(path);
    if (next === currentPath) return;
    window.history.pushState({}, '', next);
    setCurrentPath(next);
  }, [currentPath]);

  const value = useMemo(() => ({ currentPath, navigate }), [currentPath, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within Router');
  return ctx;
}

interface RouteProps {
  path: string;
  children: ReactNode;
}

export function Route({ path, children }: RouteProps) {
  const { currentPath } = useRouter();
  const a = normalizePath(currentPath);
  const b = normalizePath(path);
  return a === b ? <>{children}</> : null;
}
