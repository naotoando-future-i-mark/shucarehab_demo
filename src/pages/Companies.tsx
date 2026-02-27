import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowLeft, Calendar, MapPin, Clock, Briefcase, Building2, Users, AlertTriangle } from 'lucide-react';
import { useRouter } from '../router/Router';
import { supabase } from '../lib/supabase';

type Company = {
  id: string;
  name: string;
  tag: string;
  deadline: string;
  deadlineClosed: boolean;
  industry: string;
  location: string;
  employees: string;
  isPremium: boolean;
  premiumImage?: string;
  isUrgent?: boolean;
  eventTitle?: string;
  eventPeriod?: string;
  eventArea?: string;
  eventDuration?: string;
  position?: string;
  tags?: string[];
};

// 検索フィルターオプション
const industryOptions = ['IT・通信', 'IT・インターネット', 'ソフトウェア', '商社', '金融', 'メーカー', 'コンサルティング', '広告・マーケティング', '人材・教育', '精密・医療機器', '冠婚葬祭'];
const employeeOptions = ['50人-100人以下', '101人-300人', '301人以上'];
const searchTargetOptions = ['企業', '求人', 'インターン'];

export default function Companies() {
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailSearchOpen, setIsDetailSearchOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchTarget, setSearchTarget] = useState('企業');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('master_companies')
        .select('*')
        .order('is_premium', { ascending: false });

      if (error) throw error;

      const mappedCompanies: Company[] = (data ?? []).map(c => ({
        id: c.id,
        name: c.name,
        tag: c.tag || 'インターン',
        deadline: c.deadline || '',
        deadlineClosed: c.deadline_closed || false,
        industry: c.industry || '',
        location: c.location || '',
        employees: c.employees || '',
        isPremium: c.is_premium || false,
        premiumImage: c.premium_image,
        isUrgent: c.is_urgent,
        eventTitle: c.event_title,
        eventPeriod: c.event_period,
        eventArea: c.event_area,
        eventDuration: c.event_duration,
        position: c.position,
        tags: c.tags,
      }));
      setCompanies(mappedCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const sortedCompanies = useMemo(() => {
    let filtered = [...companies];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    if (selectedIndustry) {
      filtered = filtered.filter((c) => c.industry === selectedIndustry);
    }

    if (selectedEmployees) {
      filtered = filtered.filter((c) => c.employees === selectedEmployees);
    }

    if (searchTarget === 'インターン') {
      filtered = filtered.filter((c) => c.tag === 'インターン');
    } else if (searchTarget === '求人') {
      filtered = filtered.filter((c) => c.tag === '本選考');
    }

    filtered.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return 0;
    });

    return filtered;
  }, [companies, searchQuery, selectedIndustry, selectedEmployees, searchTarget]);

  const handleCompanyClick = (company: Company) => {
    localStorage.setItem('shukarehub_selected_company', JSON.stringify(company));
    navigate('/companies/detail');
  };

  const clearFilters = () => {
    setSearchTarget('企業');
    setSelectedIndustry('');
    setSelectedEmployees('');
    setSearchQuery('');
  };

  // 詳細検索画面
  if (isDetailSearchOpen) {
    return (
      <div className="min-h-screen bg-white pb-20 pt-14">
        <div className="max-w-md mx-auto">
          {/* ヘッダー */}
          <div className="sticky top-14 bg-white z-10 px-4 py-3 flex items-center gap-3 border-b">
            <button onClick={() => setIsDetailSearchOpen(false)}>
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="検索ワードを入力"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <button 
              onClick={() => setIsDetailSearchOpen(false)}
              className="text-orange-500 font-medium"
            >
              検索
            </button>
          </div>

          {/* 条件クリア */}
          <div className="px-4 py-3 text-center">
            <button onClick={clearFilters} className="text-orange-500">
              条件をクリア
            </button>
          </div>

          {/* 検索対象 */}
          <div className="px-4 py-3">
            <p className="text-gray-500 text-sm mb-3">- 検索対象 -</p>
            <div className="flex gap-3">
              {searchTargetOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSearchTarget(option)}
                  className={`flex-1 py-2 rounded-full border-2 font-medium transition-colors ${
                    searchTarget === option
                      ? 'border-orange-500 text-orange-500 bg-orange-50'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 基本情報から検索 */}
          <div className="px-4 py-3">
            <p className="text-gray-500 text-sm mb-3">- 基本情報から検索 -</p>
            
            <div className="space-y-4">
              {/* 卒業年度 */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">卒業年度</span>
                <span className="text-gray-400">タップして選択</span>
              </div>
              
              {/* 業種 */}
              <div className="py-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">業種</span>
                  <span className="text-gray-400">{selectedIndustry || 'タップして選択'}</span>
                </div>
                {selectedIndustry && (
                  <button 
                    onClick={() => setSelectedIndustry('')}
                    className="text-orange-500 text-sm"
                  >
                    クリア
                  </button>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {industryOptions.slice(0, 5).map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelectedIndustry(option === selectedIndustry ? '' : option)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedIndustry === option
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 従業員規模 */}
              <div className="py-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">従業員規模</span>
                  <span className="text-gray-400">{selectedEmployees || 'タップして選択'}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {employeeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelectedEmployees(option === selectedEmployees ? '' : option)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedEmployees === option
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* 売上規模 */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">売上規模</span>
                <span className="text-gray-400">タップして選択</span>
              </div>

              {/* 資本金規模 */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">資本金規模</span>
                <span className="text-gray-400">タップして選択</span>
              </div>

              {/* 株式公開 */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">株式公開</span>
                <span className="text-gray-400">タップして選択</span>
              </div>
            </div>
          </div>

          {/* こだわり条件から検索 */}
          <div className="px-4 py-3">
            <p className="text-gray-500 text-sm mb-3">- こだわり条件から検索 -</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">福利厚生</span>
                <span className="text-gray-400">タップして選択</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 通常の企業一覧画面
  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-14">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="sticky top-14 bg-white z-10 px-4 py-3 flex items-center gap-3 border-b">
          <button onClick={() => navigate('/calendar')}>
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="検索ワードを入力"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setIsDetailSearchOpen(true)}
            className="text-orange-500 font-medium whitespace-nowrap"
          >
            詳細検索
          </button>
        </div>

        {/* タブ */}
        <div className="px-4 py-2 bg-white border-b">
          <button className="text-gray-900 font-medium border-b-2 border-gray-900 pb-2">
            すべて
          </button>
        </div>

        {/* 企業リスト */}
        <div className="divide-y divide-gray-100">
          {loadError ? (
            <div className="py-12 text-center bg-white">
              <div className="text-gray-900 font-semibold">企業データの取得に失敗しました</div>
              <div className="text-sm text-gray-500 mt-2">しばらく時間をおいて再度お試しください</div>
            </div>
          ) : !loading && companies.length === 0 && !searchQuery && !selectedIndustry && !selectedEmployees ? (
            <div className="py-12 text-center bg-white">
              <div className="text-gray-900 font-semibold">企業が登録されていません</div>
            </div>
          ) : sortedCompanies.length === 0 ? (
            <div className="py-12 text-center bg-white">
              <div className="text-gray-900 font-semibold">該当する企業がありません</div>
              <div className="text-sm text-gray-500 mt-2">検索条件を変更してください</div>
            </div>
          ) : (
            sortedCompanies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleCompanyClick(company)}
                className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {company.isPremium ? (
                  /* 有料プラン企業カード */
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded border border-orange-200">
                        {company.tag}
                      </span>
                      <span className="font-medium text-gray-900 flex-1">{company.name}</span>
                      <span className="text-pink-500 text-sm font-medium">★イチオシ！</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">応募締切日</span>
                      <span className="text-gray-600 text-sm">{company.deadline}</span>
                      {company.isUrgent && (
                        <span className="text-red-500 text-sm flex items-center gap-1">
                          <Clock size={14} />
                          もうすぐ締切
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Briefcase size={14} />
                        <span>募集</span>
                        <span className="ml-1">{company.position || '総合職'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 size={14} />
                        <span>業界</span>
                        <span className="ml-1">{company.industry}</span>
                      </div>
                    </div>
                    {company.premiumImage && (
                      <div className="rounded-lg overflow-hidden mb-3">
                        <img src={company.premiumImage} alt={company.name} className="w-full h-40 object-cover" />
                      </div>
                    )}
                    {company.eventTitle && (
                      <h3 className="text-orange-500 font-medium mb-2">{company.eventTitle}</h3>
                    )}
                    {company.tags && (
                      <div className="flex gap-2 mb-2">
                        {company.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 text-xs rounded border ${
                              tag === '上場企業' || tag === 'ベンチャー'
                                ? 'bg-orange-50 text-orange-600 border-orange-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                      {company.eventPeriod && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>開催時期</span>
                          <span className="ml-1">{company.eventPeriod}</span>
                        </div>
                      )}
                      {company.eventArea && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>開催エリア</span>
                          <span className="ml-1">{company.eventArea}</span>
                        </div>
                      )}
                      {company.eventDuration && (
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>実施期間</span>
                          <span className="ml-1">{company.eventDuration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 無料枠企業カード */
                  <div className="py-5 px-4">
                    <div className="text-lg font-semibold text-gray-900">{company.name}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full border border-orange-300 text-orange-500 text-xs font-semibold">
                        {company.tag}
                      </span>
                      <div className="flex items-center gap-1 text-orange-400 text-xs font-semibold">
                        <AlertTriangle size={14} />
                        <span>応募締切日：{company.deadline}</span>
                        {company.deadlineClosed && <span className="ml-1">締切済み</span>}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-500" />
                        <span>業種　{company.industry}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <span>本社住所　{company.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-500" />
                        <span>従業員規模　{company.employees}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
