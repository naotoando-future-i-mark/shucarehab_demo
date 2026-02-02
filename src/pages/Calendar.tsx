import { ChevronLeft, ChevronRight, ChevronDown, X, Plus, Palette, Building2, AlertCircle, Clock, Video, MapPin, Bell, Repeat, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type EventItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  color: string;
  eventType: 'intern' | 'main';
  companyName?: string;
  deadlineDate?: string;
  prepDates?: string[];
  videoUrl?: string;
  location?: string;
  notification?: string;
  repeat?: string;
  memo?: string;
  isAllDay?: boolean;
};

const STORAGE_KEY = 'shukarehub_events';
const PREFILL_KEY = 'shukarehub_calendar_prefill';

const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

const colorPresets = [
  { id: 'orange', color: '#FFA52F', name: 'オレンジ' },
  { id: 'blue', color: '#3b82f6', name: 'ブルー' },
  { id: 'purple', color: '#8b5cf6', name: 'パープル' },
  { id: 'green', color: '#22c55e', name: 'グリーン' },
  { id: 'pink', color: '#ec4899', name: 'ピンク' },
  { id: 'red', color: '#ef4444', name: 'レッド' },
  { id: 'yellow', color: '#eab308', name: 'イエロー' },
  { id: 'cyan', color: '#06b6d4', name: 'シアン' },
];

const notificationOptions = [
  { value: '', label: 'なし' },
  { value: '0', label: '予定時刻' },
  { value: '5', label: '5分前' },
  { value: '10', label: '10分前' },
  { value: '30', label: '30分前' },
  { value: '60', label: '1時間前' },
  { value: '1440', label: '1日前' },
];

const repeatOptions = [
  { value: '', label: 'しない' },
  { value: 'daily', label: '毎日' },
  { value: 'weekly', label: '毎週' },
  { value: 'monthly', label: '毎月' },
  { value: 'yearly', label: '毎年' },
];

function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addMonths(base: Date, diff: number) {
  return new Date(base.getFullYear(), base.getMonth() + diff, 1);
}

function isSameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeeksInMonth(year: number, monthIndex: number) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  const firstWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  return Math.ceil((firstWeekday + daysInMonth) / 7);
}

function getMonthGrid(year: number, monthIndex: number) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  const cells: Array<{ day: number; date: Date; isCurrentMonth: boolean }> = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push({ day, date: new Date(year, monthIndex - 1, day), isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, monthIndex, d), isCurrentMonth: true });
  }

  const weeksNeeded = getWeeksInMonth(year, monthIndex);
  const totalCells = weeksNeeded * 7;

  let nextDay = 1;
  while (cells.length < totalCells) {
    cells.push({ day: nextDay, date: new Date(year, monthIndex + 1, nextDay), isCurrentMonth: false });
    nextDay++;
  }

  return cells;
}

const initialEvents: EventItem[] = [
  { id: '1', date: '2026-02-10', startTime: '15:00', endTime: '16:00', title: '会社説明会', color: '#FFA52F', eventType: 'intern' },
  { id: '2', date: '2026-02-15', startTime: '10:00', endTime: '11:30', title: '1次面接', color: '#3b82f6', eventType: 'main', companyName: '〇〇株式会社' },
];

