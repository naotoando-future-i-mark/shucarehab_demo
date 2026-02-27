import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { supabase } from '../lib/supabase';

const menuItems = [
  { path: '/calendar', icon: '📅', label: 'カレンダー' },
  { path: '/companies', icon: '🏢', label: '企業を探す' },
  { path: '/magazine', icon: '📰', label: '就活マガジン' },
  { path: '/notes', icon: '📝', label: '就活ノート' },
  { path: '/mypage', icon: '👤', label: 'マイページ' },
  { path: '/notifications', icon: '🔔', label: 'お知らせ' },
  { path: '/settings', icon: '⚙️', label: '設定' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { navigate } = useRouter();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('graduation_year')
          .eq('user_id', user.id)
          .maybeSingle();

        const graduationYear = profile?.graduation_year ?? null;

        const { data: allNotifications } = await supabase
          .from('notifications')
          .select('id, target_type, target_graduation_year')
          .eq('is_published', true);

        const filtered = (allNotifications || []).filter((n: { id: string; target_type: string; target_graduation_year: number | null }) => {
          if (n.target_type === 'all') return true;
          if (graduationYear && n.target_graduation_year === graduationYear) return true;
          return false;
        });

        const { data: reads } = await supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('user_id', user.id);

        const readSet = new Set((reads || []).map((r: { notification_id: string }) => r.notification_id));
        const unread = filtered.filter((n: { id: string }) => !readSet.has(n.id)).length;
        setUnreadCount(unread);
      } catch (e) {
        console.error('未読数取得エラー:', e);
      }
    };

    fetchUnread();
  }, []);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 -ml-2 text-gray-600"
          >
            <Menu size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <h1 className="text-lg font-bold">
            就<span className="text-orange-500">カレ</span>HUB
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-end">
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-600">
            <X size={24} />
          </button>
        </div>
        <nav className="py-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="w-full px-4 py-4 flex items-center gap-4 hover:bg-gray-50 text-left"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-gray-800 flex-1">{item.label}</span>
              {item.path === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
