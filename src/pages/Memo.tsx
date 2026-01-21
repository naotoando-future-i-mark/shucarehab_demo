import { FileText, ChevronLeft, Trash2, Building2, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

// 企業データ（Companies.tsxと同じデータを参照する想定）
const registeredCompanies = [
  { name: 'キャノンマーケティングジャパン株式会社', industry: 'IT・通信', location: '東京都港区', employees: '50人-100人以下' },
  { name: '株式会社メイテックフィルダーズ', industry: '冠婚葬祭', location: '東京都台東区', employees: '301人以上' },
  { name: '伊藤忠商事株式会社', industry: '商社', location: '東京都港区北青山2-5-1', employees: '301人以上' },
  { name: 'ソニーグローバルソリューションズ株式会社', industry: '精密・医療機器', location: '東京都港区', employees: '301人以上' },
  { name: '楽天グループ株式会社', industry: 'IT・インターネット', location: '東京都世田谷区', employees: '301人以上' },
  { name: '株式会社サイバーエージェント', industry: '広告・マーケティング', location: '東京都渋谷区', employees: '301人以上' },
  { name: '三菱UFJ銀行', industry: '金融', location: '東京都千代田区', employees: '301人以上' },
  { name: 'トヨタ自動車株式会社', industry: 'メーカー', location: '愛知県豊田市', employees: '301人以上' },
  { name: '株式会社リクルート', industry: '人材・教育', location: '東京都千代田区', employees: '301人以上' },
  { name: 'アクセンチュア株式会社', industry: 'コンサルティング', location: '東京都港区', employees: '301人以上' },
];

type Note = {
  id: number;
  companyName: string;
  basicInfo: {
    industry: string;
    jobType: string;
    location: string;
    employees: string;
    listing: string;
    salary: string;
    webTest: string;
    workHours: string;
    other: string;
  };
  researchMemos: { id: number; content: string; date: string }[];
  interviewMemos: { id: number; content: string; date: string }[];
};

type MemoType = 'research' | 'interview';

const STORAGE_KEY = 'shukarehub_notes';

// アコーディオンコンポーネント
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

export default function Memo() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'memo'>('data');
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);

  // メモ追加用
  const [isAddingMemo, setIsAddingMemo] = useState(false);
  const [memoType, setMemoType] = useState<MemoType>('research');
  const [newMemoContent, setNewMemoContent] = useState('');

  // notesが変更されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // 企業名から登録済み企業を検索
  const findRegisteredCompany = (name: string) => {
    return registeredCompanies.find((c) => c.name === name);
  };

  // ノート削除
  const handleDeleteNote = (id: number) => {
    if (confirm('このノートを削除しますか？')) {
      setNotes(notes.filter((n) => n.id !== id));
    }
  };

  // メモ追加
  const handleAddMemo = () => {
    if (!selectedNote || !newMemoContent.trim()) return;

    const newMemo = {
      id: Date.now(),
      content: newMemoContent,
      date: new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\//g, '年').replace(/年/, '年').slice(0, -1) + '日',
    };

    const updatedNote = { ...selectedNote };
    if (memoType === 'research') {
      updatedNote.researchMemos = [...updatedNote.researchMemos, newMemo];
    } else {
      updatedNote.interviewMemos = [...updatedNote.interviewMemos, newMemo];
    }

    setNotes(notes.map((n) => (n.id === selectedNote.id ? updatedNote : n)));
    setSelectedNote(updatedNote);
    setNewMemoContent('');
    setIsAddingMemo(false);
  };

  // 基本情報更新
  const handleUpdateBasicInfo = () => {
    if (!selectedNote) return;
    setNotes(notes.map((n) => (n.id === selectedNote.id ? selectedNote : n)));
    setIsEditingBasicInfo(false);
  };

  // メモ追加モーダル
  if (isAddingMemo && selectedNote) {
    return (
      <div className="pt-14 pb-20 bg-white min-h-screen max-w-md mx-auto">
        <div className="bg-white border-b">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setIsAddingMemo(false)}>
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <span className="font-semibold">
              {memoType === 'research' ? '企業研究メモ' : '面接対策メモ'}
            </span>
            <button
              onClick={handleAddMemo}
              className="text-emerald-500 font-semibold"
            >
              保存
            </button>
          </div>
        </div>

        <div className="p-4">
          <textarea
            value={newMemoContent}
            onChange={(e) => setNewMemoContent(e.target.value)}
            placeholder={
              memoType === 'research'
                ? 'ここに企業研究のためのメモを書きましょう'
                : 'ここに面接対策のメモを書きましょう'
            }
            className="w-full h-64 p-3 border border-gray-200 rounded-xl text-sm outline-none resize-none"
          />
        </div>
      </div>
    );
  }

  // 基本情報編集モーダル
  if (isEditingBasicInfo && selectedNote) {
    return (
      <div className="pt-14 pb-32 bg-white min-h-screen max-w-md mx-auto">
        <div className="bg-white border-b">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setIsEditingBasicInfo(false)}>
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <span className="font-semibold">基本情報を編集</span>
            <button
              onClick={handleUpdateBasicInfo}
              className="text-emerald-500 font-semibold"
            >
              保存
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {[
            { key: 'industry', label: '業界' },
            { key: 'jobType', label: '職種' },
            { key: 'location', label: '勤務地' },
            { key: 'employees', label: '従業員数' },
            { key: 'listing', label: '上場情報' },
            { key: 'salary', label: '基本給' },
            { key: 'webTest', label: 'Webテスト' },
            { key: 'workHours', label: '勤務時間' },
            { key: 'other', label: 'その他' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center border-b pb-2">
              <span className="w-24 text-sm text-gray-600">{label}</span>
              <input
                value={selectedNote.basicInfo[key as keyof typeof selectedNote.basicInfo]}
                onChange={(e) =>
                  setSelectedNote({
                    ...selectedNote,
                    basicInfo: { ...selectedNote.basicInfo, [key]: e.target.value },
                  })
                }
                maxLength={20}
                placeholder="内容を入力"
                className="flex-1 text-sm outline-none"
              />
              <span className="text-xs text-gray-400">
                {selectedNote.basicInfo[key as keyof typeof selectedNote.basicInfo].length}/20
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ノート詳細画面
  if (selectedNote) {
    const registeredCompany = findRegisteredCompany(selectedNote.companyName);
    const isRegistered = !!registeredCompany;

    return (
      <div className="pt-14 pb-20 bg-white min-h-screen max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="bg-white border-b">
          <div className="px-4 py-3 flex items-center">
            <button onClick={() => setSelectedNote(null)}>
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <span className="ml-2 font-semibold">就活Note</span>
          </div>

          {/* 企業名と基本情報（登録企業の場合） */}
          <div className="px-4 pb-3">
            <div className="text-xl font-bold text-gray-900">{selectedNote.companyName}</div>
            {isRegistered && (
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-gray-500" />
                  <span>{registeredCompany.industry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-500" />
                  <span>{registeredCompany.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-500" />
                  <span>{registeredCompany.employees}</span>
                </div>
              </div>
            )}
          </div>

          {/* タブ */}
          <div className="flex border-t">
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-3 text-center text-sm font-semibold ${
                activeTab === 'data'
                  ? 'text-orange-500 border-b-2 border-orange-400'
                  : 'text-gray-500'
              }`}
            >
              企業データ
            </button>
            <button
              onClick={() => setActiveTab('memo')}
              className={`flex-1 py-3 text-center text-sm font-semibold ${
                activeTab === 'memo'
                  ? 'text-orange-500 border-b-2 border-orange-400'
                  : 'text-gray-500'
              }`}
            >
              就活メモ
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {activeTab === 'data' ? (
            isRegistered ? (
              // 登録企業の場合：アコーディオンUI
              <div className="space-y-4">
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
                  </div>
                </Accordion>

                <Accordion title="求人情報">
                  求人情報がありません。
                </Accordion>

                <Accordion title="選考フロー">
                  MVPでは未入力
                </Accordion>

                <Accordion title="日程">
                  MVPでは未入力
                </Accordion>
              </div>
            ) : (
              // 未登録企業の場合：従来の基本情報表示
              <div className="bg-white rounded-xl p-4 border">
                <div className="inline-block px-3 py-1 bg-orange-50 text-orange-500 text-xs font-semibold rounded mb-3">
                  基本情報
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 px-3 py-2 rounded">業界</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.industry || '-'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded">職種</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.jobType || '-'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded">勤務地</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.location || '-'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded">従業員数</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.employees || '-'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded">上場情報</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.listing || '-'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded">基本給</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.salary || '-'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded">Webテスト</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.webTest || '-'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded">勤務時間</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.workHours || '-'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded">その他</div>
                  <div className="px-3 py-2">{selectedNote.basicInfo.other || '-'}</div>
                </div>

                <button
                  onClick={() => setIsEditingBasicInfo(true)}
                  className="mt-4 w-full text-center text-sm text-gray-600"
                >
                  ✏️ 基本情報を編集する
                </button>
              </div>
            )
          ) : (
            // 就活メモタブ
            <div className="space-y-4">
              {/* 基本情報（編集ボタン付き） */}
              <div className="bg-white rounded-xl p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block px-3 py-1 bg-orange-50 text-orange-500 text-xs font-semibold rounded">
                    基本情報
                  </span>
                  <button
                    onClick={() => setIsEditingBasicInfo(true)}
                    className="text-sm text-gray-600"
                  >
                    ✏️ 基本情報を編集する
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {['業界', '職種', '勤務地', '従業員数', '上場情報', '基本給', 'Webテスト', '勤務時間', 'その他'].map((label) => (
                    <span key={label} className="px-3 py-1 bg-gray-100 rounded text-gray-600">{label}</span>
                  ))}
                </div>
              </div>

              {/* 企業研究 */}
              <div className="bg-white rounded-xl p-4 border">
                <div className="inline-block px-3 py-1 bg-orange-50 text-orange-500 text-xs font-semibold rounded mb-3">
                  企業研究
                </div>

                {selectedNote.researchMemos.map((memo) => (
                  <div key={memo.id} className="border rounded-lg p-3 mb-2">
                    <p className="text-sm">{memo.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{memo.date}</p>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setMemoType('research');
                    setIsAddingMemo(true);
                  }}
                  className="w-full py-2 text-sm text-gray-500"
                >
                  ＋ 企業研究を追加する
                </button>
              </div>

              {/* 面接対策 */}
              <div className="bg-white rounded-xl p-4 border">
                <div className="inline-block px-3 py-1 bg-orange-50 text-orange-500 text-xs font-semibold rounded mb-3">
                  面接対策
                </div>

                {selectedNote.interviewMemos.map((memo) => (
                  <div key={memo.id} className="border rounded-lg p-3 mb-2">
                    <p className="text-sm">{memo.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{memo.date}</p>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setMemoType('interview');
                    setIsAddingMemo(true);
                  }}
                  className="w-full py-2 text-sm text-gray-500"
                >
                  ＋ 面接対策を追加する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // メイン一覧画面
  return (
    <div className="pt-14 pb-20 bg-gray-50 min-h-screen max-w-md mx-auto">
      {/* ヘッダー */}
      <div className="bg-cyan-400 text-white text-center py-6">
        <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center mb-2">
          <FileText className="text-cyan-400" size={24} />
        </div>
        <p className="font-semibold">就活ノート</p>
      </div>

      {/* ノートリスト */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-xl font-semibold text-gray-900">就活ノートを作成しましょう</p>
          <p className="text-sm text-gray-500 mt-2 text-center">
            就活ノートは就活専用のメモ帳です
            <br />
            企業研究や、ES作成などに活用できます
            <br />
            ※右下の「＋」ボタンから作成できます
          </p>
        </div>
      ) : (
        <div className="divide-y bg-white">
          {notes.map((note) => (
            <div key={note.id} className="flex items-center">
              <button
                onClick={() => setSelectedNote(note)}
                className="flex-1 text-left px-4 py-4 bg-white hover:bg-gray-50"
              >
                <span className="text-gray-900">{note.companyName}</span>
              </button>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="px-4 py-4 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
