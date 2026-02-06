import { useState } from 'react';
import { Plus, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { SelectionEvent, SelectionProgress } from '../../types/company';
import { useRouter } from '../../router/Router';

interface SelectionTabProps {
  companyNoteId: string;
  companyName: string;
  events: SelectionEvent[];
  progress: SelectionProgress[];
  onAddEvent: (event: Omit<SelectionEvent, 'id' | 'created_at' | 'updated_at'>) => string | null;
  onUpdateEvent: (eventId: string, updates: Partial<SelectionEvent>) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddProgress: (progress: Omit<SelectionProgress, 'id' | 'created_at' | 'updated_at'>) => void;
  onDeleteProgress: (progressId: string) => void;
}

type Track = 'intern' | 'fulltime';

const CALENDAR_PREFILL_KEY = 'shukarehub_calendar_prefill';

export const SelectionTab = ({
  companyNoteId,
  companyName,
  events,
  progress,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddProgress,
  onDeleteProgress,
}: SelectionTabProps) => {
  const { navigate } = useRouter();
  const [selectedTrack, setSelectedTrack] = useState<Track>('intern');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const [createCalendarEvent, setCreateCalendarEvent] = useState(true);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    event_type: '',
    date_type: 'schedule' as 'deadline' | 'schedule',
    deadline_date: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    memo: '',
  });
  const [progressStage, setProgressStage] = useState('');

  const currentTrackEvents = events.filter((e) => e.track_type === selectedTrack);
  const currentTrackProgress = progress.filter((p) => p.track_type === selectedTrack);

  const handleAddEvent = () => {
    if (!eventFormData.title.trim()) return;

    onAddEvent({
      company_note_id: companyNoteId,
      track_type: selectedTrack,
      event_type: eventFormData.event_type,
      title: eventFormData.title,
      date_type: eventFormData.date_type,
      deadline_date: eventFormData.deadline_date,
      start_date: eventFormData.start_date,
      start_time: eventFormData.start_time,
      end_date: eventFormData.end_date,
      end_time: eventFormData.end_time,
      status: 'pending',
      memo: eventFormData.memo,
    });

    if (createCalendarEvent) {
      const prefillData = {
        title: eventFormData.title,
        eventType: selectedTrack,
        companyName: companyName,
        deadlineDate: eventFormData.date_type === 'deadline' ? eventFormData.deadline_date : '',
        date: eventFormData.date_type === 'schedule' ? eventFormData.start_date : '',
        startTime: eventFormData.date_type === 'schedule' ? eventFormData.start_time : '',
        endDate: eventFormData.date_type === 'schedule' ? eventFormData.end_date : '',
        endTime: eventFormData.date_type === 'schedule' ? eventFormData.end_time : '',
        memo: eventFormData.memo,
      };

      console.log('Saving prefill data to localStorage:', prefillData);
      localStorage.setItem(CALENDAR_PREFILL_KEY, JSON.stringify(prefillData));
      console.log('Navigating to calendar...');

      navigate('/calendar');
    }

    setEventFormData({
      title: '',
      event_type: '',
      date_type: 'schedule',
      deadline_date: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      memo: '',
    });
    setShowAddEventModal(false);
  };

  const handleAddProgress = () => {
    if (!progressStage.trim()) return;

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    onAddProgress({
      company_note_id: companyNoteId,
      track_type: selectedTrack,
      stage: progressStage,
      passed_date: localDate,
      notes: '',
    });

    setProgressStage('');
    setShowAddProgressModal(false);
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 pb-24">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedTrack('intern')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            selectedTrack === 'intern'
              ? 'bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          インターン
        </button>
        <button
          onClick={() => setSelectedTrack('fulltime')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            selectedTrack === 'fulltime'
              ? 'bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          本選考
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">通過した選考</h3>
          <button onClick={() => setShowAddProgressModal(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Plus size={18} className="text-[#FFA52F]" />
          </button>
        </div>

        <div className="p-4">
          {currentTrackProgress.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">通過した選考を追加してください</p>
          ) : (
            <div className="space-y-0">
              {currentTrackProgress.map((prog, index) => {
                const isLatest = index === 0;
                const passedDate = new Date(prog.passed_date);
                const formattedDate = `${passedDate.getMonth() + 1}/${passedDate.getDate()}`;

                return (
                  <div key={prog.id} className="group relative flex items-center gap-3 py-2.5">
                    <div className="relative flex flex-col items-center">
                      <div className={`relative z-10 flex items-center justify-center rounded-full ${
                        isLatest ? 'w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 shadow-md' : 'w-5 h-5 bg-gray-300'
                      }`}>
                        <CheckCircle2 size={isLatest ? 16 : 12} className="text-white" strokeWidth={3} />
                      </div>
                      {index !== currentTrackProgress.length - 1 && (
                        <div className="absolute w-0.5 h-full top-7 bg-gray-200" />
                      )}
                    </div>

                    <div className={`flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${
                      isLatest ? 'bg-gradient-to-r from-green-50 to-emerald-50/50' : 'bg-gray-50/50'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`font-bold ${isLatest ? 'text-gray-900 text-base' : 'text-gray-600 text-sm'}`}>
                          {prog.stage}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isLatest ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {formattedDate}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteProgress(prog.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">次の選考</h3>
          <button onClick={() => setShowAddEventModal(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Plus size={18} className="text-[#FFA52F]" />
          </button>
        </div>

        <div className="p-4">
          {currentTrackEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">次の選考を追加してください</p>
          ) : (
            <div className="space-y-3">
              {currentTrackEvents.map((event) => {
                const dateStr = event.date_type === 'schedule' ? event.start_date : event.deadline_date;
                const date = new Date(dateStr || '');
                const month = date.getMonth() + 1;
                const day = date.getDate();

                return (
                  <div key={event.id} className="rounded-xl border border-gray-200 p-3 hover:border-[#FFA52F] group">
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="text-center">
                          <div className="flex items-center gap-0.5">
                            <span className="text-2xl font-bold text-gray-800">{month}</span>
                            <span className="text-lg text-gray-400">/</span>
                            <span className="text-2xl font-bold text-gray-800">{day}</span>
                          </div>
                          {event.start_time && (
                            <div className="flex items-center gap-0.5 justify-center mt-0.5">
                              <Clock size={10} className="text-gray-400" />
                              <span className="text-[10px] text-gray-600">{event.start_time}</span>
                            </div>
                          )}
                        </div>
                        <div className={`w-1 h-12 rounded-full ${
                          event.date_type === 'schedule' ? 'bg-green-500' : 'bg-[#FFA52F]'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            event.date_type === 'schedule' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {event.date_type === 'schedule' ? '予定' : '締切'}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900">{event.title}</h4>
                        {event.memo && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.memo}</p>}
                      </div>

                      <button
                        onClick={() => onDeleteEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">イベント追加</h2>
              <button onClick={() => setShowAddEventModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">タイトル *</label>
                <input
                  type="text"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  placeholder="例: 1次面接"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">種類</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEventFormData({ ...eventFormData, date_type: 'schedule' })}
                    className={`flex-1 py-2 px-4 rounded-xl font-medium ${
                      eventFormData.date_type === 'schedule' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    予定
                  </button>
                  <button
                    onClick={() => setEventFormData({ ...eventFormData, date_type: 'deadline' })}
                    className={`flex-1 py-2 px-4 rounded-xl font-medium ${
                      eventFormData.date_type === 'deadline' ? 'bg-[#FFA52F] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    締切
                  </button>
                </div>
              </div>

              {eventFormData.date_type === 'schedule' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">開始日時</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={eventFormData.start_date}
                        onChange={(e) => setEventFormData({ ...eventFormData, start_date: e.target.value, end_date: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                      />
                      <input
                        type="time"
                        value={eventFormData.start_time}
                        onChange={(e) => setEventFormData({ ...eventFormData, start_time: e.target.value })}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">終了日時</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={eventFormData.end_date}
                        onChange={(e) => setEventFormData({ ...eventFormData, end_date: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                      />
                      <input
                        type="time"
                        value={eventFormData.end_time}
                        onChange={(e) => setEventFormData({ ...eventFormData, end_time: e.target.value })}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">締切日</label>
                  <input
                    type="date"
                    value={eventFormData.deadline_date}
                    onChange={(e) => setEventFormData({ ...eventFormData, deadline_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メモ</label>
                <textarea
                  value={eventFormData.memo}
                  onChange={(e) => setEventFormData({ ...eventFormData, memo: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F] resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-700">カレンダーを同時作成</p>
                  <p className="text-xs text-gray-500 mt-0.5">カレンダーページに遷移して登録します</p>
                </div>
                <button
                  onClick={() => setCreateCalendarEvent(!createCalendarEvent)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    createCalendarEvent ? 'bg-[#FFA52F]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      createCalendarEvent ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleAddEvent}
                disabled={!eventFormData.title.trim()}
                className="w-full py-3 bg-[#FFA52F] text-white rounded-xl font-medium hover:bg-[#FF8F0F] disabled:opacity-50"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">通過した選考を追加</h2>
              <button onClick={() => setShowAddProgressModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">ステージ名 *</label>
              <input
                type="text"
                value={progressStage}
                onChange={(e) => setProgressStage(e.target.value)}
                placeholder="例: 書類選考通過、1次面接通過"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddProgressModal(false)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddProgress}
                disabled={!progressStage.trim()}
                className="flex-1 px-3 py-2 bg-[#FFA52F] text-white rounded-xl font-medium hover:bg-[#FF8F0F] disabled:opacity-50"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
