import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Calendar, Star, ExternalLink, Building2, MapPin, Users } from 'lucide-react';
import { useRouter } from '../router/Router';
import { supabase } from '../lib/supabase';
import { MemoEditorModal } from '../components/jobhunting/MemoEditorModal';
import { showToast } from '../components/Toast';
import BottomTab from '../components/BottomTab';

type WhiteLevel = 'normal' | 'high' | 'highest' | 'god';

type WhiteFeatureData = {
  id: string;
  iconName: string;
  label: string;
  value: string;
  level: WhiteLevel;
};

type Company = {
  id: string;
  name: string;
  tag?: string | null;
  deadline?: string | null;
  deadline_closed?: boolean | null;
  industry?: string | null;
  location?: string | null;
  employees?: string | null;
  is_premium?: boolean | null;
  premium_image?: string | null;
  is_urgent?: boolean | null;
  event_title?: string | null;
  event_period?: string | null;
  event_area?: string | null;
  event_duration?: string | null;
  position?: string | null;
  founded_year?: string | null;
  capital?: string | null;
  revenue?: string | null;
  business_description?: string | null;
  company_url?: string | null;
  recruit_url?: string | null;
  points?: string[] | null;
  white_features?: WhiteFeatureData[] | null;
  selection_flow?: unknown[] | null;
  job_info?: unknown[] | null;
  intern_info?: unknown[] | null;
  tags?: string[] | null;
};

type InternEvent = {
  id: string;
  title: string;
  typeLabel: string;
  date: string;
  time: string;
  deadline: string;
  area?: string;
  duration?: string;
};

type CompanyMemo = {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
};

