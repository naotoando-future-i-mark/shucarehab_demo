import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Calendar } from 'lucide-react';
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

  const levelBadge = (level: WhiteLevel) => {
    const map: Record<WhiteLevel, { label: string; cls: string }> = {
      god: { label: '神レベル', cls: 'badge-god' },
      highest: { label: '最高レベル', cls: 'badge-highest' },
      high: { label: '高レベル', cls: 'badge-high' },
      normal: { label: '普通', cls: 'badge-normal' },
    };
    const { label, cls } = map[level] ?? map.normal;
    return <span className={`text-[9px] px-1.5 py-0.5 rounded mb-1 font-medium whitespace-nowrap ${cls}`}>{label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="relative px-4 py-4">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <span className="text-[80px] font-bold text-orange-100 opacity-50 whitespace-nowrap">JOB NOTE</span>
          </div>
          <div className="relative flex items-center">
            <button onClick={() => navigate('/companies')} className="p-1 mr-2">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-medium text-gray-800">就活Note</h1>
          </div>
        </div>

        <div className="text-center py-2 px-4">
          <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
          <div className="mt-2">
            {isInNote ? (
              <span className="text-sm text-gray-400">✓ 就活ノートに追加済み</span>
            ) : (
              <button
                onClick={handleAddToNote}
                className="w-full py-3 border-2 border-[#FFA52F] text-[#FFA52F] rounded-xl font-medium hover:bg-orange-50 transition-colors"
              >
                ＋ 就活ノートに追加
              </button>
            )}
          </div>
        </div>

        {isInNote && (
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'data' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'
              }`}
            >
              企業データ
            </button>
            <button
              onClick={() => setActiveTab('memo')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'memo' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'
              }`}
            >
              就活メモ
            </button>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="px-4 py-4">
            {company.is_premium && company.premium_image && (
              <img src={company.premium_image} alt={company.name} className="w-full h-48 object-cover rounded-lg mb-4" />
            )}

            {company.is_premium && company.white_features && company.white_features.length > 0 && (
              <div className="bg-white mb-4 p-4 rounded-lg border">
                <div className="inline-block px-3 py-1 bg-orange-500 text-white text-sm font-medium rounded mb-4">
                  ホワイト制度
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {company.white_features.map((feature) => (
                    <div key={feature.id} className="flex flex-col items-center">
                      {levelBadge(feature.level)}
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-1">
                        <span className="text-orange-500 text-sm font-bold">{feature.iconName?.slice(0, 2) ?? '★'}</span>
                      </div>
                      <span className="text-[9px] text-gray-600 text-center">{feature.label}</span>
                      <span className="text-[9px] text-gray-900 text-center whitespace-pre-line font-medium">{feature.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {company.points && company.points.length > 0 && (
              <div className="bg-white mb-4 p-4 rounded-lg border">
                <div className="inline-block px-3 py-1 bg-orange-500 text-white text-sm font-medium rounded mb-4">
                  ポイント
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <ul className="space-y-2">
                    {company.points.map((point, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-500">・</span>{point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden mb-3">
              <button onClick={() => toggleSection('intern')} className="w-full px-4 py-3 flex items-center justify-between bg-white">
                <span className="font-medium text-gray-700">インターン情報</span>
                {openSections.includes('intern') ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openSections.includes('intern') && (
                <div className="px-4 py-3 bg-gray-50">
                  {internEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">インターン情報がありません。</p>
                  ) : (
                    <>
                      {internEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-3 bg-white mb-2">
                          <div className="font-medium text-gray-800 mb-2">{event.title}</div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-100 text-red-500 text-xs rounded">応募締切日</span>
                            <span className="text-orange-500 text-sm">{event.deadline}</span>
                          </div>
                        </div>
                      ))}
                      {company.recruit_url && (
                        <button
                          onClick={() => window.open(company.recruit_url!, '_blank')}
                          className="bg-[#FFA52F] text-white rounded-lg py-3 w-full text-center font-medium mt-2"
                        >
                          申込ページへ
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden mb-3">
              <button onClick={() => toggleSection('job')} className="w-full px-4 py-3 flex items-center justify-between bg-white">
                <span className="font-medium text-gray-700">求人情報</span>
                {openSections.includes('job') ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openSections.includes('job') && (
                <div className="px-4 py-3 bg-gray-50">
                  {company.job_info && Array.isArray(company.job_info) && company.job_info.length > 0 ? (
                    <>
                      <div className="space-y-2 mb-2">
                        {(company.job_info as Record<string, string>[]).map((item, i) => (
                          <div key={i} className="border rounded-lg p-3 bg-white">
                            {Object.entries(item).map(([k, v]) => (
                              <div key={k} className="text-sm text-gray-700"><span className="font-medium">{k}：</span>{v}</div>
                            ))}
                          </div>
                        ))}
                      </div>
                      {company.recruit_url && (
                        <button
                          onClick={() => window.open(company.recruit_url!, '_blank')}
                          className="bg-[#FFA52F] text-white rounded-lg py-3 w-full text-center font-medium"
                        >
                          申込ページへ
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">求人情報がありません。</p>
                  )}
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden mb-3">
              <button onClick={() => toggleSection('flow')} className="w-full px-4 py-3 flex items-center justify-between bg-white">
                <span className="font-medium text-gray-700">選考フロー</span>
                {openSections.includes('flow') ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openSections.includes('flow') && (
                <div className="px-4 py-3 bg-gray-50">
                  {company.selection_flow && Array.isArray(company.selection_flow) && company.selection_flow.length > 0 ? (
                    <ol className="space-y-2">
                      {(company.selection_flow as string[]).map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-gray-500">選考フロー情報がありません。</p>
                  )}
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden mb-3">
              <button onClick={() => toggleSection('schedule')} className="w-full px-4 py-3 flex items-center justify-between bg-white">
                <span className="font-medium text-gray-700">日程</span>
                {openSections.includes('schedule') ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openSections.includes('schedule') && (
                <div className="px-4 py-3 bg-gray-50">
                  {internEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">日程情報がありません。</p>
                  ) : (
                    internEvents.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4 bg-white mb-2">
                        <div className="flex gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">不明</span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">{event.typeLabel}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-1"><div className="w-4 h-4 rounded-full border-4 border-orange-400"></div></div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 mb-1">{event.title}</div>
                            <div className="text-sm text-gray-600 space-y-0.5">
                              <div>日にち：{event.date || '-'}</div>
                              <div>時　間：{event.time}</div>
                              <div>締切日：{event.deadline}</div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCalendar(event)}
                          className="w-full mt-4 py-2 border-2 border-orange-400 text-orange-500 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Calendar size={18} />
                          カレンダーに登録
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {isInNote && activeTab === 'memo' && (
          <div className="px-4 py-4 space-y-4">
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
    </div>
  );
}
