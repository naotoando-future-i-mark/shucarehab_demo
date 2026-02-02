import { useState, useMemo } from 'react';
import { Search, ArrowLeft, Calendar, MapPin, Clock, Briefcase, Building2, Users, AlertTriangle } from 'lucide-react';
import { useRouter } from '../router/Router';

type Company = {
  id: number;
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

const dummyCompanies: Company[] = [
  // 有料プラン企業（上位表示）
  {
    id: 100,
    name: 'アクティアスジャパン株式会社',
    tag: 'インターン',
    deadline: '2025年01月01日(月)',
    deadlineClosed: false,
    industry: 'ソフトウェア',
    location: '東京都渋谷区',
    employees: '301人以上',
    isPremium: true,
    premiumImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
    isUrgent: true,
    eventTitle: 'マーケティング業界NO.1の売り上げ実績を誇る会社で1Day体験',
    eventPeriod: '6月、7月、8月、9月',
    eventArea: '東京、愛知、滋賀、大阪、他',
    eventDuration: '半日',
    position: '営業職',
    tags: ['27卒', '上場企業'],
  },
  {
    id: 101,
    name: '株式会社グローバルテック',
    tag: 'インターン',
    deadline: '2025年02月15日(土)',
    deadlineClosed: false,
    industry: 'IT・通信',
    location: '東京都港区',
    employees: '301人以上',
    isPremium: true,
    premiumImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
    isUrgent: false,
    eventTitle: '最先端AI技術を体験できる2Daysインターン',
    eventPeriod: '7月、8月',
    eventArea: '東京、大阪',
    eventDuration: '2日間',
    position: 'エンジニア職',
    tags: ['27卒', 'ベンチャー'],
  },
  // 無料枠企業
  {
    id: 1,
    name: 'キャノンマーケティングジャパン株式会社',
    tag: 'インターン',
    deadline: '2025年09月15日(月)',
    deadlineClosed: true,
    industry: 'IT・通信',
    location: '東京都港区',
    employees: '50人-100人以下',
    isPremium: false,
  },
  {
    id: 2,
    name: '株式会社メイテックフィルダーズ',
    tag: 'インターン',
    deadline: '2025年09月28日(日)',
    deadlineClosed: true,
    industry: '冠婚葬祭',
    location: '東京都台東区',
    employees: '301人以上',
    isPremium: false,
  },
  {
    id: 3,
    name: '伊藤忠商事株式会社',
    tag: 'インターン',
    deadline: '2025年09月27日(土)',
    deadlineClosed: true,
    industry: '商社',
    location: '東京都港区北青山2-5-1',
    employees: '301人以上',
    isPremium: false,
  },
  {
    id: 4,
    name: 'ソニーグローバルソリューションズ株式会社',
    tag: 'インターン',
    deadline: '2025年09月30日(火)',
    deadlineClosed: true,
    industry: '精密・医療機器',
    location: '東京都港区',
    employees: '301人以上',
    isPremium: false,
  },
  {
    id: 5,
    name: '楽天グループ株式会社',
    tag: '本選考',
    deadline: '2025年10月15日(水)',
    deadlineClosed: false,
    industry: 'IT・インターネット',
    location: '東京都世田谷区',
    employees: '301人以上',
    isPremium: false,
  },
  {
    id: 6,
    name: '株式会社サイバーエージェント',
    tag: 'インターン',
    deadline: '2025年10月20日(月)',
    deadlineClosed: false,
    industry: '広告・マーケティング',
    location: '東京都渋谷区',
    employees: '301人以上',
    isPremium: false,
  },
  {
    id: 7,
    name: '三菱UFJ銀行',
    tag: '本選考',
    deadline: '2025年11月01日(土)',
    deadlineClosed: false,
    industry: '金融',
    location: '東京都千代田区',
    employees: '301人以上',
    isPremium: false,
  },
  {
    id: 8,
    name: 'トヨタ自動車株式会社',
    tag: 'インターン',
    deadline: '2025年10月31日(金)',
    deadlineClosed: false,
    industry: 'メーカー',
    location: '愛知県豊田市',
    employees: '301人以上',
    isPremium: false,
  },
  {
    id: 9,
    name: '株式会社リクルート',
    tag: '本選考',
    deadline: '2025年11月15日(土)',
    deadlineClosed: false,
    industry: '人材・教育',
    location: '東京都千代田区',
    employees: '301人以上',
    isPremium: false,
  },
  {
    id: 10,
    name: 'アクセンチュア株式会社',
    tag: 'インターン',
    deadline: '2025年10月25日(土)',
    deadlineClosed: false,
    industry: 'コンサルティング',
    location: '東京都港区',
    employees: '301人以上',
    isPremium: false,
  },
];

// 検索フィルターオプション
const industryOptions = ['IT・通信', 'IT・インターネット', 'ソフトウェア', '商社', '金融', 'メーカー', 'コンサルティング', '広告・マーケティング', '人材・教育', '精密・医療機器', '冠婚葬祭'];
const employeeOptions = ['50人-100人以下', '101人-300人', '301人以上'];
const searchTargetOptions = ['企業', '求人', 'インターン'];

export default function Companies() {
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailSearchOpen, setIsDetailSearchOpen] = useState(false);
  
  // 詳細検索フィルター
  const [searchTarget, setSearchTarget] = useState('企業');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState('');

  const sortedCompanies = useMemo(() => {
    let filtered = [...dummyCompanies];
    
    // キーワード検索
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }
    
    // 業種フィルター
    if (selectedIndustry) {
      filtered = filtered.filter((c) => c.industry === selectedIndustry);
    }
    
    // 従業員規模フィルター
    if (selectedEmployees) {
      filtered = filtered.filter((c) => c.employees === selectedEmployees);
    }
    
    // 検索対象フィルター
    if (searchTarget === 'インターン') {
      filtered = filtered.filter((c) => c.tag === 'インターン');
    } else if (searchTarget === '求人') {
      filtered = filtered.filter((c) => c.tag === '本選考');
    }
    
    // 有料企業を上位に
    filtered.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return 0;
    });
    
    return filtered;
  }, [searchQuery, selectedIndustry, selectedEmployees, searchTarget]);

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
          {sortedCompanies.length === 0 ? (
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
