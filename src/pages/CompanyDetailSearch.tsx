import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '../router/Router';

type SearchTarget = 'company' | 'job' | 'intern';

const companyFilters = {
  basic: [
    { id: 'graduationYear', label: '卒業年度' },
    { id: 'industry', label: '業種' },
    { id: 'employeeSize', label: '従業員規模' },
    { id: 'salesSize', label: '売上規模' },
    { id: 'capitalSize', label: '資本金規模' },
    { id: 'stockListing', label: '株式公開' },
  ],
  particular: [
    { id: 'welfare', label: '福利厚生' },
  ],
};

const jobFilters = {
  basic: [
    { id: 'graduationYear', label: '卒業年度' },
    { id: 'jobType', label: '職種' },
    { id: 'workLocation', label: '勤務地' },
    { id: 'salary', label: '給与（月給）' },
  ],
  particular: [
    { id: 'annualHolidays', label: '年間休日' },
    { id: 'remoteWork', label: 'リモートワーク' },
    { id: 'avgOvertime', label: '平均残業時間' },
  ],
};

const internFilters = {
  basic: [
    { id: 'graduationYear', label: '卒業年度' },
    { id: 'jobType', label: '職種' },
    { id: 'location', label: '開催地' },
    { id: 'reward', label: '報酬' },
  ],
  particular: [],
};

export default function CompanyDetailSearch() {
  const { navigate } = useRouter();
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('company');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const currentFilters = 
    searchTarget === 'company' ? companyFilters :
    searchTarget === 'job' ? jobFilters :
    internFilters;

  const handleFilterClick = (filterLabel: string) => {
    alert(`「${filterLabel}」の選択画面を表示（実装予定）`);
  };

  const handleClearAll = () => {
    setSelectedFilters({});
    setSearchQuery('');
  };

  const handleSearch = () => {
    navigate('/companies');
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto">
      <div className="sticky top-0 bg-white z-10 border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/companies')} className="p-1">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索ワードを入力"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-100 text-sm outline-none"
            />
          </div>
          <button onClick={handleSearch} className="text-orange-500 font-semibold text-sm">
            検索
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <button onClick={handleClearAll} className="text-orange-500 text-sm">
          条件をクリア
        </button>
      </div>

      <div className="px-4 pb-4">
        <p className="text-sm text-gray-600 mb-3">- 検索対象 -</p>
        <div className="flex gap-3">
          <button
            onClick={() => setSearchTarget('company')}
            className={`flex-1 py-2.5 rounded-full border-2 text-sm font-medium transition-colors ${
              searchTarget === 'company'
                ? 'border-orange-500 text-orange-500 bg-orange-50'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            企業
          </button>
          <button
            onClick={() => setSearchTarget('job')}
            className={`flex-1 py-2.5 rounded-full border-2 text-sm font-medium transition-colors ${
              searchTarget === 'job'
                ? 'border-orange-500 text-orange-500 bg-orange-50'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            求人
          </button>
          <button
            onClick={() => setSearchTarget('intern')}
            className={`flex-1 py-2.5 rounded-full border-2 text-sm font-medium transition-colors ${
              searchTarget === 'intern'
                ? 'border-orange-500 text-orange-500 bg-orange-50'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            インターン
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-sm text-gray-600 mb-2">- 基本情報から検索 -</p>
        <div className="divide-y">
          {currentFilters.basic.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.label)}
              className="w-full flex items-center justify-between py-4"
            >
              <span className="text-gray-800">{filter.label}</span>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm">
                  {selectedFilters[filter.id] || 'タップして選択'}
                </span>
                <ChevronRight size={18} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {currentFilters.particular.length > 0 && (
        <div className="px-4 py-4">
          <p className="text-sm text-gray-600 mb-2">- こだわり条件から検索 -</p>
          <div className="divide-y">
            {currentFilters.particular.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.label)}
                className="w-full flex items-center justify-between py-4"
              >
                <span className="text-gray-800">{filter.label}</span>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-sm">
                    {selectedFilters[filter.id] || 'タップして選択'}
                  </span>
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
