import { useEffect, useState } from 'react';
import { Router, Route, useRouter } from './router/Router';
import BottomTab from './components/BottomTab';
import FloatingButton from './components/FloatingButton';
import Header from './components/Header';

import Login from './pages/Login';
import Calendar from './pages/Calendar';
import Companies from './pages/Companies';
import Magazine from './pages/Magazine';
import Create from './pages/Create';
import Notes from './pages/Notes';
import CompanyDetail from './pages/CompanyDetail';
import { supabase } from './lib/supabase';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentPath, navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setLoading(false);

      if (!session && currentPath !== '/login') {
        navigate('/login');
      }

      if (session && currentPath === '/login') {
        navigate('/calendar');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);

      if (!session && currentPath !== '/login') {
        navigate('/login');
      }

      if (session && currentPath === '/login') {
        navigate('/calendar');
      }
    });

    return () => subscription.unsubscribe();
  }, [currentPath, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppInner() {
  const { currentPath } = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hideBottomTab =
    currentPath === '/login' ||
    currentPath === '/magazine/new';

  const hideHeader =
  currentPath === '/login' ||
  currentPath === '/calendar';

  // FloatingButtonは使わない
  const showFloatingButton = false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ログイン */}
      <Route path="/login">
        <Login />
      </Route>

      {/* ログイン後 */}
      <RequireAuth>
        <Route path="/calendar">
          <Calendar />
        </Route>

        <Route path="/companies">
          <Companies />
        </Route>

        <Route path="/companies/detail">
          <CompanyDetail />
        </Route>

        <Route path="/magazine">
          <Magazine />
        </Route>

        <Route path="/create">
          <Create />
        </Route>

        <Route path="/notes">
          <Notes />
        </Route>
      </RequireAuth>

      {/* ログイン後のみ表示 */}
      {authed && !hideHeader && <Header />}
      {authed && !hideBottomTab && <BottomTab />}
      {authed && showFloatingButton && <FloatingButton />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
