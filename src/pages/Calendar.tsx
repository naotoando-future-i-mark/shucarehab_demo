import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';

type EventItem = {
  id: number;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  location?: string;
  colorClass: string; // tailwind class
};

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
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
  const firstWeekday = firstDayOfMonth.getDay(); // 0..6
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: Array<{ day: number | null; date?: Date }> = [];

  // 前の月の空白
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null });
  }

  // 当月の日付
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, monthIndex, d) });
  }

  // 行を揃える（最終週の空白埋め）
  while (cells.length % 7 !== 0) {
    cells.push({ day: null });
  }

  return cells;
}

const dummyEvents: EventItem[] = [
  // 今日に寄せて表示されるように、後で「今日」基準で差し替えたい場合はここを動的生成でもOK
  { id: 1, date: '2026-01-09', time: '10:00', title: '〇〇株式会社 会社説明会', location: 'オンライン', colorClass: 'bg-blue-500' },
  { id: 2, date: '2026-01-09', time: '14:00', title: '△△商事 1次面接', location: '東京本社', colorClass: 'bg-purple-500' },
  { id: 3, date: '2026-01-10', time: '16:30', title: 'ES提出締切', location: '', colorClass: 'bg-orange-500' },
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
    // 同日内を時間順に
    for (const [k, v] of map.entries()) {
      v.sort((a, b) => a.time.localeCompare(b.time));
      map.set(k, v);
    }
    return map;
  }, []);

  const selectedEvents = useMemo(() => {
    return eventsByDate.get(selectedISO) ?? [];
  }, [eventsByDate, selectedISO]);

  const goPrevMonth = () => setViewDate((d) => addMonths(d, -1));
  const goNextMonth = () => setViewDate((d) => addMonths(d, 1));
  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* ヘッダー（カレンダー） */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {year}年 {monthNames[month]}
              </h1>
              <button onClick={goToday} className="mt-1 text-xs text-gray-500 hover:text-gray-700">
                今日へ戻る
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={goPrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                aria-label="previous month"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button
                onClick={goNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
                aria-label="next month"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* 曜日 */}
          <div className="grid grid-cols-7 gap-1 mt-4">
            {dayNames.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-semibold py-2 ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, idx) => {
              const d = cell.date;
              const isToday = d ? isSameYMD(d, today) : false;
              const isSelected = d ? isSameYMD(d, selectedDate) : false;

              const hasEvents = d ? (eventsByDate.get(toISODateLocal(d))?.length ?? 0) > 0 : false;

              return (
                <button
                  key={idx}
                  disabled={!d}
                  onClick={() => d && setSelectedDate(d)}
                  className={[
                    'aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition',
                    d ? 'hover:bg-gray-100 active:bg-gray-200' : 'cursor-default',
                    isSelected ? 'bg-blue-600 text-white font-bold hover:bg-blue-600 active:bg-blue-700' : 'text-gray-800',
                    !isSelected && isToday ? 'ring-2 ring-blue-200' : '',
                  ].join(' ')}
                  aria-label={d ? toISODateLocal(d) : 'empty'}
                >
                  <div className="leading-none">{cell.day ?? ''}</div>
                  {/* 予定ドット */}
                  {d && !isSelected && hasEvents && (
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                  )}
                  {d && isSelected && hasEvents && (
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-white/80" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 予定リスト */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">予定</h2>
            <div className="text-sm text-gray-500">{selectedISO}</div>
          </div>
          {/* 将来：ここに「＋追加」ボタン置いても良い */}
        </div>

        {selectedEvents.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
            <div className="text-gray-900 font-semibold">この日の予定はまだないよ</div>
            <div className="text-sm text-gray-500 mt-2">MVPでは、予定の追加は後でOK！</div>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex gap-3">
                  <div className={`w-1 ${event.colorClass} rounded-full`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">{event.time}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>

                    {!!event.location && (
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
