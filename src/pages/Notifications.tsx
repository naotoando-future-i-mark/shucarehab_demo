import { useState, useEffect } from 'react';
import { Bell, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../router/Router';

interface Notification {
  id: string;
  title: string;
  body: string;
  target_type: string;
  target_graduation_year: number | null;
  is_published: boolean;
  created_at: string;
}

export default function Notifications() {
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (e) {
        console.error('通知の取得に失敗:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate('/calendar')}
            className="p-1.5 -ml-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2 ml-2">
            <Bell size={18} className="text-orange-500" />
            <h1 className="text-lg font-bold text-gray-800">お知らせ</h1>
          </div>
        </div>
      </header>

      <div className="pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-sm">読み込み中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Bell size={40} className="text-gray-300" />
            <p className="text-gray-400 text-sm">お知らせはまだありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                  {expandedId === n.id ? (
                    <ChevronUp size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                </div>
                {expandedId === n.id && (
                  <div className="mt-3 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-3">
                    {n.body}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
