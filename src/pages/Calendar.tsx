import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

type EventItem = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  colorClass: string;
};

const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

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

function getMonthGrid(year: number, monthIndex: number) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  
  // 前月の日数
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  const cells: Array<{ day: number; date: Date; isCurrentMonth: boolean }> = [];

  // 前月の日付
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push({ 
      day, 
      date: new Date(year, monthIndex - 1, day),
      isCurrentMonth: false 
    });
  }

  // 当月の日付
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ 
      day: d, 
      date: new Date(year, monthIndex, d),
      isCurrentMonth: true 
    });
  }

  // 次月の日付（6行になるまで）
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ 
      day: nextDay, 
      date: new Date(year, monthIndex + 1, nextDay),
      isCurrentMonth: false 
    });
    nextDay++;
  }

  return cells;
}

const dummyEvents: EventItem[] = [
  { id: 1, date: '2026-01-20', startTime: '15:00', endTime: '16:00', title: 'テスト', colorClass: 'bg-orange-500' },
  { id: 2, date: '2026-01-09', startTime: '10:00', endTime: '11:30', title: '〇〇株式会社 会社説明会', colorClass: 'bg-blue-500' },
  { id: 3, date: '2026-01-09', startTime: '14:00', endTime: '15:00', title: '△△商事 1次面接', colorClass: 'bg-purple-500' },
];

export default function Calendar() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const selectedISO = useMemo(() => toISODateLocal(selectedDate), [selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of dummyEvents) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    for (const [k, v] of map.entries()) {
      v.sort((a, b) => a.startTime.localeCompare(b.startTime));
      map.set(k, v);
    }
    return map;
  }, []);

  const selectedEvents = useMemo(() => {
    return eventsByDate.get(selectedISO) ?? [];
  }, [eventsByDate, selectedISO]);

  const goPrevMonth = () => setViewDate((d) => addMonths(d, -1));
  const goNextMonth = () => setViewDate((d) => addMonths(d, 1));

  // 選択日の曜日を取得
  const selectedDayOfWeek = dayNames[selectedDate.getDay()];

  return (
    <div className="pt-14 pb-20 bg-white min-h-screen max-w-md mx-auto">
      {/* 月選択ヘッダー */}
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="bg-gray-100 rounded-lg px-3 py-1.5 text-sm font-medium">
          {year}年{month + 1}月
        </div>
        <button
          onClick={goPrevMonth}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <button
          onClick={goNextMonth}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg"
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map((day, i) => (
          <div
            key={day}
            className={`text-center text-sm py-2 ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7">
        {grid.map((cell, idx) => {
          const isToday = isSameYMD(cell.date, today);
          const isSelected = isSameYMD(cell.date, selectedDate);
          const dateISO = toISODateLocal(cell.date);
          const dayEvents = eventsByDate.get(dateISO) ?? [];
          const dayOfWeek = cell.date.getDay();

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(cell.date)}
              className={`
                min-h-[72px] border-b border-r border-gray-100 p-1 text-left flex flex-col
                ${!cell.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
              `}
            >
              {/* 日付 */}
              <div className="flex justify-center mb-1">
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center text-sm rounded-full
                    ${isSelected ? 'bg-orange-500 text-white' : ''}
                    ${!isSelected && isToday ? 'bg-orange-100 text-orange-600' : ''}
                    ${!isSelected && !isToday && !cell.isCurrentMonth ? 'text-gray-300' : ''}
                    ${!isSelected && !isToday && cell.isCurrentMonth && dayOfWeek === 0 ? 'text-red-500' : ''}
                    ${!isSelected && !isToday && cell.isCurrentMonth && dayOfWeek === 6 ? 'text-blue-500' : ''}
                    ${!isSelected && !isToday && cell.isCurrentMonth && dayOfWeek !== 0 && dayOfWeek !== 6 ? 'text-gray-800' : ''}
                  `}
                >
                  {cell.day}
                </span>
              </div>

              {/* イベント表示 */}
              {dayEvents.length > 0 && (
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-[10px] text-white px-1 py-0.5 rounded truncate ${event.colorClass}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-gray-500 px-1">
                      +{dayEvents.length - 2}件
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 選択日の予定 */}
      <div className="bg-gray-50 mt-2">
        {/* 日付ヘッダー */}
        <div className="px-4 py-3 bg-gray-100 flex items-center gap-2">
          <span className="text-sm text-blue-600 font-medium">当日</span>
          <span className="text-sm text-gray-700">
            {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日({selectedDayOfWeek})
          </span>
        </div>

        {/* 予定リスト */}
        <div className="px-4 py-2">
          {selectedEvents.length === 0 ? (
            <div className="py-4 text-center text-gray-400 text-sm">
              予定はありません
            </div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 py-2">
                  <div className="text-sm text-gray-500 w-24 flex-shrink-0">
                    {event.startTime} 〜 {event.endTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-4 rounded-full ${event.colorClass}`} />
                    <span className="text-sm text-gray-800">{event.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
