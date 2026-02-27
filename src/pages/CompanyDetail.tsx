import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Plane, Clock, TrendingDown, Gift, CheckCircle, Coffee, Monitor, Zap, Baby, Calendar, LucideIcon } from 'lucide-react';
import { useRouter } from '../router/Router';
import { supabase } from '../lib/supabase';
import { MemoEditorModal } from '../components/jobhunting/MemoEditorModal';
import { showToast } from '../components/Toast';
import BottomTab from '../components/BottomTab';

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

type InternEvent = {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  date: string;
  time: string;
  deadline: string;
};

type WhiteLevel = 'normal' | 'high' | 'highest' | 'god';

type WhiteFeature = {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string;
  level: WhiteLevel;
};

type CompanyMemo = {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
};

const companyPoints = [
  '月給が初年度から50万円もらえる',
  '充実した研修制度で未経験でも安心',
  '風通しの良い社風で意見が通りやすい',
];

export default function CompanyDetail() {
  const { navigate } = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'memo'>('data');
  const [openSections, setOpenSections] = useState<string[]>(['schedule']);
  const [internEvents, setInternEvents] = useState<InternEvent[]>([]);
  const [whiteFeatures, setWhiteFeatures] = useState<WhiteFeature[]>([]);
  const [isInNote, setIsInNote] = useState(false);
  const [companyNoteId, setCompanyNoteId] = useState<string | null>(null);
  const [memos, setMemos] = useState<CompanyMemo[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<{ category: string; title: string; content: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('shukarehub_selected_company');
    if (stored) {
      const parsedCompany = JSON.parse(stored);
      setCompany(parsedCompany);

      setInternEvents([
        {
          id: '1',
          title: parsedCompany.eventTitle || `${parsedCompany.name} 1Day仕事体験`,
          type: 'intern',
          typeLabel: '仕事体験',
          date: '',
          time: '-',
          deadline: parsedCompany.deadline || '2026年02月28日（土）',
        }
      ]);

      const features: WhiteFeature[] = [
        { id: '1', icon: Plane, label: '年間休日', value: '130日以上', level: 'highest' },
        { id: '2', icon: Clock, label: '月残業', value: '残業なし', level: 'god' },
        { id: '3', icon: TrendingDown, label: '離職率', value: '20%未満\n(3年以内)', level: 'highest' },
        { id: '4', icon: Gift, label: 'ボーナス', value: '月給5ヶ月\n以上', level: 'highest' },
        { id: '5', icon: CheckCircle, label: '有休消化', value: '消化率90%\n以上', level: 'god' },
        { id: '6', icon: Coffee, label: '特別休暇', value: '年20日以上', level: 'highest' },
        { id: '7', icon: Plane, label: '特別休暇', value: '10種類以上', level: 'highest' },
        { id: '8', icon: Monitor, label: 'リモート', value: 'フルリモート', level: 'god' },
        { id: '9', icon: Zap, label: 'フレックス', value: 'フル\nフレックス', level: 'god' },
        { id: '10', icon: Baby, label: '育児休暇', value: '女性90%\n男性50%', level: 'highest' },
      ];
      setWhiteFeatures(features);

      loadCompanyNote(parsedCompany.name);
    }
  }, []);

  const loadCompanyNote = async (companyName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', companyName)
        .maybeSingle();

      if (!company) {
        setIsInNote(false);
        setCompanyNoteId(null);
        return;
      }

      const { data: note } = await supabase
        .from('company_notes')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', company.id)
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
        .insert([{ user_id: user.id, name: company.name }])
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

  const renderLevelBadge = (level: WhiteLevel) => {
    if (level === 'god') {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded mb-1 font-medium whitespace-nowrap badge-god">
          神レベル
        </span>
      );
    } else if (level === 'highest') {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded mb-1 font-medium whitespace-nowrap badge-highest">
          最高レベル
        </span>
      );
    } else if (level === 'high') {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded mb-1 font-medium whitespace-nowrap badge-high">
          高レベル
        </span>
      );
    } else {
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded mb-1 font-medium whitespace-nowrap badge-normal">
          普通
        </span>
      );
    }
  };

  const getMemosByCategory = (category: string) => {
    return memos.filter(m => m.category === category);
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
            {company.isPremium && company.premiumImage && (
              <img src={company.premiumImage} alt={company.name} className="w-full h-48 object-cover rounded-lg mb-4" />
            )}

            {company.isPremium && whiteFeatures.length > 0 && (
              <div className="bg-white mb-4 p-4 rounded-lg border">
                <div className="inline-block px-3 py-1 bg-orange-500 text-white text-sm font-medium rounded mb-4">
                  ホワイト制度
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {whiteFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.id} className="flex flex-col items-center">
                        {renderLevelBadge(feature.level)}
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-1">
                          <Icon size={20} className="text-orange-500" />
                        </div>
                        <span className="text-[9px] text-gray-600 text-center">{feature.label}</span>
                        <span className="text-[9px] text-gray-900 text-center whitespace-pre-line font-medium">
                          {feature.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {company.isPremium && (
              <div className="bg-white mb-4 p-4 rounded-lg border">
                <div className="inline-block px-3 py-1 bg-orange-500 text-white text-sm font-medium rounded mb-4">
                  ポイント
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <ul className="space-y-2">
                    {companyPoints.map((point, index) => (
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
                  {internEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3 bg-white mb-2">
                      <div className="font-medium text-gray-800 mb-2">{event.title}</div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-100 text-red-500 text-xs rounded">応募締切日</span>
                        <span className="text-orange-500 text-sm">{event.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden mb-3">
              <button onClick={() => toggleSection('job')} className="w-full px-4 py-3 flex items-center justify-between bg-white">
                <span className="font-medium text-gray-700">求人情報</span>
                {openSections.includes('job') ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openSections.includes('job') && <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500">求人情報がありません。</div>}
            </div>

            <div className="border rounded-lg overflow-hidden mb-3">
              <button onClick={() => toggleSection('flow')} className="w-full px-4 py-3 flex items-center justify-between bg-white">
                <span className="font-medium text-gray-700">選考フロー</span>
                {openSections.includes('flow') ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openSections.includes('flow') && <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500">選考フロー情報がここに表示されます。</div>}
            </div>

            <div className="border rounded-lg overflow-hidden mb-3">
              <button onClick={() => toggleSection('schedule')} className="w-full px-4 py-3 flex items-center justify-between bg-white">
                <span className="font-medium text-gray-700">日程</span>
                {openSections.includes('schedule') ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openSections.includes('schedule') && (
                <div className="px-4 py-3 bg-gray-50">
                  {internEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 bg-white">
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
                  ))}
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
                <div className="border rounded-lg p-4">
                  <span className="inline-block px-3 py-1 border border-orange-500 text-orange-500 text-sm rounded mb-3">企業研究</span>
                  {getMemosByCategory('research').length > 0 ? (
                    <div className="space-y-2">
                      {getMemosByCategory('research').map((memo) => (
                        <div key={memo.id} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{memo.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(memo.created_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => handleAddMemo('research', '企業研究')}
                    className="w-full flex items-center justify-center gap-2 text-gray-600 py-2 mt-3 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Plus size={16} /><span>企業研究を追加する</span>
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <span className="inline-block px-3 py-1 border border-orange-500 text-orange-500 text-sm rounded mb-3">面接対策</span>
                  {getMemosByCategory('interview').length > 0 ? (
                    <div className="space-y-2">
                      {getMemosByCategory('interview').map((memo) => (
                        <div key={memo.id} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{memo.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(memo.created_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => handleAddMemo('interview', '面接対策')}
                    className="w-full flex items-center justify-center gap-2 text-gray-600 py-2 mt-3 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Plus size={16} /><span>面接対策を追加する</span>
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <span className="inline-block px-3 py-1 border border-orange-500 text-orange-500 text-sm rounded mb-3">ES対策</span>
                  {getMemosByCategory('es').length > 0 ? (
                    <div className="space-y-2">
                      {getMemosByCategory('es').map((memo) => (
                        <div key={memo.id} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{memo.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(memo.created_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => handleAddMemo('es', 'ES対策')}
                    className="w-full flex items-center justify-center gap-2 text-gray-600 py-2 mt-3 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Plus size={16} /><span>ES対策を追加する</span>
                  </button>
                </div>
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
