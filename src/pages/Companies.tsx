import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowLeft, Calendar, MapPin, Clock, Briefcase, Building2, Users, AlertTriangle } from 'lucide-react';
import { useRouter } from '../router/Router';
import { supabase } from '../lib/supabase';

type MasterEvent = {
  id: string;
  company_id: string;
  title: string;
  event_type: string;
  deadline: string | null;
  area: string | null;
  duration: string | null;
};

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
  isRecommended?: boolean;
  premiumImage?: string;
  isUrgent?: boolean;
  eventTitle?: string;
  eventPeriod?: string;
  eventArea?: string;
  eventDuration?: string;
  position?: string;
  tags?: string[];
  events?: MasterEvent[];
};

const industryOptions = ['IT・通信', 'IT・インターネット', 'ソフトウェア', '商社', '金融', 'メーカー', 'コンサルティング', '広告・マーケティング', '人材・教育', '精密・医療機器', '冠婚葬祭'];
const employeeOptions = ['50人-100人以下', '101人-300人', '301人以上'];

const TABS = [
  { id: 'all', label: 'すべて' },
  { id: 'deadline', label: '締切近い' },
  { id: 'recommended', label: 'おすすめ' },
  { id: 'top100', label: '人気TOP100' },
  { id: 'venture', label: '優良ベンチャー企業' },
  { id: 'hidden', label: '穴場企業' },
] as const;

type TabId = typeof TABS[number]['id'];

const areaOptions = ['東京', '大阪', '京都', '愛知', '福岡', 'オンライン', 'その他'];
const workLocationOptions = ['東京', '大阪', '京都', '愛知', '福岡', 'その他'];
const annualLeaveOptions = ['指定なし', '120日以上', '125日以上'];

