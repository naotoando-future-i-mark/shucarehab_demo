import { ArrowLeft, Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '../router/Router';

type Target = 'company' | 'job' | 'intern';

const filterRows = [
  { section: '基本情報から検索', items: ['卒業年度', '業種', '従業員規模', '売上規模', '資本金規模', '株式公開'] },
  { section: 'こだわり条件から検索', items: ['福利厚生'] },
];

export default function CompanyDetailSearch() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const [target, setTarget] = useState<Target>('company');

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white">
        <div className="max-w-md mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/companies')}
              className="p-2 -ml-2 rounded-full active:bg-gray-100"
              aria-label="back"
            >
              <ArrowLeft className="text-gray-600" size={22} />
            </button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="検索ワードを入力"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none"
              />
            </div>

            <button
              onClick={() => alert('MVP：詳細検索の実検索は後でOK（今は画面だけ）')}
              className="text-sm font-semibold text-orange-500"
            >
              検索
            </button>
          </div>

          <button
            onClick={() => alert('MVP：条件クリアは後でOK')}
            className="w-full text-center text-sm text-orange-500 font-semibold mt-3"
          >
            条件をクリア
          </button>

          {/* 検索対象 */}
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">- 検索対象 -</div>
            <div className="flex gap-2">
              <button
                onClick={() => setTarget('company')}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${
                  target === 'company' ? 'bg-orange-400 text-white border-orange-400' : 'bg-white text-orange-400 border-orange-300'
                }`}
              >
                企業
              </button>
              <button
                onClick={() => setTarget('job')}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${
                  target === 'job' ? 'bg-orange-400 text-white border-orange-400' : 'bg-white text-orange-400 border-orange-300'
                }`}
              >
                求人
              </button>
              <button
                onClick={() => setTarget('intern')}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${
                  target === 'intern' ? 'bg-orange-400 text-white border-orange-400' : 'bg-white text-orange-400 border-orange-300'
                }`}
              >
                インターン
              </button>
            </div>
          </div>
        </div>

        <div className="border-b" />
      </div>

      {/* リスト */}
      <div className="max-w-md mx-auto px-4 py-5">
        {filterRows.map((group) => (
          <div key={group.section} className="mb-6">
            <div className="text-xs text-gray-500 mb-3">- {group.section} -</div>

            <div className="divide-y rounded-xl border border-gray-100 overflow-hidden">
              {group.items.map((label) => (
                <button
                  key={label}
                  onClick={() => alert(`MVP：${label}の選択UIは後でOK`)}
                  className="w-full bg-white px-4 py-4 flex items-center justify-between active:bg-gray-50"
                >
                  <span className="text-sm text-gray-800">{label}</span>
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    タップして選択 <ChevronRight size={18} className="text-gray-400" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
