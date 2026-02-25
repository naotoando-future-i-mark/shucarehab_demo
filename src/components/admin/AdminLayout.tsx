import { ReactNode } from 'react';
import { useRouter } from '../../router/Router';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  Bell,
  Tag,
  ArrowLeft,
} from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const menuItems: MenuItem[] = [
  { label: 'ダッシュボード', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: '企業管理', path: '/admin/companies', icon: <Building2 size={18} /> },
  { label: 'マガジン管理', path: '/admin/magazine', icon: <BookOpen size={18} /> },
  { label: 'ユーザー管理', path: '/admin/users', icon: <Users size={18} /> },
  { label: 'お知らせ管理', path: '/admin/notifications', icon: <Bell size={18} /> },
  { label: 'タグ管理', path: '/admin/tags', icon: <Tag size={18} /> },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { currentPath, navigate } = useRouter();

  return (
    <div className="flex min-h-screen">
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        style={{ backgroundColor: '#1F2937' }}
      >
        <div className="px-6 py-5 border-b border-gray-700">
          <p className="text-white text-xs text-gray-400 leading-tight">就カレHUB</p>
          <p className="text-white font-bold text-base leading-tight mt-0.5">管理画面</p>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors"
                style={{
                  backgroundColor: isActive ? '#FFA52F' : 'transparent',
                  color: isActive ? '#ffffff' : '#D1D5DB',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="py-4 border-t border-gray-700">
          <button
            onClick={() => navigate('/calendar')}
            className="w-full flex items-center gap-3 px-6 py-3 text-sm text-gray-400 transition-colors"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
            }}
          >
            <ArrowLeft size={18} />
            <span>アプリに戻る</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-100 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
