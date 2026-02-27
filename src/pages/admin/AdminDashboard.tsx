import { useState, useEffect } from 'react';
import { Users, UserPlus, BookOpen, Bell } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

type StatCard = {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;
};

type DailyCount = {
  date: string;
  count: number;
};

type GradYearCount = {
  year: string;
  count: number;
};

type Article = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'scheduled';
  likes: number;
  created_at: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatMD = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

function StatCardItem({ card }: { card: StatCard }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: card.color + '1A' }}
      >
        <div style={{ color: card.color }}>{card.icon}</div>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{card.label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">
          {card.value === null ? (
            <span className="text-base text-gray-300">読込中</span>
          ) : (
            card.value.toLocaleString()
          )}
        </p>
      </div>
    </div>
  );
}

function BarChart({ data, maxValue }: { data: DailyCount[]; maxValue: number }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 py-8 text-center">データがありません</p>;

  const showEvery = Math.ceil(data.length / 10);

  return (
    <div className="flex items-end gap-px h-40 w-full">
      {data.map((d, i) => {
        const pct = maxValue > 0 ? (d.count / maxValue) * 100 : 0;
        const showLabel = i % showEvery === 0 || i === data.length - 1;
        return (
          <div key={d.date} className="flex flex-col items-center flex-1 min-w-0 group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10 pointer-events-none">
              {d.count}件
            </div>
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: pct > 0 ? `${Math.max(pct, 4)}%` : '2px',
                backgroundColor: pct > 0 ? '#FFA52F' : '#E5E7EB',
                minHeight: '2px',
              }}
            />
            <span className="text-gray-400 mt-1 w-full text-center overflow-hidden" style={{ fontSize: '9px', lineHeight: 1.2 }}>
              {showLabel ? formatMD(d.date) : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarChart({ data, maxValue }: { data: GradYearCount[]; maxValue: number }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 py-8 text-center">データがありません</p>;

  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = maxValue > 0 ? (d.count / maxValue) * 100 : 0;
        return (
          <div key={d.year} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">{d.year}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
                style={{
                  width: pct > 0 ? `${Math.max(pct, 3)}%` : '3%',
                  backgroundColor: '#FFA52F',
                  minWidth: '20px',
                }}
              >
                <span className="text-white text-xs font-medium leading-none">{d.count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  draft: '下書き',
  published: '公開',
  scheduled: '予約投稿',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
};

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [newUsersThisMonth, setNewUsersThisMonth] = useState<number | null>(null);
  const [publishedArticles, setPublishedArticles] = useState<number | null>(null);
  const [publishedNotifications, setPublishedNotifications] = useState<number | null>(null);

  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [gradYearCounts, setGradYearCounts] = useState<GradYearCount[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: userTotal },
        { count: newUsers },
        { count: pubArticles },
        { count: pubNotifs },
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published'),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true),
      ]);

      setTotalUsers(userTotal ?? 0);
      setNewUsersThisMonth(newUsers ?? 0);
      setPublishedArticles(pubArticles ?? 0);
      setPublishedNotifications(pubNotifs ?? 0);
    };

    const fetchDailyRegistrations = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      since.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', since.toISOString());

      const days: DailyCount[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push({ date: d.toISOString().slice(0, 10), count: 0 });
      }

      (data ?? []).forEach((row) => {
        const dayStr = row.created_at.slice(0, 10);
        const entry = days.find((d) => d.date === dayStr);
        if (entry) entry.count++;
      });

      setDailyCounts(days);
    };

    const fetchGradYear = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('graduation_year');

      const map: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        const key = row.graduation_year != null ? String(row.graduation_year) : '未設定';
        map[key] = (map[key] ?? 0) + 1;
      });

      const sorted = Object.entries(map)
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => {
          if (a.year === '未設定') return 1;
          if (b.year === '未設定') return -1;
          return Number(a.year) - Number(b.year);
        });

      setGradYearCounts(sorted);
    };

    const fetchArticles = async () => {
      const { data } = await supabase
        .from('articles')
        .select('id, title, status, likes, created_at')
        .order('likes', { ascending: false });
      setArticles((data ?? []) as Article[]);
    };

    fetchStats();
    fetchDailyRegistrations();
    fetchGradYear();
    fetchArticles();
  }, []);

  const statCards: StatCard[] = [
    {
      label: 'ユーザー総数',
      value: totalUsers,
      icon: <Users size={22} />,
      color: '#FFA52F',
    },
    {
      label: '今月の新規登録数',
      value: newUsersThisMonth,
      icon: <UserPlus size={22} />,
      color: '#10B981',
    },
    {
      label: '公開記事数',
      value: publishedArticles,
      icon: <BookOpen size={22} />,
      color: '#3B82F6',
    },
    {
      label: '公開中お知らせ数',
      value: publishedNotifications,
      icon: <Bell size={22} />,
      color: '#F59E0B',
    },
  ];

  const dailyMax = Math.max(...dailyCounts.map((d) => d.count), 1);
  const gradMax = Math.max(...gradYearCounts.map((d) => d.count), 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">就カレHUBの利用状況</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCardItem key={card.label} card={card} />
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            新規登録数の推移（直近30日）
          </h2>
          <div className="mt-2">
            <BarChart data={dailyCounts} maxValue={dailyMax} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">卒業年度別ユーザー数</h2>
            <HorizontalBarChart data={gradYearCounts} maxValue={gradMax} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <h2 className="text-base font-bold text-gray-800 mb-4">マガジン記事ランキング</h2>
            {articles.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">記事がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">タイトル</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">ステータス</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">いいね</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">作成日</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {articles.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <p className="text-gray-800 font-medium line-clamp-1 max-w-xs text-xs">{a.title}</p>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[a.status] ?? a.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-sm font-semibold text-orange-500">{a.likes ?? 0}</span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap text-xs">
                          {formatDate(a.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
