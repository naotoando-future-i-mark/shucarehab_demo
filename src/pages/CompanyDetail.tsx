import { ArrowLeft, Building2, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from '../router/Router';

type Tab = 'data' | 'memo';

const LS_KEY = 'shukarehub_selected_company';

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-5 flex items-center justify-between active:bg-gray-50"
      >
        <span className="text-lg font-semibold text-gray-900">{title}</span>
        {open ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5 text-sm text-gray-700">{children}</div>}
    </div>
  );
}

export default function CompanyDetail() {
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('data');

  const selected = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    } catch {
      return {};
    }
  }, []);

  const name = selected?.name || '企業名（未選択）';
  const industry = selected?.industryLabel || '業界：—';
  const location = selected?.locationLabel || '本社：—';
  const employees = selected?.employeesLabel || '従業員：—';

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white">
        <div className="max-w-md mx-auto px-4 pt-3 pb-3">
          <button
            onClick={() => navigate('/companies')}
            className="p-2 -ml-2 rounded-full active:bg-gray-100"
            aria-label="back"
          >
            <ArrowLeft className="text-gray-700" />
          </button>
        </div>

        {/* タイトル */}
        <div className="max-w-md mx-auto px-4 pb-3">
          <div className="text-2xl font-bold text-gray-900">{name}</div>

          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-gray-500" />
              <span>{industry}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-500" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-500" />
              <span>{employees}</span>
            </div>
          </div>
        </div>

        {/* タブ */}
        <div className="border-b">
          <div className="max-w-md mx-auto px-4 flex">
            <button
              onClick={() => setTab('data')}
              className={`flex-1 py-3 text-center font-semibold ${
                tab === 'data' ? 'text-orange-500 border-b-2 border-orange-400' : 'text-gray-500'
              }`}
            >
              企業データ
            </button>
            <button
              onClick={() => setTab('memo')}
              className={`flex-1 py-3 text-center font-semibold ${
                tab === 'memo' ? 'text-orange-500 border-b-2 border-orange-400' : 'text-gray-500'
              }`}
            >
              就活メモ
            </button>
          </div>
        </div>
      </div>

      {/* 本文 */}
      <div className="max-w-md mx-auto px-4 py-5 pb-40 space-y-4 bg-white">
        {tab === 'data' ? (
          <>
            <Accordion title="基本データ" defaultOpen>
              <div className="space-y-2">
                <div>・会社概要：MVPでは未入力</div>
                <div>・URL：MVPでは未入力</div>
                <div>・売上：MVPでは未入力</div>
              </div>
            </Accordion>

            <Accordion title="インターン情報">
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="font-semibold">ビジネスパートナー体験</div>
                  <div className="mt-2 text-xs text-red-500 font-semibold inline-flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-red-500 text-white">応募締切日</span>
                    <span>2025年09月15日(月)</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="font-semibold">【3日間】新規ソリューション事業創出</div>
                  <div className="mt-2 text-xs text-red-500 font-semibold inline-flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-red-500 text-white">応募締切日</span>
                    <span>2026年02月28日(土)</span>
                  </div>
                </div>
              </div>
            </Accordion>

            <Accordion title="求人情報">
              求人情報がありません。
            </Accordion>

            <Accordion title="選考フロー">MVPでは未入力</Accordion>

            <Accordion title="日程">MVPでは未入力</Accordion>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sky-500 border border-sky-200 px-3 py-1 rounded-lg">基本情報</span>
              <button className="text-sm text-gray-600" onClick={() => alert('MVP：編集は後でOK')}>
                ✎ 基本情報を編集する
              </button>
            </div>

            <div className="border-t" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sky-500 border border-sky-200 px-3 py-1 rounded-lg">企業研究</span>
              <button className="text-sm text-gray-600" onClick={() => alert('MVP：追加は後でOK')}>
                ＋ 企業研究を追加する
              </button>
            </div>

            <div className="border-t" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sky-500 border border-sky-200 px-3 py-1 rounded-lg">面接対策</span>
              <button className="text-sm text-gray-600" onClick={() => alert('MVP：追加は後でOK')}>
                ＋ 面接対策を追加する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
