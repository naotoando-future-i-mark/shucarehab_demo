import { ArrowLeft, Search, Briefcase, MapPin, Users, AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from '../router/Router';

type TabType = 'search' | 'popular' | 'industry';

const dummyCompanies = [
  {
    id: 1,
    name: 'キャノンマーケティングジャパン株式会社',
    tag: 'インターン',
    deadline: '2025年09月15日(月)',
    deadlineClosed: true,
    industry: '業種　IT・通信',
    location: '本社住所　東京都港区',
    employees: '従業員規模　50人-100人以下',
  },
  {
    id: 2,
    name: '株式会社メイテックフィルダーズ',
    tag: 'インターン',
    deadline: '2025年09月28日(日)',
    deadlineClosed: true,
    industry: '業種　冠婚葬祭',
    location: '本社住所　東京都台東区',
    employees: '従業員規模　301人以上',
  },
  {
    id: 3,
    name: '伊藤忠商事株式会社',
    tag: 'インターン',
    deadline: '2025年09月27日(土)',
    deadlineClosed: true,
    industry: '業種　商社',
    location: '本社住所　東京都港区北青山2-5-1',
    employees: '従業員規模　301人以上',
  },
  {
    id: 4,
    name: 'ソニーグローバルソリューションズ株式会社',
    tag: 'インターン',
    deadline: '2025年09月30日(火)',
    deadlineClosed: true,
    industry: '業種　精密・医療機器',
    location: '本社住所　東京都港区',
    employees: '従業員規模　301人以上',
  },
];

const industries = [
  'IT・インターネット',
  '商社（総合）',
  '電機・精密機器',
  '金融',
  'コンサルティング',
  '広告・マーケティング',
  'メーカー',
  '人材・教育',
];

function CompanyCard({
  c,
  onClick,
}: {
  c: (typeof dummyCompanies)[number];
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <div className="py-5 border-b">
        <div className="text-lg font-semibold text-gray-900">{c.name}</div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full border border-red-300 text-red-500 text-xs font-semibold">
            {c.tag}
          </span>

          <div className="flex items-center gap-1 text-red-400 text-xs font-semibold">
            <AlertTriangle size={14} />
            <span>応募締切日：{c.deadline}</span>
            {c.deadlineClosed && <span className="ml-1">締切済み</span>}
          </div>
        </div>

        <div className="mt-3 space-y-1 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-gray-500" />
            <span>{c.industry}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-500" />
            <span>{c.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span>{c.employees}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Companies() {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState('');

  // MVP：完全一致（trimのみ）
  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return dummyCompanies;
    return dummyCompanies.filter((c) => c.name === q);
  }, [searchQuery]);

  return (
    <div className="pb-20 bg-white min-h-screen">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white">
        <div className="max-w-md mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/calendar')}
              className="p-2 -ml-2 rounded-full active:bg-gray-100"
              aria-label="back"
            >
              <ArrowLeft className="text-gray-600" size={22} />
            </button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="検索ワードを入力"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none"
              />
            </div>

            <button
              onClick={() => navigate('/companies/detail-search')}
              className="text-sm font-semibold text-orange-500"
            >
              詳細検索
            </button>
          </div>

          {/* タブ（下線タイプ） */}
          <div className="mt-4 flex gap-6 text-sm">
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-2 ${
                activeTab === 'search'
                  ? 'text-gray-900 font-semibold border-b-2 border-orange-400'
                  : 'text-gray-500'
              }`}
            >
              検索
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`pb-2 ${
                activeTab === 'popular'
                  ? 'text-gray-900 font-semibold border-b-2 border-orange-400'
                  : 'text-gray-500'
              }`}
            >
              人気Top100
            </button>
            <button
              onClick={() => setActiveTab('industry')}
              className={`pb-2 ${
                activeTab === 'industry'
                  ? 'text-gray-900 font-semibold border-b-2 border-orange-400'
                  : 'text-gray-500'
              }`}
            >
              業種別
            </button>
          </div>
        </div>

        <div className="border-b" />
      </div>

      {/* 本文 */}
      <div className="max-w-md mx-auto px-4">
        {activeTab === 'industry' ? (
          <div className="py-4 grid grid-cols-2 gap-3">
            {industries.map((industry) => (
              <button
                key={industry}
                onClick={() => alert(`MVP：業種「${industry}」で絞り込みは後でOK`)}
                className="bg-white p-4 rounded-xl border border-gray-200 text-left active:bg-gray-50"
              >
                <p className="font-semibold text-gray-900">{industry}</p>
                <p className="text-xs text-gray-500 mt-1">タップして絞り込み</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-2">
            {activeTab === 'popular' && (
              <div className="text-xs text-gray-500 px-1 py-3">
                ※MVP：ランキング表示はダミー（後でTop100に差し替え）
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-gray-900 font-semibold">該当する企業がありません</div>
                <div className="text-sm text-gray-500 mt-2">未登録企業の通知登録へ誘導（次の実装）</div>
              </div>
            ) : (
              filtered.map((c) => (
                <CompanyCard
                  key={c.id}
                  c={c}
                  onClick={() => {
                    localStorage.setItem(
                      'shukarehub_selected_company',
                      JSON.stringify({
                        name: c.name,
                        industryLabel: c.industry,
                        locationLabel: c.location,
                        employeesLabel: c.employees,
                      })
                    );
                    navigate('/companies/detail');
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
