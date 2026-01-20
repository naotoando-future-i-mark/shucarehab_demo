import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

const getInitialPath = () => {
  const p = window.location.pathname;
  if (!p || p === '/') return '/login';
  return p;
};

export function Router({ children }: { children: ReactNode }) {
  const [currentPath, setCurrentPath] = useState(getInitialPath());

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within Router');
  }
  return context;
}

interface RouteProps {
  path: string;
  children: ReactNode;
}

export function Route({ path, children }: RouteProps) {
  const { currentPath } = useRouter();
  return currentPath === path ? <>{children}</> : null;
}