function parseJaDate(str: string): Date | null {
  const jaMatch = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (jaMatch) {
    return new Date(Number(jaMatch[1]), Number(jaMatch[2]) - 1, Number(jaMatch[3]));
  }
  const jaMonthMatch = str.match(/(\d{4})年(\d{1,2})月/);
  if (jaMonthMatch) {
    return new Date(Number(jaMonthMatch[1]), Number(jaMonthMatch[2]) - 1, 1);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function getNearestDeadline(events: MasterEvent[]): Date | null {
  const dates = events
    .map((e) => (e.deadline ? parseJaDate(e.deadline) : null))
    .filter((d): d is Date => d !== null);
  if (dates.length === 0) return null;
  return dates.reduce((min, d) => (d < min ? d : min));
}

export default function Companies() {
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailSearchOpen, setIsDetailSearchOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allEvents, setAllEvents] = useState<MasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const [selectedInternTypes, setSelectedInternTypes] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [jobTypeQuery, setJobTypeQuery] = useState('');
  const [selectedEmployeesList, setSelectedEmployeesList] = useState<string[]>([]);
  const [selectedWorkLocations, setSelectedWorkLocations] = useState<string[]>([]);
  const [selectedAnnualLeave, setSelectedAnnualLeave] = useState('指定なし');
  const [salaryMin, setSalaryMin] = useState(0);

  const [appliedInternTypes, setAppliedInternTypes] = useState<string[]>([]);
  const [appliedAreas, setAppliedAreas] = useState<string[]>([]);
  const [appliedIndustries, setAppliedIndustries] = useState<string[]>([]);
  const [appliedJobTypeQuery, setAppliedJobTypeQuery] = useState('');
  const [appliedEmployeesList, setAppliedEmployeesList] = useState<string[]>([]);
  const [appliedWorkLocations, setAppliedWorkLocations] = useState<string[]>([]);
  const [appliedAnnualLeave, setAppliedAnnualLeave] = useState('指定なし');
  const [appliedSalaryMin, setAppliedSalaryMin] = useState(0);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const [companiesRes, eventsRes] = await Promise.all([
        supabase
          .from('master_companies')
          .select('*')
          .order('is_premium', { ascending: false }),
        supabase
          .from('master_events')
          .select('id, company_id, title, event_type, deadline, area, duration')
          .order('deadline', { ascending: true }),
      ]);

      if (companiesRes.error) throw companiesRes.error;

      const fetchedEvents = (eventsRes.data ?? []) as MasterEvent[];
      setAllEvents(fetchedEvents);

      const mappedCompanies: Company[] = (companiesRes.data ?? []).map(c => ({
        id: c.id,
        name: c.name,
        tag: c.tag || 'インターン',
        deadline: c.deadline || '',
        deadlineClosed: c.deadline_closed || false,
        industry: c.industry || '',
        location: c.location || '',
        employees: c.employees || '',
        isPremium: c.is_premium || false,
        isRecommended: c.is_recommended || false,
        premiumImage: c.premium_image,
        isUrgent: c.is_urgent,
        eventTitle: c.event_title,
        eventPeriod: c.event_period,
        eventArea: c.event_area,
        eventDuration: c.event_duration,
        position: c.position,
        tags: c.tags,
        events: fetchedEvents.filter(e => e.company_id === c.id),
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

    if (appliedIndustries.length > 0) {
      filtered = filtered.filter((c) => appliedIndustries.includes(c.industry));
    }

    if (appliedEmployeesList.length > 0) {
      filtered = filtered.filter((c) => appliedEmployeesList.includes(c.employees));
    }

    if (appliedInternTypes.length > 0) {
      const tagMap: Record<string, string> = { 'インターン': 'インターン', '本選考': '本選考' };
      filtered = filtered.filter((c) => appliedInternTypes.some(t => c.tag === tagMap[t]));
    }

    if (appliedAreas.length > 0) {
      filtered = filtered.filter((c) =>
        appliedAreas.some(a => c.eventArea?.includes(a))
      );
    }

    if (appliedWorkLocations.length > 0) {
      filtered = filtered.filter((c) =>
        appliedWorkLocations.some(l => c.location?.includes(l))
      );
    }

    if (appliedJobTypeQuery.trim()) {
      const q = appliedJobTypeQuery.toLowerCase();
      filtered = filtered.filter((c) => c.position?.toLowerCase().includes(q));
    }

    if (activeTab === 'deadline') {
      const now = new Date();
      const limit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((c) => {
        if (!c.events || c.events.length === 0) return false;
        return c.events.some((ev) => {
          if (!ev.deadline) return false;
          const d = parseJaDate(ev.deadline);
          return d !== null && d >= now && d <= limit;
        });
      });
      filtered.sort((a, b) => {
        const aDate = getNearestDeadline(a.events ?? []);
        const bDate = getNearestDeadline(b.events ?? []);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.getTime() - bDate.getTime();
      });
      return filtered;
    }

    if (activeTab === 'recommended') {
      filtered = filtered.filter((c) => c.isPremium || c.isRecommended);
    }

    if (activeTab === 'venture') {
      filtered = filtered.filter((c) => c.tags?.includes('ベンチャー'));
    }

    if (activeTab === 'hidden') {
      filtered = filtered.filter((c) => c.tags?.includes('穴場'));
    }

    filtered.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return 0;
    });

    return filtered;
  }, [companies, searchQuery, appliedIndustries, appliedEmployeesList, appliedInternTypes, appliedAreas, appliedWorkLocations, appliedJobTypeQuery, activeTab]);

  const handleCompanyClick = (company: Company) => {
    localStorage.setItem('shukarehub_selected_company_id', company.id);
    navigate('/companies/detail');
  };

  const toggleItem = <T extends string>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter(x => x !== item) : [...list, item];

  const clearDetailFilters = () => {
    setSelectedInternTypes([]);
    setSelectedAreas([]);
    setSelectedIndustries([]);
    setJobTypeQuery('');
    setSelectedEmployeesList([]);
    setSelectedWorkLocations([]);
    setSelectedAnnualLeave('指定なし');
    setSalaryMin(0);
  };

  const applyDetailSearch = () => {
    setAppliedInternTypes(selectedInternTypes);
    setAppliedAreas(selectedAreas);
    setAppliedIndustries(selectedIndustries);
    setAppliedJobTypeQuery(jobTypeQuery);
    setAppliedEmployeesList(selectedEmployeesList);
    setAppliedWorkLocations(selectedWorkLocations);
    setAppliedAnnualLeave(selectedAnnualLeave);
    setAppliedSalaryMin(salaryMin);
    setIsDetailSearchOpen(false);
  };

  const openDetailSearch = () => {
    setSelectedInternTypes(appliedInternTypes);
    setSelectedAreas(appliedAreas);
    setSelectedIndustries(appliedIndustries);
    setJobTypeQuery(appliedJobTypeQuery);
    setSelectedEmployeesList(appliedEmployeesList);
    setSelectedWorkLocations(appliedWorkLocations);
    setSelectedAnnualLeave(appliedAnnualLeave);
    setSalaryMin(appliedSalaryMin);
    setIsDetailSearchOpen(true);
  };

  if (isDetailSearchOpen) {
    return (
      <div className="min-h-screen bg-white pb-32 pt-14">
        <div className="max-w-md mx-auto">
          <div className="sticky top-14 bg-white z-10 px-4 py-3 flex items-center gap-3 border-b shadow-sm">
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
          </div>

          <div className="px-4 py-6 space-y-8">
            {/* カテゴリーで検索 */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">カテゴリーで検索</p>

              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">インターン / 本選考</p>
                <div className="flex gap-2">
                  {['インターン', '本選考'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedInternTypes(toggleItem(selectedInternTypes, opt))}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
                        selectedInternTypes.includes(opt)
                          ? 'border-orange-500 text-orange-500 bg-orange-50'
                          : 'border-gray-200 text-gray-500 bg-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">開催地</p>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedAreas(toggleItem(selectedAreas, opt))}
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                        selectedAreas.includes(opt)
                          ? 'border-orange-500 text-orange-500 bg-orange-50'
                          : 'border-gray-200 text-gray-500 bg-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* 基本情報から検索 */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">基本情報から検索</p>

              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">業種</p>
                <div className="flex flex-wrap gap-2">
                  {industryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedIndustries(toggleItem(selectedIndustries, opt))}
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                        selectedIndustries.includes(opt)
                          ? 'border-orange-500 text-orange-500 bg-orange-50'
                          : 'border-gray-200 text-gray-500 bg-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">職種</p>
                <input
                  type="text"
                  value={jobTypeQuery}
                  onChange={(e) => setJobTypeQuery(e.target.value)}
                  placeholder="例：エンジニア、営業"
                  className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">従業員数</p>
                <div className="flex flex-wrap gap-2">
                  {employeeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedEmployeesList(toggleItem(selectedEmployeesList, opt))}
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                        selectedEmployeesList.includes(opt)
                          ? 'border-orange-500 text-orange-500 bg-orange-50'
                          : 'border-gray-200 text-gray-500 bg-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">勤務地</p>
                <div className="flex flex-wrap gap-2">
                  {workLocationOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedWorkLocations(toggleItem(selectedWorkLocations, opt))}
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                        selectedWorkLocations.includes(opt)
                          ? 'border-orange-500 text-orange-500 bg-orange-50'
                          : 'border-gray-200 text-gray-500 bg-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* こだわり検索 */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">こだわり検索</p>

              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">年間休日</p>
                <div className="flex gap-2">
                  {annualLeaveOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedAnnualLeave(opt)}
                      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                        selectedAnnualLeave === opt
                          ? 'border-orange-500 text-orange-500 bg-orange-50'
                          : 'border-gray-200 text-gray-500 bg-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">給与（月給）</p>
                <p className="text-xs text-gray-400 mb-3">
                  {salaryMin === 0 ? '指定なし' : `${salaryMin}万円以上`}
                </p>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0万</span>
                  <span>50万</span>
                </div>
              </div>
            </section>
          </div>

          {/* 固定フッター */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between max-w-md mx-auto z-20">
            <button
              onClick={clearDetailFilters}
              className="text-gray-500 text-sm font-medium"
            >
              全てクリア
            </button>
            <button
              onClick={applyDetailSearch}
              className="bg-orange-500 text-white rounded-full px-8 py-2.5 text-sm font-semibold"
            >
              検索
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-14">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="sticky top-14 bg-white z-10 border-b shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3">
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
              onClick={openDetailSearch}
              className="text-orange-500 font-medium whitespace-nowrap"
            >
              詳細検索
            </button>
          </div>

          {/* タブバー */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-white border-b scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center"
              >
                {activeTab === tab.id ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mx-auto mb-1" />
                ) : (
                  <span className="w-1.5 h-1.5 mb-1" />
                )}
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 企業リスト */}
        <div className="divide-y divide-gray-100">
          {loadError ? (
            <div className="py-12 text-center bg-white">
              <div className="text-gray-900 font-semibold">企業データの取得に失敗しました</div>
              <div className="text-sm text-gray-500 mt-2">しばらく時間をおいて再度お試しください</div>
            </div>
          ) : !loading && companies.length === 0 ? (
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
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded border border-orange-200">
                        {company.tag}
                      </span>
                      <span className="font-medium text-gray-900 flex-1">{company.name}</span>
                      <span className="text-pink-500 text-sm font-medium">★イチオシ！</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">応募締切日</span>
                      <span className="text-gray-600 text-sm">
                        {company.events && company.events.length > 0
                          ? company.events[0].deadline ?? company.deadline
                          : company.deadline}
                      </span>
                      {company.isUrgent && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          🔥 もうすぐ締切
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
                    {company.events && company.events.length > 0 && (
                      <h3 className="text-orange-500 font-medium mb-2">{company.events[0].title}</h3>
                    )}
                    {company.tags && (
                      <div className="flex gap-2 mb-2 flex-wrap">
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
                      {company.events && company.events.length > 0 && company.events[0].area && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>開催エリア</span>
                          <span className="ml-1">{company.events[0].area}</span>
                        </div>
                      )}
                      {company.events && company.events.length > 0 && company.events[0].duration && (
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>実施期間</span>
                          <span className="ml-1">{company.events[0].duration}</span>
                        </div>
                      )}
                      {(!company.events || company.events.length === 0) && company.eventPeriod && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>開催時期</span>
                          <span className="ml-1">{company.eventPeriod}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-5 px-4">
                    <div className="text-lg font-semibold text-gray-900">{company.name}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full border border-orange-300 text-orange-500 text-xs font-semibold">
                        {company.tag}
                      </span>
                      <div className="flex items-center gap-1 text-orange-400 text-xs font-semibold">
                        <AlertTriangle size={14} />
                        <span>
                          応募締切日：{company.events && company.events.length > 0
                            ? company.events[0].deadline ?? company.deadline
                            : company.deadline}
                        </span>
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