export default function CompanyDetail() {
  const { navigate } = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'memo'>('data');
  const [openSections, setOpenSections] = useState<string[]>(['intern']);
  const [isInNote, setIsInNote] = useState(false);
  const [companyNoteId, setCompanyNoteId] = useState<string | null>(null);
  const [memos, setMemos] = useState<CompanyMemo[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<{ category: string; title: string; content: string } | null>(null);

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem('shukarehub_selected_company_id')
        ?? localStorage.getItem('shukarehub_selected_company');
      if (!stored) { setLoading(false); return; }

      let companyId: string | null = null;
      try {
        const parsed = JSON.parse(stored);
        companyId = typeof parsed === 'object' ? (parsed.id ?? null) : parsed;
      } catch {
        companyId = stored;
      }

      if (!companyId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('master_companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (!error && data) {
        setCompany(data as Company);
        loadCompanyNote(data.id, data.name);
      }
      setLoading(false);
    }
    load();
  }, []);

  const loadCompanyNote = async (masterCompanyId: string, companyName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyRow } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', companyName)
        .maybeSingle();

      if (!companyRow) {
        setIsInNote(false);
        setCompanyNoteId(null);
        return;
      }

      const { data: note } = await supabase
        .from('company_notes')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyRow.id)
        .maybeSingle();

      if (!note) {
        setIsInNote(false);
        setCompanyNoteId(null);
        return;
      }

      setIsInNote(true);
      setCompanyNoteId(note.id);
      loadMemos(note.id);
    } catch (error) {
      console.error('企業ノート読み込みエラー:', error);
    }
  };

  const loadMemos = async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_memos')
        .select('*')
        .eq('company_note_id', noteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMemos(data);
    } catch (error) {
      console.error('メモ読み込みエラー:', error);
    }
  };

  const handleAddMemo = (category: string, title: string) => {
    setEditingMemo({ category, title, content: '' });
    setIsEditModalOpen(true);
  };

  const handleAddToNote = async () => {
    if (!company) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ user_id: user.id, name: company.name, master_company_id: company.id }])
        .select()
        .single();

      if (companyError) throw companyError;

      const { data: noteData, error: noteError } = await supabase
        .from('company_notes')
        .insert([{
          user_id: user.id,
          company_id: companyData.id,
          industry: company.industry || '',
          job_type: '',
          location: company.location || '',
          employee_count: company.employees || '',
          listing_status: '',
          base_salary: '',
          web_test: '',
          working_hours: '',
          mypage_url: '',
          login_id: '',
          password: '',
          login_notes: '',
          custom_fields: [],
          free_memo: '',
        }])
        .select()
        .single();

      if (noteError) throw noteError;

      setIsInNote(true);
      setCompanyNoteId(noteData.id);
      showToast('就活ノートに追加しました', 'success');
    } catch (error) {
      console.error('就活ノート追加エラー:', error);
      showToast('追加に失敗しました', 'error');
    }
  };

  const handleSaveMemo = async (content: string) => {
    if (!companyNoteId || !editingMemo) return;

    try {
      const { error } = await supabase
        .from('company_memos')
        .insert({
          company_note_id: companyNoteId,
          title: editingMemo.title,
          content,
          category: editingMemo.category,
        });

      if (error) throw error;

      showToast('メモを追加しました', 'success');
      loadMemos(companyNoteId);
      setEditingMemo(null);
    } catch (error) {
      console.error('メモ保存エラー:', error);
      showToast('メモの追加に失敗しました', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
        <BottomTab />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex flex-col items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <p className="text-gray-500 mb-4">企業データが見つかりません</p>
          <button onClick={() => navigate('/companies')} className="px-4 py-2 bg-orange-500 text-white rounded-lg">
            企業一覧に戻る
          </button>
        </div>
        <BottomTab />
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const internEvents: InternEvent[] = company.intern_info && Array.isArray(company.intern_info) && company.intern_info.length > 0
    ? (company.intern_info as InternEvent[])
    : company.event_title
      ? [{
          id: '1',
          title: company.event_title,
          typeLabel: '仕事体験',
          date: '',
          time: '-',
          deadline: company.deadline || '-',
          area: company.event_area || '',
          duration: company.event_duration || '',
        }]
      : [];

  const handleAddToCalendar = (event: InternEvent) => {
    const calendarEventData = {
      title: event.title,
      companyName: company.name,
      eventType: 'intern',
      deadlineDate: event.deadline,
      date: '',
      startTime: '10:00',
      endTime: '17:00',
      color: '#FFA52F',
      memo: `${company.name}のインターン\n${event.title}`,
    };
    localStorage.setItem('shukarehub_calendar_prefill', JSON.stringify(calendarEventData));
    navigate('/calendar?addEvent=true');
  };

  const getMemosByCategory = (category: string) => {
    return memos.filter(m => m.category === category);
  };

  const levelBadgeClass = (level: WhiteLevel) => {
    const map: Record<WhiteLevel, string> = {
      god: 'bg-yellow-400 text-yellow-900',
      highest: 'bg-red-400 text-white',
      high: 'bg-blue-400 text-white',
      normal: 'bg-gray-300 text-gray-700',
    };
    return map[level] ?? map.normal;
  };

  const levelBadgeLabel = (level: WhiteLevel) => {
    const map: Record<WhiteLevel, string> = {
      god: '神レベル',
      highest: '最高レベル',
      high: '高レベル',
      normal: '普通',
    };
    return map[level] ?? '普通';
  };

  const displayVal = (v: string | null | undefined) => (v && v.trim() !== '' ? v : '-');

  const hasValidValue = (v: string | null | undefined) => !!(v && v.trim() !== '' && v !== '-');

  const hasDate = (event: InternEvent) =>
    hasValidValue(event.date) || hasValidValue(event.deadline);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">

        {/* 1. ヘッダー */}
        <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/companies')}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="px-4 pt-4">

          {/* 企業名 */}
          <h1 className="text-xl font-bold text-gray-900 text-center mb-3">{company.name}</h1>

          {/* 2. タグ */}
          {company.tags && company.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {company.tags.map((tag, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 3. ヒーロー画像 */}
          {company.premium_image && (
            <div className="w-full rounded-xl overflow-hidden mb-4">
              <img
                src={company.premium_image}
                alt={company.name}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* 4. 業界・本社・従業員の3行表示 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 text-xs w-12">業界</span>
              <span>{displayVal(company.industry)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 text-xs w-12">本社</span>
              <span>{displayVal(company.location)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 text-xs w-12">従業員</span>
              <span>{displayVal(company.employees)}</span>
            </div>
          </div>

          {/* 5. 就活ノート追加ボタン */}
          <div className="mb-4">
            {isInNote ? (
              <p className="text-gray-400 text-sm text-center py-2">✓ 就活ノートに追加済み</p>
            ) : (
              <button
                onClick={handleAddToNote}
                className="border-2 border-[#FFA52F] text-[#FFA52F] rounded-xl py-3 w-full font-medium hover:bg-orange-50 transition-colors text-base"
              >
                ＋ 就活ノートに追加
              </button>
            )}
          </div>

          {/* 6. タブ切り替え（追加済みのみ） */}
          {isInNote && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'data'
                    ? 'bg-white text-orange-500 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                企業データ
              </button>
              <button
                onClick={() => setActiveTab('memo')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'memo'
                    ? 'bg-white text-orange-500 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                就活メモ
              </button>
            </div>
          )}

          {/* 7. 企業データタブ */}
          {activeTab === 'data' && (
            <div className="space-y-4">

              {/* a. ホワイト制度（プレミアム＋データありのみ） */}
              {company.is_premium && company.white_features && company.white_features.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded mb-4">
                    ホワイト制度
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {company.white_features.map((feature) => (
                      <div key={feature.id} className="flex flex-col items-center">
                        <span className={`text-[9px] px-1 py-0.5 rounded font-medium mb-1 text-center whitespace-nowrap ${levelBadgeClass(feature.level)}`}>
                          {levelBadgeLabel(feature.level)}
                        </span>
                        <div className="w-12 h-12 bg-orange-50 rounded-lg border border-orange-200 flex items-center justify-center mb-1">
                          <span className="text-orange-500 text-sm font-bold">{feature.iconName?.slice(0, 2) ?? '★'}</span>
                        </div>
                        <span className="text-[9px] text-gray-500 text-center leading-tight">{feature.label}</span>
                        <span className="text-[9px] text-gray-800 text-center font-medium mt-0.5 leading-tight whitespace-pre-line">{feature.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* b. 企業ポイント（プレミアム＋データありのみ） */}
              {company.is_premium && company.points && company.points.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <h2 className="font-bold text-gray-800 mb-3 text-base flex items-center gap-1.5">
                    <Star size={16} className="text-orange-400" fill="#FFA52F" />
                    企業ポイント
                  </h2>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <ul className="space-y-2">
                      {company.points.map((point, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* c. 基本データ（アコーディオン） */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full px-4 py-3.5 flex items-center justify-between"
                >
                  <span className="font-bold text-gray-800 text-base">基本データ</span>
                  {openSections.includes('basic')
                    ? <ChevronUp size={20} className="text-gray-400" />
                    : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {openSections.includes('basic') && (
                  <div className="px-4 pb-4 space-y-3">
                    {[
                      { label: '職種', value: displayVal(company.position) },
                      { label: '設立年', value: displayVal(company.founded_year) },
                      { label: '資本金', value: displayVal(company.capital) },
                      { label: '売上高', value: displayVal(company.revenue) },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                        <p className="text-sm text-gray-800 font-medium">{item.value}</p>
                      </div>
                    ))}
                    {company.business_description && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">事業内容</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{company.business_description}</p>
                      </div>
                    )}
                    {company.company_url && (
                      <a
                        href={company.company_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-orange-500 underline text-sm"
                      >
                        <ExternalLink size={14} />
                        企業HPを見る
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* d. インターン・イベント情報 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('intern')}
                  className="w-full px-4 py-3.5 flex items-center justify-between"
                >
                  <span className="font-bold text-gray-800 text-base">インターン・イベント情報</span>
                  {openSections.includes('intern')
                    ? <ChevronUp size={20} className="text-gray-400" />
                    : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {openSections.includes('intern') && (
                  <div className="px-4 pb-4">
                    {internEvents.length === 0 ? (
                      <p className="text-sm text-gray-400">インターン・イベント情報はまだ登録されていません</p>
                    ) : (
                      <div className="space-y-3">
                        {internEvents.map((event) => (
                          <div key={event.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                            <p className="font-medium text-gray-800 text-sm mb-2">{event.title}</p>
                            <div className="space-y-1">
                              {hasValidValue(event.deadline) && (
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-red-100 text-red-500 text-xs rounded-full font-medium">応募締切</span>
                                  <span className="text-orange-500 text-sm font-medium">{event.deadline}</span>
                                </div>
                              )}
                              {event.area && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-gray-400">エリア</span>
                                  <span className="text-xs text-gray-700">{event.area}</span>
                                </div>
                              )}
                              {event.duration && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-gray-400">期間</span>
                                  <span className="text-xs text-gray-700">{event.duration}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {company.recruit_url && (
                          <button
                            onClick={() => window.open(company.recruit_url!, '_blank')}
                            className="bg-[#FFA52F] text-white rounded-lg py-3 w-full text-center font-medium text-sm mt-1"
                          >
                            申込ページへ
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* e. 求人情報 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('job')}
                  className="w-full px-4 py-3.5 flex items-center justify-between"
                >
                  <span className="font-bold text-gray-800 text-base">求人情報</span>
                  {openSections.includes('job')
                    ? <ChevronUp size={20} className="text-gray-400" />
                    : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {openSections.includes('job') && (
                  <div className="px-4 pb-4">
                    {company.job_info && Array.isArray(company.job_info) && company.job_info.length > 0 ? (
                      <div className="space-y-3">
                        {(company.job_info as Record<string, string>[]).map((item, i) => (
                          <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-1">
                            {Object.entries(item).map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <span className="text-xs text-gray-400 flex-shrink-0 w-20">{k}</span>
                                <span className="text-sm text-gray-800">{v}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        {company.recruit_url && (
                          <button
                            onClick={() => window.open(company.recruit_url!, '_blank')}
                            className="bg-[#FFA52F] text-white rounded-lg py-3 w-full text-center font-medium text-sm"
                          >
                            申込ページへ
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">求人情報はまだ登録されていません</p>
                    )}
                  </div>
                )}
              </div>

              {/* f. 選考フロー */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('flow')}
                  className="w-full px-4 py-3.5 flex items-center justify-between"
                >
                  <span className="font-bold text-gray-800 text-base">選考フロー</span>
                  {openSections.includes('flow')
                    ? <ChevronUp size={20} className="text-gray-400" />
                    : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {openSections.includes('flow') && (
                  <div className="px-4 pb-4">
                    {company.selection_flow && Array.isArray(company.selection_flow) && company.selection_flow.length > 0 ? (
                      <div className="relative">
                        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-orange-100" />
                        <div className="space-y-4">
                          {(company.selection_flow as string[]).map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full bg-orange-400 border-2 border-white shadow-sm flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">{i + 1}</span>
                              </div>
                              <div className="flex-1 pt-0.5">
                                <p className="text-sm text-gray-800 font-medium">{step}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">選考フロー情報はまだ登録されていません</p>
                    )}
                  </div>
                )}
              </div>

              {/* g. 日程 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('schedule')}
                  className="w-full px-4 py-3.5 flex items-center justify-between"
                >
                  <span className="font-bold text-gray-800 text-base">日程</span>
                  {openSections.includes('schedule')
                    ? <ChevronUp size={20} className="text-gray-400" />
                    : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                {openSections.includes('schedule') && (
                  <div className="px-4 pb-4">
                    {internEvents.length === 0 ? (
                      <p className="text-sm text-gray-400">日程情報がありません</p>
                    ) : (
                      <div className="space-y-3">
                        {internEvents.map((event) => (
                          <div key={event.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                            <div className="flex gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">{event.typeLabel}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">
                                <div className="w-3.5 h-3.5 rounded-full border-[3px] border-orange-400 bg-white" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="font-medium text-gray-800 text-sm">{event.title}</p>
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  <p>日にち：{event.date || '-'}</p>
                                  <p>時　間：{event.time}</p>
                                  <p>締切日：{event.deadline}</p>
                                </div>
                              </div>
                            </div>
                            {hasDate(event) && (
                              <button
                                onClick={() => handleAddToCalendar(event)}
                                className="w-full mt-3 py-2.5 border-2 border-orange-400 text-orange-500 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-sm"
                              >
                                <Calendar size={16} />
                                カレンダーに登録
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 就活メモタブ */}
          {isInNote && activeTab === 'memo' && (
            <div className="space-y-4 pb-4">
              {!companyNoteId ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  就活ノートから企業を追加するとメモが書けます
                </div>
              ) : (
                <>
                  {(['research', 'interview', 'es'] as const).map((cat) => {
                    const labels: Record<string, string> = { research: '企業研究', interview: '面接対策', es: 'ES対策' };
                    return (
                      <div key={cat} className="border rounded-lg p-4">
                        <span className="inline-block px-3 py-1 border border-orange-500 text-orange-500 text-sm rounded mb-3">{labels[cat]}</span>
                        {getMemosByCategory(cat).length > 0 && (
                          <div className="space-y-2 mb-1">
                            {getMemosByCategory(cat).map((memo) => (
                              <div key={memo.id} className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{memo.content}</p>
                                <p className="text-xs text-gray-400 mt-2">{new Date(memo.created_at).toLocaleDateString('ja-JP')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => handleAddMemo(cat, labels[cat])}
                          className="w-full flex items-center justify-center gap-2 text-gray-600 py-2 mt-3 hover:bg-gray-50 rounded transition-colors"
                        >
                          <Plus size={16} /><span>{labels[cat]}を追加する</span>
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

        </div>
      </div>

      {editingMemo && (
        <MemoEditorModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingMemo(null);
          }}
          title={editingMemo.title}
          initialContent={editingMemo.content}
          onSave={handleSaveMemo}
        />
      )}

      <BottomTab />
    </div>
  );
}
