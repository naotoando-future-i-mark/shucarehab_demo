import { useState } from 'react';
import { Plus, AlertCircle, ClipboardCheck } from 'lucide-react';
import { Event } from '../../types/event';

interface DayEventsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddEvent: () => void;
  colorMap: Record<string, { color: string; label: string }>;
}

export const DayEventsSheet = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  events, 
  onEventClick, 
  onAddEvent, 
  colorMap 
}: DayEventsSheetProps) => {
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);

  if (!isOpen || !selectedDate) return null;

  // 繰り返しイベントが指定日に該当するかチェック
  const isRecurringEventOnDate = (event: Event, date: Date): boolean => {
    if (!event.recurrence_type || event.recurrence_type === 'none') {
      return false;
    }

    const eventStart = new Date(event.start_at);
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());

    if (checkDate < eventStartDate) return false;

    if (event.recurrence_end_type === 'date' && event.recurrence_end_date) {
      const endDate = new Date(event.recurrence_end_date);
      if (checkDate > endDate) return false;
    }

    const daysDiff = Math.floor((checkDate.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24));

    if (event.recurrence_type === 'daily') {
      return daysDiff % (event.recurrence_interval || 1) === 0;
    }

    if (event.recurrence_type === 'weekly') {
      const weeksDiff = Math.floor(daysDiff / 7);
      if (weeksDiff % (event.recurrence_interval || 1) !== 0) return false;
      return checkDate.getDay() === eventStart.getDay();
    }

    if (event.recurrence_type === 'monthly') {
      const monthsDiff = (checkDate.getFullYear() - eventStartDate.getFullYear()) * 12 +
                         (checkDate.getMonth() - eventStartDate.getMonth());
      if (monthsDiff % (event.recurrence_interval || 1) !== 0) return false;
      return checkDate.getDate() === eventStartDate.getDate();
    }

    if (event.recurrence_type === 'yearly') {
      const yearsDiff = checkDate.getFullYear() - eventStartDate.getFullYear();
      if (yearsDiff % (event.recurrence_interval || 1) !== 0) return false;
      return checkDate.getMonth() === eventStartDate.getMonth() &&
             checkDate.getDate() === eventStartDate.getDate();
    }

    return false;
  };

  // メインイベントを取得
  const mainEvents = events.filter(event => {
    const eventDate = new Date(event.start_at);
    const isOnDate = eventDate.getFullYear() === selectedDate.getFullYear() &&
           eventDate.getMonth() === selectedDate.getMonth() &&
           eventDate.getDate() === selectedDate.getDate();

    if (isOnDate) return true;
    return isRecurringEventOnDate(event, selectedDate);
  });

  // 追加イベント（締切・対策日）を取得
  const additionalEvents: Array<Event & { isPrepDate?: boolean; isDeadline?: boolean; originalId?: string }> = [];
  
  events.forEach(event => {
    // 対策日
    if (event.preparation_dates && event.preparation_dates.length > 0) {
      event.preparation_dates.forEach(prepDate => {
        const prepDateTime = new Date(prepDate.date);
        if (prepDateTime.getFullYear() === selectedDate.getFullYear() &&
            prepDateTime.getMonth() === selectedDate.getMonth() &&
            prepDateTime.getDate() === selectedDate.getDate()) {
          additionalEvents.push({
            ...event,
            id: `prep-${prepDate.id}`,
            originalId: event.id,
            title: prepDate.title || event.title,
            start_at: prepDate.date,
            end_at: prepDate.date,
            all_day: false,
            isPrepDate: true,
          });
        }
      });
    }

    // 締切日
    if (event.deadline_at) {
      const deadlineDate = new Date(event.deadline_at);
      if (deadlineDate.getFullYear() === selectedDate.getFullYear() &&
          deadlineDate.getMonth() === selectedDate.getMonth() &&
          deadlineDate.getDate() === selectedDate.getDate()) {
        additionalEvents.push({
          ...event,
          id: `deadline-${event.id}`,
          originalId: event.id,
          title: event.title,
          start_at: event.deadline_at,
          end_at: event.deadline_at,
          all_day: true,
          isDeadline: true,
        });
      }
    }
  });

  // 全イベントをソート
  const filteredEvents = [...mainEvents, ...additionalEvents].sort((a, b) => {
    if (a.all_day && !b.all_day) return -1;
    if (!a.all_day && b.all_day) return 1;
    return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
  });

  // 日付タイトルをフォーマット
  const formatDateTitle = () => {
    const month = selectedDate.getMonth() + 1;
    const date = selectedDate.getDate();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const day = days[selectedDate.getDay()];
    return `${month}/${date} (${day}) の予定`;
  };

  // 開始時刻をフォーマット
  const formatStartTime = (event: Event) => {
    if (event.all_day) return '終日';
    const start = new Date(event.start_at);
    return `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  };

  // 終了時刻をフォーマット
  const formatEndTime = (event: Event) => {
    if (event.all_day) return null;
    const end = new Date(event.end_at);
    return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  };

  // ドラッグで閉じる処理
  const handleTouchStart = (e: React.TouchEvent) => setStartY(e.touches[0].clientY);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY !== null) {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 0) setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentY !== null && currentY > 100) {
      handleClose();
    } else {
      setCurrentY(null);
    }
    setStartY(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => setStartY(e.clientY);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startY !== null) {
      const deltaY = e.clientY - startY;
      if (deltaY > 0) setCurrentY(deltaY);
    }
  };

  const handleMouseUp = () => {
    if (currentY !== null && currentY > 100) {
      handleClose();
    } else {
      setCurrentY(null);
    }
    setStartY(null);
  };

  const handleClose = () => {
    setStartY(null);
    setCurrentY(null);
    onClose();
  };

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-30" onClick={handleClose} />
      
      {/* シート */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl h-[70vh] flex flex-col transition-transform"
        style={{ transform: currentY ? `translateY(${currentY}px)` : 'translateY(0)' }}
      >
        {/* ヘッダー（ドラッグ可能） */}
        <div
          className="px-6 pt-3 pb-5 border-b border-gray-100 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={startY !== null ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">{formatDateTitle()}</h3>
            <button
              onClick={onAddEvent}
              className="p-1.5 bg-[#FFA52F] rounded-full text-white hover:bg-[#FF9520] transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* イベント一覧 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400">予定がありません</p>
            </div>
          ) : (
            <div>
              {filteredEvents.map((event, index) => {
                const prevEvent = index > 0 ? filteredEvents[index - 1] : null;
                const showDivider = prevEvent && prevEvent.all_day && !event.all_day;
                const eventWithFlags = event as Event & { isDeadline?: boolean; isPrepDate?: boolean };

                return (
                  <div key={event.id}>
                    {showDivider && <div className="my-3 border-t border-gray-200" />}
                    <button
                      onClick={() => onEventClick(event)}
                      className="w-full flex items-start gap-3 p-2.5 hover:bg-gray-50 transition-colors text-left rounded-lg"
                    >
                      {/* 時刻 */}
                      <div className="flex flex-col min-w-[52px]">
                        <span className="text-sm font-medium text-gray-800">{formatStartTime(event)}</span>
                        {formatEndTime(event) && (
                          <span className="text-[11px] text-gray-400">-{formatEndTime(event)}</span>
                        )}
                      </div>

                      {/* カラーバー */}
                      <div
                        className="w-1 self-stretch rounded-full my-1"
                        style={{
                          backgroundColor: eventWithFlags.isDeadline
                            ? '#EF4444'
                            : eventWithFlags.isPrepDate
                            ? '#FFA52F'
                            : colorMap[event.color_id]?.color || '#9E9E9E'
                        }}
                      />

                      {/* イベント情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {eventWithFlags.isDeadline && (
                            <AlertCircle size={16} className="text-[#EF4444] flex-shrink-0" />
                          )}
                          {eventWithFlags.isPrepDate && (
                            <ClipboardCheck size={16} className="text-[#FFA52F] flex-shrink-0" />
                          )}
                          <p className="font-bold text-gray-900 text-sm">{event.title}</p>
                        </div>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-white text-[10px] font-medium"
                          style={{
                            backgroundColor: eventWithFlags.isDeadline
                              ? '#EF4444'
                              : eventWithFlags.isPrepDate
                              ? '#FFA52F'
                              : colorMap[event.color_id]?.color || '#9E9E9E'
                          }}
                        >
                          {eventWithFlags.isDeadline
                            ? '締切'
                            : eventWithFlags.isPrepDate
                            ? '対策'
                            : colorMap[event.color_id]?.label || '予定'}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