export default function Calendar() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return initialEvents;
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [editEvent, setEditEvent] = useState<Partial<EventItem>>({
    title: '',
    date: '',
    startTime: '10:00',
    endTime: '11:00',
    color: '#FFA52F',
    eventType: 'intern',
    companyName: '',
    deadlineDate: '',
    prepDates: [],
    videoUrl: '',
    location: '',
    notification: '',
    repeat: '',
    memo: '',
    isAllDay: false,
  });

  // 企業ページからのプレフィルデータをチェック
  useEffect(() => {
    const prefillData = localStorage.getItem(PREFILL_KEY);
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData);
        const now = new Date();
        const startHour = now.getHours() + 1;
        
        setEditEvent({
          title: data.title || '',
          date: data.date || toISODateLocal(today),
          startTime: data.startTime || `${String(startHour).padStart(2, '0')}:00`,
          endTime: data.endTime || `${String(startHour + 1).padStart(2, '0')}:00`,
          color: data.color || '#FFA52F',
          eventType: data.eventType || 'intern',
          companyName: data.companyName || '',
          deadlineDate: data.deadlineDate || '',
          prepDates: [],
          videoUrl: '',
          location: '',
          notification: '',
          repeat: '',
          memo: data.memo || '',
          isAllDay: false,
        });
        
        localStorage.removeItem(PREFILL_KEY);
        setEditingEventId(null);
        setIsEditModalOpen(true);
      } catch (e) {
        console.error('Prefill data parse error:', e);
        localStorage.removeItem(PREFILL_KEY);
      }
    }
  }, [today]);

  useEffect(() => {
    const handleOpenModal = () => {
      if (selectedDate) {
        openAddModal(selectedDate);
      } else {
        openAddModal(today);
      }
    };

    window.addEventListener('openAddEventModal', handleOpenModal);
    return () => window.removeEventListener('openAddEventModal', handleOpenModal);
  }, [selectedDate, today]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeksInMonth = getWeeksInMonth(year, month);
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    for (const [k, v] of map.entries()) {
      v.sort((a, b) => a.startTime.localeCompare(b.startTime));
      map.set(k, v);
    }
    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(toISODateLocal(selectedDate)) ?? [];
  }, [eventsByDate, selectedDate]);

  const goPrevMonth = () => setViewDate((d) => addMonths(d, -1));
  const goNextMonth = () => setViewDate((d) => addMonths(d, 1));
  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDaySheetOpen(true);
  };

  const openAddModal = (date: Date) => {
    const now = new Date();
    const startHour = now.getHours() + 1;
    setEditEvent({
      title: '',
      date: toISODateLocal(date),
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(startHour + 1).padStart(2, '0')}:00`,
      color: '#FFA52F',
      eventType: 'intern',
      companyName: '',
      deadlineDate: '',
      prepDates: [],
      videoUrl: '',
      location: '',
      notification: '',
      repeat: '',
      memo: '',
      isAllDay: false,
    });
    setEditingEventId(null);
    setIsDaySheetOpen(false);
    setIsEditModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditEvent({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      color: event.color,
      eventType: event.eventType,
      companyName: event.companyName || '',
      deadlineDate: event.deadlineDate || '',
      prepDates: event.prepDates || [],
      videoUrl: event.videoUrl || '',
      location: event.location || '',
      notification: event.notification || '',
      repeat: event.repeat || '',
      memo: event.memo || '',
      isAllDay: event.isAllDay || false,
    });
    setEditingEventId(event.id);
    setIsDaySheetOpen(false);
    setIsEditModalOpen(true);
  };

const handleSaveEvent = () => {
  if (!editEvent.title?.trim()) {
    alert('タイトルを入力してください');
    return;
  }

  const baseId = editingEventId || Date.now().toString();
  const eventDate = editEvent.date || toISODateLocal(new Date());
  
  // メインイベント
  const mainEvent: EventItem = {
    id: baseId,
    title: editEvent.title || '',
    date: eventDate,
    startTime: editEvent.startTime || '09:00',
    endTime: editEvent.endTime || '10:00',
    color: editEvent.color || '#FFA52F',
    eventType: editEvent.eventType || 'intern',
    companyName: editEvent.companyName || '',
    deadlineDate: editEvent.deadlineDate || '',
    prepDates: editEvent.prepDates || [],
    videoUrl: editEvent.videoUrl || '',
    location: editEvent.location || '',
    notification: editEvent.notification || 'none',
    repeat: editEvent.repeat || 'none',
    memo: editEvent.memo || '',
    isAllDay: editEvent.isAllDay || false,
  };

  if (editingEventId) {
    // 編集時：メインイベントのみ更新
    setEvents(prev => prev.map(ev => ev.id === editingEventId ? mainEvent : ev));
  } else {
    // 新規作成時：メイン + 締切 + 対策を追加
    const newEvents: EventItem[] = [mainEvent];

    // 締切日イベントを追加（赤色）
    if (editEvent.deadlineDate) {
      const deadlineEvent: EventItem = {
        id: `${baseId}-deadline`,
        title: `締切：${editEvent.title || ''}`,
        date: editEvent.deadlineDate,
        startTime: '23:59',
        endTime: '23:59',
        color: '#ef4444',
        eventType: editEvent.eventType || 'intern',
        companyName: editEvent.companyName || '',
        isAllDay: true,
        memo: `${editEvent.title || ''}の応募締切日`,
      };
      newEvents.push(deadlineEvent);
    }

    // 選考対策日イベントを追加（黄色）
    if (editEvent.prepDates && editEvent.prepDates.length > 0) {
      editEvent.prepDates.forEach((prepDate, index) => {
        const prepEvent: EventItem = {
          id: `${baseId}-prep-${index}`,
          title: `対策：${editEvent.title || ''}`,
          date: prepDate,
          startTime: '09:00',
          endTime: '10:00',
          color: '#eab308',
          eventType: editEvent.eventType || 'intern',
          companyName: editEvent.companyName || '',
          isAllDay: false,
          memo: `${editEvent.title || ''}の選考対策`,
        };
        newEvents.push(prepEvent);
      });
    }

    setEvents(prev => [...prev, ...newEvents]);
  }

  // モーダルを閉じてリセット
  setIsEditModalOpen(false);
  setEditingEventId(null);
  setEditEvent({
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    color: '#FFA52F',
    eventType: 'intern',
    companyName: '',
    deadlineDate: '',
    prepDates: [],
    videoUrl: '',
    location: '',
    notification: 'none',
    repeat: 'none',
    memo: '',
    isAllDay: false,
  });
};

  const handleDeleteEvent = (id: string) => {
    if (confirm('この予定を削除しますか？')) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setIsEditModalOpen(false);
      setEditingEventId(null);
    }
  };

  const addPrepDate = () => {
    setEditEvent((prev) => ({
      ...prev,
      prepDates: [...(prev.prepDates || []), toISODateLocal(selectedDate || today)],
    }));
  };

  const removePrepDate = (index: number) => {
    setEditEvent((prev) => ({
      ...prev,
      prepDates: (prev.prepDates || []).filter((_, i) => i !== index),
    }));
  };

  const cellHeight = `calc((100vh - 180px) / ${weeksInMonth})`;

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const m = selectedDate.getMonth() + 1;
    const d = selectedDate.getDate();
    const dayOfWeek = dayNames[selectedDate.getDay()];
    return `${m}/${d} (${dayOfWeek}) の予定`;
  };

  return (
    <div className="pt-14 pb-16 bg-white min-h-screen max-w-md mx-auto flex flex-col relative">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button className="flex items-center gap-1">
          <span className="text-lg font-bold">{year}年{month + 1}月</span>
          <ChevronDown size={20} className="text-gray-600" />
        </button>
        <button onClick={goToday} className="px-3 py-1 text-sm border border-gray-300 rounded-full">
          今日
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={goPrevMonth} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button onClick={goNextMonth} className="w-8 h-8 flex items-center justify-center">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map((day, i) => (
          <div key={day} className={`text-center text-sm py-2 font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7">
        {grid.map((cell, idx) => {
          const isToday = isSameYMD(cell.date, today);
          const dateISO = toISODateLocal(cell.date);
          const dayEvents = eventsByDate.get(dateISO) ?? [];
          const dayOfWeek = cell.date.getDay();

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(cell.date)}
              className={`border-b border-r border-gray-100 p-1 text-left flex flex-col overflow-hidden ${!cell.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}`}
              style={{ minHeight: cellHeight }}
            >
              <div className="flex justify-center mb-1">
                <span
                  className={`w-7 h-7 flex items-center justify-center text-sm rounded-full
                    ${isToday ? 'text-white' : ''}
                    ${!isToday && !cell.isCurrentMonth ? 'text-gray-300' : ''}
                    ${!isToday && cell.isCurrentMonth && dayOfWeek === 0 ? 'text-red-500' : ''}
                    ${!isToday && cell.isCurrentMonth && dayOfWeek === 6 ? 'text-blue-500' : ''}
                    ${!isToday && cell.isCurrentMonth && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-gray-800' : ''}
                  `}
                  style={isToday ? { backgroundColor: '#FFA52F' } : {}}
                >
                  {cell.day}
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-[10px] text-white px-1 py-0.5 rounded truncate"
                    style={{ backgroundColor: event.color }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {!isDaySheetOpen && !isEditModalOpen && (
        <button
          onClick={() => {
            setSelectedDate(today);
            setIsDaySheetOpen(true);
          }}
          className="absolute bottom-24 right-4 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center z-40"
          style={{ backgroundColor: '#FFA52F' }}
        >
          <Plus size={28} />
        </button>
      )}

      {isDaySheetOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setIsDaySheetOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-lg font-bold">{formatSelectedDate()}</h2>
              <button
                onClick={() => openAddModal(selectedDate)}
                className="w-10 h-10 text-white rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FFA52F' }}
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedEvents.length === 0 ? (
                <div className="text-center text-gray-400 py-16">予定がありません</div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => openEditModal(event)}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-1 h-full min-h-[40px] rounded-full" style={{ backgroundColor: event.color }} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">
                          {event.isAllDay ? '終日' : `${event.startTime} 〜 ${event.endTime}`}
                        </div>
                        {event.companyName && <div className="text-sm text-gray-500">{event.companyName}</div>}
                        {event.location && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={12} />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <span className="text-orange-500 text-sm">編集</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b">
              <button onClick={() => { setIsEditModalOpen(false); setEditingEventId(null); }} className="text-gray-500">キャンセル</button>
              <span className="font-bold">{editingEventId ? '予定を編集' : '予定を追加'}</span>
              <button onClick={handleSaveEvent} className="text-white px-4 py-1.5 rounded-lg font-bold" style={{ backgroundColor: '#FFA52F' }}>保存</button>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="text"
                placeholder="タイトルを追加"
                value={editEvent.title}
                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                className="w-full text-lg focus:outline-none"
              />
              <button onClick={() => setIsColorPickerOpen(true)} className="flex items-center gap-3 w-full text-left">
                <Palette size={20} style={{ color: '#FFA52F' }} />
                <span className="text-gray-700">予定カラー</span>
                <div className="ml-auto w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: editEvent.color }} />
              </button>
              <div className="flex items-center gap-3">
                <Building2 size={20} style={{ color: '#FFA52F' }} />
                <span className="text-gray-700">イベントタイプ</span>
              </div>
              <div className="flex gap-2 ml-8">
                <button
                  onClick={() => setEditEvent({ ...editEvent, eventType: 'intern' })}
                  className={`flex-1 py-2 rounded-lg border ${editEvent.eventType === 'intern' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-gray-500'}`}
                >
                  インターン
                </button>
                <button
                  onClick={() => setEditEvent({ ...editEvent, eventType: 'main' })}
                  className={`flex-1 py-2 rounded-lg border ${editEvent.eventType === 'main' ? 'bg-purple-50 border-purple-500 text-purple-600' : 'border-gray-200 text-gray-500'}`}
                >
                  本選考
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-gray-400" />
                <span className="text-gray-700">終日</span>
                <button
                  onClick={() => setEditEvent({ ...editEvent, isAllDay: !editEvent.isAllDay })}
                  className="ml-auto w-12 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: editEvent.isAllDay ? '#FFA52F' : '#e5e7eb' }}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editEvent.isAllDay ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {!editEvent.isAllDay && (
                <>
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-gray-400" />
                    <span className="text-gray-700">開始</span>
                    <input
                      type="datetime-local"
                      value={`${editEvent.date}T${editEvent.startTime}`}
                      onChange={(e) => {
                        const [date, time] = e.target.value.split('T');
                        setEditEvent({ ...editEvent, date, startTime: time });
                      }}
                      className="ml-auto border border-gray-200 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-gray-400" />
                    <span className="text-gray-700">終了</span>
                    <input
                      type="datetime-local"
                      value={`${editEvent.date}T${editEvent.endTime}`}
                      onChange={(e) => {
                        const [, time] = e.target.value.split('T');
                        setEditEvent({ ...editEvent, endTime: time });
                      }}
                      className="ml-auto border border-gray-200 rounded-lg p-2 text-sm"
                    />
                  </div>
                </>
              )}
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-blue-500" />
                <span className="text-gray-700">会社名を追加</span>
              </div>
              <input
                type="text"
                placeholder="会社名"
                value={editEvent.companyName}
                onChange={(e) => setEditEvent({ ...editEvent, companyName: e.target.value })}
                className="w-full ml-8 border border-gray-200 rounded-lg p-2 text-sm"
              />
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500" />
                <span className="text-gray-700">応募締切日時を追加</span>
                <button
                  onClick={() => setEditEvent({ ...editEvent, deadlineDate: editEvent.deadlineDate ? '' : toISODateLocal(selectedDate || today) })}
                  className="ml-auto w-12 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: editEvent.deadlineDate ? '#FFA52F' : '#e5e7eb' }}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editEvent.deadlineDate ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {editEvent.deadlineDate && (
                <input
                  type="date"
                  value={editEvent.deadlineDate}
                  onChange={(e) => setEditEvent({ ...editEvent, deadlineDate: e.target.value })}
                  className="w-full ml-8 border border-gray-200 rounded-lg p-2 text-sm"
                />
              )}
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-yellow-500" />
                <span className="text-gray-700">選考対策日時を追加</span>
                <button onClick={addPrepDate} className="ml-auto" style={{ color: '#FFA52F' }}>+</button>
              </div>
              {editEvent.prepDates?.map((date, index) => (
                <div key={index} className="flex items-center gap-2 ml-8">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      const newPrepDates = [...(editEvent.prepDates || [])];
                      newPrepDates[index] = e.target.value;
                      setEditEvent({ ...editEvent, prepDates: newPrepDates });
                    }}
                    className="flex-1 border border-gray-200 rounded-lg p-2 text-sm"
                  />
                  <button onClick={() => removePrepDate(index)} className="text-red-500"><X size={16} /></button>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Video size={20} className="text-blue-500" />
                <span className="text-gray-700">ビデオ会議を追加</span>
              </div>
              <input
                type="url"
                placeholder="URL"
                value={editEvent.videoUrl}
                onChange={(e) => setEditEvent({ ...editEvent, videoUrl: e.target.value })}
                className="w-full ml-8 border border-gray-200 rounded-lg p-2 text-sm"
              />
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-red-500" />
                <span className="text-gray-700">場所を追加</span>
              </div>
              <input
                type="text"
                placeholder="場所"
                value={editEvent.location}
                onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })}
                className="w-full ml-8 border border-gray-200 rounded-lg p-2 text-sm"
              />
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-400" />
                <span className="text-gray-700">通知</span>
                <select
                  value={editEvent.notification}
                  onChange={(e) => setEditEvent({ ...editEvent, notification: e.target.value })}
                  className="ml-auto border border-gray-200 rounded-lg p-2 text-sm"
                >
                  {notificationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <Repeat size={20} className="text-green-500" />
                <span className="text-gray-700">繰り返し</span>
                <select
                  value={editEvent.repeat}
                  onChange={(e) => setEditEvent({ ...editEvent, repeat: e.target.value })}
                  className="ml-auto border border-gray-200 rounded-lg p-2 text-sm"
                >
                  {repeatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-gray-400 mt-1" />
                <span className="text-gray-700">メモ</span>
              </div>
              <textarea
                placeholder="メモを追加"
                value={editEvent.memo}
                onChange={(e) => setEditEvent({ ...editEvent, memo: e.target.value })}
                className="w-full ml-8 border border-gray-200 rounded-lg p-2 text-sm h-24 resize-none"
              />

              {/* 編集モードの場合のみ削除ボタンを表示 */}
              {editingEventId && (
                <button
                  onClick={() => handleDeleteEvent(editingEventId)}
                  className="w-full py-3 text-red-500 border border-red-300 rounded-lg mt-4"
                >
                  この予定を削除
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isColorPickerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">カラーを選択</h3>
              <button onClick={() => setIsColorPickerOpen(false)}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setEditEvent({ ...editEvent, color: preset.color });
                    setIsColorPickerOpen(false);
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${editEvent.color === preset.color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: preset.color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
