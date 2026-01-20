import Memo from './pages/Memo';

import { useEffect } from 'react';
import { Router, Route, useRouter } from './router/Router';
import BottomTab from './components/BottomTab';
import FloatingButton from './components/FloatingButton';
import Header from './components/Header';

import Login from './pages/Login';
import Calendar from './pages/Calendar';
import Companies from './pages/Companies';
import Magazine from './pages/Magazine';
import Create from './pages/Create';
import CompanyNew from './pages/CompanyNew';
import MagazineNew from './pages/MagazineNew';
import CompanyDetailSearch from './pages/CompanyDetailSearch';
import CompanyDetail from './pages/CompanyDetail';

const AUTH_KEY = 'shukarehub_auth';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentPath, navigate } = useRouter();

  useEffect(() => {
    const authed = localStorage.getItem(AUTH_KEY) === '1';

    if (!authed && currentPath !== '/login') {
      navigate('/login');
      return;
    }

    if (authed && currentPath === '/login') {
      navigate('/calendar');
    }
  }, [currentPath, navigate]);

  return <>{children}</>;
}

function AppInner() {
  const { currentPath } = useRouter();
  const authed = localStorage.getItem(AUTH_KEY) === '1';

  const hideBottomTab =
    currentPath === '/login' ||
    currentPath === '/admin/companies/new' ||
    currentPath === '/magazine/new';

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

        <Route path="/companies/detail-search">
          <CompanyDetailSearch />
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

        <Route path="/admin/companies/new">
          <CompanyNew />
        </Route>

        <Route path="/magazine/new">
          <MagazineNew />
        </Route>

        <Route path="/memo">
          <Memo />
        </Route>

      </RequireAuth>

      {/* ログイン後のみ表示 */}
      {authed && !hideBottomTab && <Header />}
      {authed && !hideBottomTab && <BottomTab />}
      {authed && !hideBottomTab && <FloatingButton />}
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
