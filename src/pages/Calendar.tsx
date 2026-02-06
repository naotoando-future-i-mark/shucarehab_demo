import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Event } from '../types/event';
import { ColorPreset } from '../data/colorPresets';
import { Header } from '../components/calendar/Header';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { YearMonthSelector } from '../components/calendar/YearMonthSelector';
import { DayEventsSheet } from '../components/calendar/DayEventsSheet';
import { AddEventModal } from '../components/calendar/AddEventModal';
import { supabase, getCurrentUserId } from '../lib/supabase';

const PREFILL_KEY = 'shukarehub_calendar_prefill';

export default function Calendar() {
  const today = useMemo(() => new Date(), []);

  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [colorPresets, setColorPresets] = useState<ColorPreset[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [isYearMonthSelectorOpen, setIsYearMonthSelectorOpen] = useState(false);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const [eventsResult, presetsResult] = await Promise.all([
        supabase.from('events').select('*').eq('user_id', userId).order('start_at', { ascending: true }),
        supabase.from('color_presets').select('*').eq('user_id', userId).order('order_index', { ascending: true }),
      ]);

      if (eventsResult.data) {
        setEvents(eventsResult.data);
      }

      if (presetsResult.data && presetsResult.data.length > 0) {
        setColorPresets(presetsResult.data);
      } else {
        await initializeDefaultColorPresets(userId);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultColorPresets = async (userId: string) => {
    const defaultPresets: Omit<ColorPreset, 'id' | 'created_at' | 'updated_at'>[] = [
      { user_id: userId, label: 'インターン', color: '#FF6B6B', order_index: 0 },
      { user_id: userId, label: '本選考', color: '#4ECDC4', order_index: 1 },
      { user_id: userId, label: '締切', color: '#FFD93D', order_index: 2 },
      { user_id: userId, label: '対策', color: '#95E1D3', order_index: 3 },
      { user_id: userId, label: 'その他', color: '#A8DADC', order_index: 4 },
    ];

    const { data, error } = await supabase.from('color_presets').insert(defaultPresets).select();

    if (error) {
      console.error('Error initializing color presets:', error);
    } else if (data) {
      setColorPresets(data);
    }
  };

  // プレフィルデータをチェック（企業ページからの遷移）
  useEffect(() => {
    const prefillData = localStorage.getItem(PREFILL_KEY);
    console.log('Checking prefill data:', prefillData);

    if (prefillData) {
      try {
        const data = JSON.parse(prefillData);
        console.log('Parsed prefill data:', data);

        let startAt: string;
        let endAt: string;
        let allDay = false;

        if (data.date && data.startTime) {
          startAt = `${data.date}T${data.startTime}`;
          endAt = data.endDate && data.endTime
            ? `${data.endDate}T${data.endTime}`
            : `${data.date}T${data.startTime}`;
          console.log('Using schedule date/time:', { startAt, endAt });
        } else if (data.date) {
          startAt = `${data.date}T00:00`;
          endAt = `${data.endDate || data.date}T23:59`;
          allDay = true;
          console.log('Using all-day event:', { startAt, endAt });
        } else if (data.deadlineDate) {
          startAt = `${data.deadlineDate}T00:00`;
          endAt = `${data.deadlineDate}T23:59`;
          allDay = true;
          console.log('Using deadline date:', { startAt, endAt });
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
          console.log('Using default date/time:', { startAt, endAt });
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

        console.log('Created prefill event:', prefillEvent);
        setEditingEvent(prefillEvent);
        setIsAddModalOpen(true);
        localStorage.removeItem(PREFILL_KEY);
      } catch (e) {
        console.error('Prefill data parse error:', e);
        localStorage.removeItem(PREFILL_KEY);
      }
    }
  }, []);

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

  const handleSaveEvent = async (eventData: Omit<Event, 'id'>) => {
    console.log('handleSaveEvent called with:', eventData);

    try {
      const userId = await getCurrentUserId();
      console.log('Current user ID:', userId);

      if (!userId) {
        alert('ログインしていません。ログインしてください。');
        return;
      }

      const insertData = { ...eventData, user_id: userId };
      console.log('Inserting event data to Supabase:', insertData);

      const { data, error } = await supabase
        .from('events')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('Event saved successfully:', data);

      if (data) {
        setEvents(prev => [...prev, data]);
        alert('予定を保存しました！');
      }
    } catch (error: any) {
      console.error('Error saving event:', error);
      alert(`イベントの保存に失敗しました: ${error.message || 'エラーが発生しました'}\n\nコンソールを確認してください。`);
    }
  };

  const handleUpdateEvent = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(event)
        .eq('id', event.id);

      if (error) throw error;

      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    } catch (error) {
      console.error('Error updating event:', error);
      alert('イベントの更新に失敗しました');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(e => {
        if (e.id === eventId) return false;
        if (e.id.startsWith(`${eventId}-deadline`) || e.id.startsWith(`${eventId}-prep`)) return false;
        return true;
      }));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('イベントの削除に失敗しました');
    }
  };

  const handleUpdateColorPresets = async (presets: ColorPreset[]) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      await supabase.from('color_presets').delete().eq('user_id', userId);

      const presetsWithOrder = presets.map((preset, index) => ({
        ...preset,
        order_index: index,
        user_id: userId,
      }));

      const { data, error } = await supabase
        .from('color_presets')
        .insert(presetsWithOrder)
        .select();

      if (error) throw error;

      if (data) {
        setColorPresets(data);
      }
    } catch (error) {
      console.error('Error updating color presets:', error);
      alert('カラープリセットの更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

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
