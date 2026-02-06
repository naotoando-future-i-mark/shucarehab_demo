import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Event } from '../types/event';
import { ColorPreset, getColorPresets, saveColorPresets } from '../data/colorPresets';
import { Header } from '../components/calendar/Header';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { YearMonthSelector } from '../components/calendar/YearMonthSelector';
import { DayEventsSheet } from '../components/calendar/DayEventsSheet';
import { AddEventModal } from '../components/calendar/AddEventModal';

const STORAGE_KEY = 'shukarehub_events';
const PREFILL_KEY = 'shukarehub_calendar_prefill';

// 初期イベント（新規ユーザー用）
const initialEvents: Event[] = [
  {
    id: '1',
    title: '会社説明会',
    start_at: '2026-02-10T15:00',
    end_at: '2026-02-10T16:00',
    all_day: false,
    color_id: '1',
    event_type: 'intern',
  },
  {
    id: '2',
    title: '1次面接',
    start_at: '2026-02-15T10:00',
    end_at: '2026-02-15T11:30',
    all_day: false,
    color_id: '2',
    event_type: 'fulltime',
    company_name: '〇〇株式会社',
  },
];

export default function Calendar() {
  const today = useMemo(() => new Date(), []);
  
  // 状態管理
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [colorPresets, setColorPresets] = useState<ColorPreset[]>(() => getColorPresets());
  
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialEvents;
      }
    }
    return initialEvents;
  });

  // モーダル状態
  const [isYearMonthSelectorOpen, setIsYearMonthSelectorOpen] = useState(false);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  // イベントを localStorage に保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  // カラープリセットを localStorage に保存
  useEffect(() => {
    saveColorPresets(colorPresets);
  }, [colorPresets]);

  // プレフィルデータをチェック（企業ページからの遷移）
  useEffect(() => {
    const prefillData = localStorage.getItem(PREFILL_KEY);
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData);

        let startAt: string;
        let endAt: string;
        let allDay = false;

        if (data.date && data.startTime) {
          startAt = `${data.date}T${data.startTime}`;
          endAt = data.endDate && data.endTime
            ? `${data.endDate}T${data.endTime}`
            : `${data.date}T${data.startTime}`;
        } else if (data.date) {
          startAt = `${data.date}T00:00`;
          endAt = `${data.endDate || data.date}T23:59`;
          allDay = true;
        } else {
          const now = new Date();
          const startHour = now.getHours() + 1;
          const start = new Date();
          start.setHours(startHour, 0, 0, 0);
          const end = new Date(start);
          end.setHours(end.getHours() + 1);

          const formatDateTime = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          };

          startAt = formatDateTime(start);
          endAt = formatDateTime(end);
        }

        const prefillEvent: Event = {
          id: '',
          title: data.title || '',
          start_at: startAt,
          end_at: endAt,
          all_day: allDay,
          color_id: colorPresets[0]?.id || '1',
          event_type: data.eventType || 'intern',
          company_name: data.companyName || '',
          deadline_at: data.deadlineDate || undefined,
          memo: data.memo || '',
        };

        setEditingEvent(prefillEvent);
        setIsAddModalOpen(true);
        localStorage.removeItem(PREFILL_KEY);
      } catch (e) {
        console.error('Prefill data parse error:', e);
        localStorage.removeItem(PREFILL_KEY);
      }
    }
  }, [colorPresets]);

  // FAB からの予定追加イベント
  useEffect(() => {
    const handleOpenModal = () => {
      setEditingEvent(undefined);
      setSelectedDate(selectedDate || today);
      setIsAddModalOpen(true);
    };

    window.addEventListener('openAddEventModal', handleOpenModal);
    return () => window.removeEventListener('openAddEventModal', handleOpenModal);
  }, [selectedDate, today]);

  // カラーマップを作成
  const colorMap = useMemo(() => {
    const map: Record<string, { color: string; label: string }> = {};
    colorPresets.forEach(p => {
      map[p.id] = { color: p.color, label: p.label };
      map[p.color] = { color: p.color, label: p.label }; // 旧データ互換
    });
    return map;
  }, [colorPresets]);

  // カラーマップ（色のみ）- CalendarGrid 用
  const colorMapSimple = useMemo(() => {
    const map: Record<string, string> = {};
    colorPresets.forEach(p => {
      map[p.id] = p.color;
      map[p.color] = p.color;
    });
    return map;
  }, [colorPresets]);

  // ハンドラー
  const handleTodayClick = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDaySheetOpen(true);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleYearMonthSelect = (date: Date) => {
    setCurrentDate(date);
  };

  const handleAddEvent = () => {
    setEditingEvent(undefined);
    setIsDaySheetOpen(false);
    setIsAddModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    // 締切・対策イベントの場合は元のイベントを探す
    if (event.id.startsWith('prep-') || event.id.startsWith('deadline-')) {
      const originalId = event.id.replace(/^(prep-|deadline-)/, '').split('-')[0];
      const originalEvent = events.find(e => e.id === originalId || event.id.includes(e.id));
      if (originalEvent) {
        setEditingEvent(originalEvent);
      } else {
        setEditingEvent(event);
      }
    } else {
      setEditingEvent(event);
    }
    setIsDaySheetOpen(false);
    setIsAddModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const handleUpdateEvent = (event: Event) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
  };

  const handleDeleteEvent = (eventId: string) => {
    // 関連イベント（締切・対策）も削除
    setEvents(prev => prev.filter(e => {
      if (e.id === eventId) return false;
      // 旧形式の関連イベントも削除
      if (e.id.startsWith(`${eventId}-deadline`) || e.id.startsWith(`${eventId}-prep`)) return false;
      return true;
    }));
  };

  const handleUpdateColorPresets = (presets: ColorPreset[]) => {
    setColorPresets(presets);
  };

  return (
    <div className="pt-0 pb-16 bg-white min-h-screen max-w-md mx-auto flex flex-col relative">
      {/* ヘッダー */}
      <Header
        currentDate={currentDate}
        onTodayClick={handleTodayClick}
        onYearMonthClick={() => setIsYearMonthSelectorOpen(true)}
      />

      {/* カレンダーグリッド */}
      <div className="flex-1 min-h-0 h-[calc(100vh-120px)]">
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          events={events}
          colorMap={colorMapSimple}
        />
      </div>

      {/* FAB（予定追加ボタン） */}
      {!isDaySheetOpen && !isAddModalOpen && (
        <button
          onClick={() => {
            setSelectedDate(today);
            handleAddEvent();
          }}
          className="absolute bottom-20 right-4 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center z-40 bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] hover:shadow-xl transition-shadow"
        >
          <Plus size={28} />
        </button>
      )}

      {/* 年月選択モーダル */}
      <YearMonthSelector
        isOpen={isYearMonthSelectorOpen}
        onClose={() => setIsYearMonthSelectorOpen(false)}
        currentDate={currentDate}
        onSelectDate={handleYearMonthSelect}
      />

      {/* 日付イベントシート */}
      <DayEventsSheet
        isOpen={isDaySheetOpen}
        onClose={() => setIsDaySheetOpen(false)}
        selectedDate={selectedDate}
        events={events}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
        colorMap={colorMap}
      />

      {/* 予定追加/編集モーダル */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingEvent(undefined);
        }}
        onSave={handleSaveEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedDate || today}
        editingEvent={editingEvent}
        colorPresets={colorPresets}
        onUpdateColorPresets={handleUpdateColorPresets}
      />
    </div>
  );
}
