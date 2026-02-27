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
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('graduation_year')
          .eq('user_id', user.id)
          .maybeSingle();

        const graduationYear = profile?.graduation_year ?? null;

        const query = supabase
          .from('notifications')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        const { data: allNotifications, error } = await query;
        if (error) throw error;

        const filtered = (allNotifications || []).filter((n: Notification) => {
          if (n.target_type === 'all') return true;
          if (graduationYear && n.target_graduation_year === graduationYear) return true;
          return false;
        });

        setNotifications(filtered);

        const { data: reads } = await supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('user_id', user.id);

        if (reads) {
          setReadIds(new Set(reads.map((r: { notification_id: string }) => r.notification_id)));
        }
      } catch (e) {
        console.error('通知の取得に失敗:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (!readIds.has(id)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('notification_reads')
          .insert({ notification_id: id, user_id: user.id });

        if (!error) {
          setReadIds(prev => new Set([...prev, id]));
        }
      } catch (e) {
        console.error('既読更新エラー:', e);
      }
    }
  };

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
            {notifications.map((n) => {
              const isRead = readIds.has(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => handleExpand(n.id)}
                  className={`w-full text-left px-4 py-4 transition-colors ${
                    isRead ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                        )}
                        <p className={`font-semibold text-sm ${isRead ? 'text-gray-500' : 'text-gray-800'}`}>
                          {n.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-4">{formatDate(n.created_at)}</p>
                    </div>
                    {expandedId === n.id ? (
                      <ChevronUp size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                  </div>
                  {expandedId === n.id && (
                    <div className="mt-3 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-100 rounded-lg p-3">
                      {n.body}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
