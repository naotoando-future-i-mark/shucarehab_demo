import { useState } from 'react';
import { AlertCircle, ClipboardCheck } from 'lucide-react';
import { Event } from '../../types/event';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  events: Event[];
  colorMap: Record<string, string>;
}

export const CalendarGrid = ({ 
  currentDate, 
  selectedDate, 
  onDateSelect, 
  onMonthChange, 
  events, 
  colorMap 
}: CalendarGridProps) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const totalWeeks = Math.ceil((startDay + daysInMonth) / 7);
  const maxEventsPerDay = totalWeeks >= 6 ? 4 : totalWeeks === 5 ? 5 : 6;

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

  // 指定日のイベントを取得
  const getEventsForDate = (date: Date) => {
    const mainEvents = events.filter(event => {
      const eventDate = new Date(event.start_at);
      const isOnDate = eventDate.getFullYear() === date.getFullYear() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getDate() === date.getDate();

      if (isOnDate) return true;
      return isRecurringEventOnDate(event, date);
    });

    const additionalEvents: Array<Event & { isPrepDate?: boolean; isDeadline?: boolean }> = [];

    events.forEach(event => {
      // 対策日を追加
      if (event.preparation_dates && event.preparation_dates.length > 0) {
        event.preparation_dates.forEach(prepDate => {
          const prepDateTime = new Date(prepDate.date);
          if (prepDateTime.getFullYear() === date.getFullYear() &&
              prepDateTime.getMonth() === date.getMonth() &&
              prepDateTime.getDate() === date.getDate()) {
            additionalEvents.push({
              ...event,
              id: `prep-${prepDate.id}`,
              title: prepDate.title || event.title,
              start_at: prepDate.date,
              end_at: prepDate.date,
              all_day: false,
              isPrepDate: true,
            });
          }
        });
      }

      // 締切日を追加
      if (event.deadline_at) {
        const deadlineDate = new Date(event.deadline_at);
        if (deadlineDate.getFullYear() === date.getFullYear() &&
            deadlineDate.getMonth() === date.getMonth() &&
            deadlineDate.getDate() === date.getDate()) {
          additionalEvents.push({
            ...event,
            id: `deadline-${event.id}`,
            title: event.title,
            start_at: event.deadline_at,
            end_at: event.deadline_at,
            all_day: true,
            isDeadline: true,
          });
        }
      }
    });

    return [...mainEvents, ...additionalEvents].sort((a, b) => {
      if (a.all_day && !b.all_day) return -1;
      if (!a.all_day && b.all_day) return 1;
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    });
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getFullYear() === selectedDate.getFullYear() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getDate() === selectedDate.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  // スワイプ処理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        onMonthChange(new Date(year, month + 1, 1));
      } else {
        onMonthChange(new Date(year, month - 1, 1));
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // カレンダー日付セルを描画
  const renderCalendarDays = () => {
    const days = [];

    // 前月の日付
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      days.push(
        <div key={`prev-${day}`} className="p-1.5 bg-gray-50">
          <span className="text-[9px] text-gray-300">{day}</span>
        </div>
      );
    }

    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const selected = isSelected(date);
      const today = isToday(date);
      const dayEvents = getEventsForDate(date);
      const displayEvents = dayEvents.slice(0, maxEventsPerDay);
      const hasMore = dayEvents.length > maxEventsPerDay;

      let textColor = 'text-gray-500';
      if (dayOfWeek === 0) textColor = 'text-red-500';
      if (dayOfWeek === 6) textColor = 'text-blue-500';
      if (selected && !today) textColor = 'text-[#FFA52F]';

      days.push(
        <button
          key={`current-${day}`}
          onClick={() => onDateSelect(date)}
          className={`pt-1.5 px-0.5 pb-0.5 flex flex-col items-start border-t border-b border-gray-100 transition-colors ${
            selected ? 'bg-gray-100' : 'bg-white'
          } hover:bg-gray-50`}
        >
          <div className="w-full flex items-center justify-center mb-0.5 relative">
            {today ? (
              <span className="text-[10px] font-semibold flex items-center justify-center w-4 h-4 rounded-full bg-[#FFA52F] text-white">
                {day}
              </span>
            ) : (
              <span className={`text-[10px] ${textColor} ${selected ? 'font-semibold' : ''}`}>{day}</span>
            )}
            {hasMore && (
              <span className="absolute right-0 text-[7px] text-gray-500">
                +{dayEvents.length - maxEventsPerDay}
              </span>
            )}
          </div>
          <div className="w-full space-y-0.5 overflow-hidden">
            {displayEvents.map((event) => {
              const eventWithFlags = event as Event & { isPrepDate?: boolean; isDeadline?: boolean };

              let backgroundColor: string;
              let eventTextColor: string;

              if (eventWithFlags.isDeadline) {
                backgroundColor = 'transparent';
                eventTextColor = '#EF4444';
              } else if (eventWithFlags.isPrepDate) {
                backgroundColor = 'transparent';
                eventTextColor = '#FFA52F';
              } else {
                const eventColor = colorMap[event.color_id] || '#9E9E9E';
                backgroundColor = `${eventColor}20`;
                eventTextColor = eventColor;
              }

              return (
                <div
                  key={event.id}
                  className="w-full text-left px-px py-0.5 rounded text-[7px] leading-tight overflow-hidden flex items-center gap-0.5"
                  style={{ backgroundColor, color: eventTextColor }}
                >
                  {eventWithFlags.isDeadline && <AlertCircle size={8} className="flex-shrink-0" />}
                  {eventWithFlags.isPrepDate && <ClipboardCheck size={8} className="flex-shrink-0" />}
                  <span className="font-bold whitespace-nowrap overflow-hidden">{event.title}</span>
                </div>
              );
            })}
          </div>
        </button>
      );
    }

    // 翌月の日付
    const totalCells = startDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div key={`next-${day}`} className="p-1.5 bg-gray-50 border-t border-b border-gray-100">
          <span className="text-[9px] text-gray-300">{day}</span>
        </div>
      );
    }

    return days;
  };

  return (
    <div
  className="bg-white flex flex-col"
  style={{ height: 'calc(100vh - 120px)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-[10px] font-medium pb-0.5 px-2 border-b border-gray-200 ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div 
        className="grid grid-cols-7 flex-1" 
        style={{ gridTemplateRows: `repeat(${totalWeeks}, 1fr)` }}
      >
        {renderCalendarDays()}
      </div>
    </div>
  );
};
