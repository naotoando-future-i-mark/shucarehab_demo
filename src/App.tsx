import { useEffect, useState } from 'react';
import { Router, Route, useRouter } from './router/Router';
import BottomTab from './components/BottomTab';
import Header from './components/Header';
import { ToastContainer, useToasts } from './components/Toast';

import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import ProfileSetup from './pages/ProfileSetup';
import Calendar from './pages/Calendar';
import Companies from './pages/Companies';
import Magazine from './pages/Magazine';
import Create from './pages/Create';
import Notes from './pages/Notes';
import CompanyDetail from './pages/CompanyDetail';
import MyPage from './pages/MyPage';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import { supabase } from './lib/supabase';
import AdminGuard from './components/admin/AdminGuard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminMagazine from './pages/admin/AdminMagazine';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminTags from './pages/admin/AdminTags';
import AdminRoles from './pages/admin/AdminRoles';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentPath, navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session check:', { session: !!session, error, path: currentPath });

        if (!mounted) return;

        setAuthed(!!session);
        setLoading(false);

        const publicPaths = ['/login', '/reset-password', '/update-password'];
        if (!session && !publicPaths.includes(currentPath)) {
          navigate('/login');
        }

        if (session && currentPath === '/login') {
          navigate('/calendar');
        }

        if (session && currentPath !== '/profile-setup') {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profile && profile.profile_completed === false) {
            navigate('/profile-setup');
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (mounted) {
          setLoading(false);
          setAuthed(false);
          const publicPaths = ['/login', '/reset-password', '/update-password'];
          if (!publicPaths.includes(currentPath)) {
            navigate('/login');
          }
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', { event: _event, session: !!session });
      if (!mounted) return;

      setAuthed(!!session);

      const publicPaths = ['/login', '/reset-password', '/update-password'];
      if (!session && !publicPaths.includes(currentPath)) {
        navigate('/login');
      }

      if (session && currentPath === '/login') {
        navigate('/calendar');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
  const { toasts, removeToast } = useToasts();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdminPath = currentPath.startsWith('/admin');

  const hideBottomTab =
    currentPath === '/login' ||
    currentPath === '/reset-password' ||
    currentPath === '/update-password' ||
    currentPath === '/profile-setup' ||
    currentPath === '/magazine/new' ||
    isAdminPath;

  const hideHeader =
    currentPath === '/login' ||
    currentPath === '/reset-password' ||
    currentPath === '/update-password' ||
    currentPath === '/profile-setup' ||
    currentPath === '/calendar' ||
    currentPath === '/notifications' ||
    currentPath === '/notes' ||
    isAdminPath;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ログイン */}
      <Route path="/login">
        <Login />
      </Route>

      {/* パスワードリセット */}
      <Route path="/reset-password">
        <ResetPassword />
      </Route>

      {/* パスワード更新 */}
      <Route path="/update-password">
        <UpdatePassword />
      </Route>

      {/* ログイン後 */}
      <RequireAuth>
        <Route path="/profile-setup">
          <ProfileSetup />
        </Route>

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

        <Route path="/mypage">
          <MyPage />
        </Route>

        <Route path="/settings">
          <Settings />
        </Route>

        <Route path="/notifications">
          <Notifications />
        </Route>

        <Route path="/admin" prefix>
          <AdminGuard>
            <Route path="/admin"><AdminDashboard /></Route>
            <Route path="/admin/companies"><AdminCompanies /></Route>
            <Route path="/admin/magazine"><AdminMagazine /></Route>
            <Route path="/admin/users"><AdminUsers /></Route>
            <Route path="/admin/notifications"><AdminNotifications /></Route>
            <Route path="/admin/tags"><AdminTags /></Route>
            <Route path="/admin/roles"><AdminRoles /></Route>
          </AdminGuard>
        </Route>
      </RequireAuth>

      {/* ログイン後のみ表示 */}
      {authed && !hideHeader && <Header />}
      {authed && !hideBottomTab && <BottomTab />}
      <ToastContainer toasts={toasts} onClose={removeToast} />
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
