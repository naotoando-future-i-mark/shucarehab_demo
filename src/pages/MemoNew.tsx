import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '../router/Router';

export default function MemoNew() {
  const { navigate } = useRouter();
  const [newNote, setNewNote] = useState({
    companyName: '',
    industry: '',
    jobType: '',
    location: '',
    employees: '',
    listing: '',
    salary: '',
    webTest: '',
    workHours: '',
    other: '',
  });

  const handleSave = () => {
    if (!newNote.companyName.trim()) {
      alert('企業名を入力してください');
      return;
    }

    // localStorageに保存
    const existingNotes = JSON.parse(localStorage.getItem('shukarehub_notes') || '[]');
    const note = {
      id: Date.now(),
      companyName: newNote.companyName,
      basicInfo: {
        industry: newNote.industry,
        jobType: newNote.jobType,
        location: newNote.location,
        employees: newNote.employees,
        listing: newNote.listing,
        salary: newNote.salary,
        webTest: newNote.webTest,
        workHours: newNote.workHours,
        other: newNote.other,
      },
      researchMemos: [],
      interviewMemos: [],
    };
    localStorage.setItem('shukarehub_notes', JSON.stringify([...existingNotes, note]));

    navigate('/memo');
  };

  return (
    <div className="pt-14 pb-20 bg-white min-h-screen max-w-md mx-auto">
      <div className="bg-white border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/memo')}>
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <span className="font-semibold">ノート作成</span>
          <button onClick={handleSave} className="text-emerald-500 font-semibold">
            保存
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <label className="text-sm text-gray-600">企業名</label>
          <input
            value={newNote.companyName}
            onChange={(e) => setNewNote({ ...newNote, companyName: e.target.value })}
            placeholder="企業名を入力"
            className="w-full mt-1 pb-2 border-b text-lg outline-none"
          />
        </div>

        <div className="inline-block px-3 py-1 bg-orange-50 text-orange-500 text-xs font-semibold rounded mb-4">
          基本情報
        </div>

        <div className="space-y-3">
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
                value={newNote[key as keyof typeof newNote]}
                onChange={(e) => setNewNote({ ...newNote, [key]: e.target.value })}
                maxLength={20}
                placeholder="内容を入力"
                className="flex-1 text-sm outline-none"
              />
              <span className="text-xs text-gray-400">
                {newNote[key as keyof typeof newNote].length}/20
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
