import { useState, useEffect } from 'react';
import { Palette, Clock, Building2, AlertCircle, Video, MapPin, Plus, Trash2, Repeat, FileText, Bell, Briefcase } from 'lucide-react';
import { Event, NotificationConfig } from '../../types/event';
import { ColorPreset } from '../../data/colorPresets';
import { ColorPickerModal } from './ColorPickerModal';
import { RecurrenceModal, RecurrenceConfig } from './RecurrenceModal';
import { NotificationModal } from './NotificationModal';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id'>) => void;
  onUpdate?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  initialDate?: Date;
  editingEvent?: Event;
  colorPresets: ColorPreset[];
  onUpdateColorPresets: (presets: ColorPreset[]) => void;
}

export const AddEventModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onUpdate,
  onDelete,
  initialDate, 
  editingEvent,
  colorPresets,
  onUpdateColorPresets,
}: AddEventModalProps) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'intern' | 'fulltime' | ''>('');
  const [colorId, setColorId] = useState<string>('');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState('');
  const [preparationDates, setPreparationDates] = useState<Array<{ date: string; end_date?: string; title: string }>>([]);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('');
  const [memo, setMemo] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({ type: 'none', interval: 1, endType: 'never' });
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    console.log('AddEventModal useEffect - editingEvent:', editingEvent, 'isOpen:', isOpen);
    if (editingEvent) {
      console.log('Loading editing event data:', editingEvent);
      setTitle(editingEvent.title);
      setEventType(editingEvent.event_type || '');
      setColorId(editingEvent.color_id);
      setAllDay(editingEvent.all_day);

      if (editingEvent.all_day) {
        setStartDate(editingEvent.start_at.split('T')[0]);
        setEndDate(editingEvent.end_at.split('T')[0]);
      } else {
        setStartDate(editingEvent.start_at);
        setEndDate(editingEvent.end_at);
      }

      setCompanyName(editingEvent.company_name || '');
      setHasDeadline(!!editingEvent.deadline_at);
      setDeadlineAt(editingEvent.deadline_at || '');
      setPreparationDates(
        editingEvent.preparation_dates?.map(pd => ({
          date: pd.date,
          end_date: pd.end_date,
          title: pd.title || editingEvent.title,
        })) || []
      );
      setMeetingUrl(editingEvent.meeting_url || '');
      setLocation(editingEvent.location || '');
      setMemo(editingEvent.memo || '');
      setRecurrence({
        type: editingEvent.recurrence_type || 'none',
        interval: editingEvent.recurrence_interval || 1,
        days: editingEvent.recurrence_days,
        monthlyType: editingEvent.recurrence_monthly_type,
        monthlyDay: editingEvent.recurrence_monthly_day,
        monthlyWeekday: editingEvent.recurrence_monthly_weekday,
        endType: editingEvent.recurrence_end_type || 'never',
        endCount: editingEvent.recurrence_end_count,
        endDate: editingEvent.recurrence_end_date,
      });
      setNotifications(editingEvent.notifications || []);
    } else if (initialDate) {
      const now = new Date();
      const start = new Date(initialDate);
      start.setHours(now.getHours() + 1, 0, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);

      setStartDate(formatDateTimeLocal(start));
      setEndDate(formatDateTimeLocal(end));
      
      if (colorPresets.length > 0 && !colorId) {
        setColorId(colorPresets[0].id);
      }
    }
  }, [editingEvent, initialDate, isOpen, colorPresets]);

  const handleAllDayToggle = () => {
    const newAllDay = !allDay;
    setAllDay(newAllDay);

    if (newAllDay && startDate) {
      setStartDate(startDate.split('T')[0]);
      setEndDate(endDate.split('T')[0]);
    } else if (!newAllDay && startDate) {
      const now = new Date();
      const start = new Date(startDate);
      start.setHours(now.getHours(), 0, 0, 0);
      setStartDate(formatDateTimeLocal(start));
      
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      setEndDate(formatDateTimeLocal(end));
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    if (!allDay && newStartDate && startDate && endDate) {
      const oldStart = new Date(startDate);
      const newStart = new Date(newStartDate);
      const oldEnd = new Date(endDate);
      const durationMs = oldEnd.getTime() - oldStart.getTime();
      const newEnd = new Date(newStart.getTime() + durationMs);
      setEndDate(formatDateTimeLocal(newEnd));
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title || !startDate || !endDate) {
      console.log('Validation failed:', { title, startDate, endDate });
      return;
    }

    const finalColorId = colorId || (colorPresets.length > 0 ? colorPresets[0].id : '');

    const eventData: Omit<Event, 'id'> = {
      title,
      start_at: allDay ? startDate : startDate,
      end_at: allDay ? endDate : endDate,
      all_day: allDay,
      color_id: finalColorId,
      event_type: eventType || undefined,
      company_name: companyName || undefined,
      deadline_at: hasDeadline && deadlineAt ? deadlineAt : undefined,
      meeting_url: meetingUrl || undefined,
      location: location || undefined,
      memo: memo || undefined,
      recurrence_type: recurrence.type,
      recurrence_interval: recurrence.interval,
      recurrence_days: recurrence.days,
      recurrence_monthly_type: recurrence.monthlyType,
      recurrence_monthly_day: recurrence.monthlyDay,
      recurrence_monthly_weekday: recurrence.monthlyWeekday,
      recurrence_end_type: recurrence.endType,
      recurrence_end_count: recurrence.endCount,
      recurrence_end_date: recurrence.endDate,
      notifications,
      preparation_dates: editingEvent ? preparationDates.filter(d => d.date).map((pd) => ({
        id: crypto.randomUUID(),
        event_id: editingEvent.id,
        date: pd.date,
        end_date: pd.end_date,
        title: pd.title || title,
      })) : undefined,
    };

    if (editingEvent && editingEvent.id && onUpdate) {
      onUpdate({ ...eventData, id: editingEvent.id });
    } else {
      onSave(eventData);
    }
    handleClose();
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      if (confirm('この予定を削除しますか？')) {
        onDelete(editingEvent.id);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setTitle('');
    setEventType('');
    setColorId(colorPresets[0]?.id || '');
    setAllDay(false);
    setStartDate('');
    setEndDate('');
    setCompanyName('');
    setHasDeadline(false);
    setDeadlineAt('');
    setPreparationDates([]);
    setMeetingUrl('');
    setLocation('');
    setMemo('');
    setRecurrence({ type: 'none', interval: 1, endType: 'never' });
    setNotifications([]);
    setShowColorPicker(false);
    setShowRecurrenceModal(false);
    setShowNotificationModal(false);
    setStartY(null);
    setCurrentY(null);
    onClose();
  };

  const handleTouchStart = (e: React.TouchEvent) => setStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY !== null) {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 0) setCurrentY(deltaY);
    }
  };
  const handleTouchEnd = () => {
    if (currentY !== null && currentY > 100) handleClose();
    else setCurrentY(null);
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
    if (currentY !== null && currentY > 100) handleClose();
    else setCurrentY(null);
    setStartY(null);
  };

  const selectedColor = colorPresets.find((p) => p.id === colorId);

  const addPreparationDate = () => {
    const now = new Date();
    const start = formatDateTimeLocal(now);
    const end = formatDateTimeLocal(new Date(now.getTime() + 60 * 60 * 1000));
    setPreparationDates([...preparationDates, { date: start, end_date: end, title: title || '' }]);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black bg-opacity-50" onClick={handleClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[95vh] flex flex-col transition-transform border-t-2 border-[#FFA52F]/40 overflow-hidden"
        style={{ transform: currentY ? `translateY(${currentY}px)` : 'translateY(0)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          className="relative flex items-center justify-between px-6 py-4 border-b-2 border-gray-100 cursor-grab active:cursor-grabbing bg-gradient-to-r from-white via-orange-50/30 to-white"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={startY !== null ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute left-1/2 top-2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full"></div>
          <button onClick={handleClose} className="text-gray-600 text-base font-medium hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100">
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="text-white text-base font-semibold disabled:opacity-50 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] shadow-md hover:shadow-lg disabled:shadow-none"
            disabled={!title || !startDate || !endDate}
          >
            保存
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-100">
            {/* タイトル */}
            <div className="px-6 py-5">
              <input
                type="text"
                placeholder="タイトルを追加"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-medium outline-none placeholder-gray-400"
              />
            </div>

            {/* カラー選択 */}
            <button
              onClick={() => setShowColorPicker(true)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-amber-50/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg shadow-sm">
                  <Palette size={20} className="text-[#FFA52F]" />
                </div>
                <span className="text-gray-700 font-medium">予定カラー</span>
              </div>
              {selectedColor && (
                <div className="flex items-center gap-2.5">
                  <span className="text-gray-800 font-medium">{selectedColor.label}</span>
                  <div className="w-5 h-5 rounded-lg shadow-md border-2 border-white" style={{ backgroundColor: selectedColor.color }} />
                </div>
              )}
            </button>

            {/* イベントタイプ */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg shadow-sm">
                  <Briefcase size={20} className="text-indigo-600" />
                </div>
                <span className="text-gray-700 font-medium">イベントタイプ</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEventType(eventType === 'intern' ? '' : 'intern')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${
                    eventType === 'intern'
                      ? 'bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  インターン
                </button>
                <button
                  onClick={() => setEventType(eventType === 'fulltime' ? '' : 'fulltime')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${
                    eventType === 'fulltime'
                      ? 'bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  本選考
                </button>
              </div>
            </div>

            {/* 日時設定 */}
            <div className="relative px-6 py-5 bg-gradient-to-br from-blue-50/50 via-sky-50/50 to-cyan-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-50 to-sky-100 rounded-lg shadow-sm">
                    <Clock size={20} className="text-blue-500" />
                  </div>
                  <span className="text-gray-700 font-medium">終日</span>
                </div>
                <button
                  onClick={handleAllDayToggle}
                  className={`w-14 h-8 rounded-full transition-all duration-300 shadow-md ${allDay ? 'bg-gradient-to-r from-blue-500 to-sky-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${allDay ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Clock size={20} className="text-[#FFA52F]" />
                  </div>
                  <span className="text-gray-700 font-medium flex-shrink-0 w-12">開始</span>
                  <input
                    type={allDay ? 'date' : 'datetime-local'}
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-[#FFA52F] bg-white shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Clock size={20} className="text-gray-400" />
                  </div>
                  <span className="text-gray-700 font-medium flex-shrink-0 w-12">終了</span>
                  <input
                    type={allDay ? 'date' : 'datetime-local'}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-[#FFA52F] bg-white shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* 会社名 */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg shadow-sm">
                  <Building2 size={20} className="text-emerald-600" />
                </div>
                <span className="text-gray-700 font-medium">会社名</span>
              </div>
              <input
                type="text"
                placeholder="会社名を入力"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            {/* 締切・対策日 */}
            <div className="relative px-6 py-5 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100/70">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md">
                    <AlertCircle size={22} className="text-red-500" />
                  </div>
                  <span className="text-gray-800 text-[15px]">応募締切日</span>
                </div>
                <button
                  onClick={() => setHasDeadline(!hasDeadline)}
                  className={`w-14 h-8 rounded-full transition-all duration-300 shadow-md ${hasDeadline ? 'bg-gradient-to-r from-[#FFA52F] to-[#FF8C00]' : 'bg-gray-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${hasDeadline ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              {hasDeadline && (
                <input
                  type="date"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl outline-none focus:border-[#FFA52F] bg-white shadow-md mb-4"
                />
              )}

              <div className="border-t-2 border-white/80 pt-4 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl shadow-md">
                      <Clock size={22} className="text-[#FFA52F]" />
                    </div>
                    <span className="text-gray-800 text-[15px]">選考対策日</span>
                  </div>
                  <button
                    onClick={addPreparationDate}
                    className="text-[#FFA52F] hover:text-[#FF8C00] bg-white hover:bg-orange-50 p-2.5 rounded-xl shadow-md hover:shadow-lg"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {preparationDates.length > 0 && (
                  <div className="space-y-3">
                    {preparationDates.map((prepDate, index) => (
                      <div key={index} className="flex flex-col gap-2.5 p-4 border-2 border-orange-100 rounded-xl bg-white shadow-md">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="タイトル"
                            value={prepDate.title}
                            onChange={(e) => {
                              const newDates = [...preparationDates];
                              newDates[index].title = e.target.value;
                              setPreparationDates(newDates);
                            }}
                            className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-[#FFA52F]"
                          />
                          <button
                            onClick={() => setPreparationDates(preparationDates.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-12">開始</span>
                          <input
                            type="datetime-local"
                            value={prepDate.date}
                            onChange={(e) => {
                              const newDates = [...preparationDates];
                              newDates[index].date = e.target.value;
                              setPreparationDates(newDates);
                            }}
                            className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-[#FFA52F]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-12">終了</span>
                          <input
                            type="datetime-local"
                            value={prepDate.end_date || ''}
                            onChange={(e) => {
                              const newDates = [...preparationDates];
                              newDates[index].end_date = e.target.value;
                              setPreparationDates(newDates);
                            }}
                            className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-[#FFA52F]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ビデオ会議 */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-violet-50 to-purple-100 rounded-lg shadow-sm">
                  <Video size={20} className="text-violet-600" />
                </div>
                <span className="text-gray-700 font-medium">ビデオ会議</span>
              </div>
              <input
                type="url"
                placeholder="URL"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-violet-500 shadow-sm"
              />
            </div>

            {/* 場所 */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-rose-50 to-pink-100 rounded-lg shadow-sm">
                  <MapPin size={20} className="text-rose-600" />
                </div>
                <span className="text-gray-700 font-medium">場所</span>
              </div>
              <input
                type="text"
                placeholder="場所を入力"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-rose-500 shadow-sm"
              />
            </div>

            {/* 通知 */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-50 to-teal-100 rounded-lg shadow-sm">
                  <Bell size={20} className="text-teal-600" />
                </div>
                <span className="text-gray-700 font-medium">通知</span>
              </div>
              <span className="text-gray-600 text-sm">
                {notifications.length === 0 ? 'なし' : `${notifications.length}件`}
              </span>
            </button>

            {/* 繰り返し */}
            <button
              onClick={() => setShowRecurrenceModal(true)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-sm">
                  <Repeat size={20} className="text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium">繰り返し</span>
              </div>
              <span className="text-gray-600 text-sm">
                {{ none: 'なし', daily: '毎日', weekly: '毎週', monthly: '毎月', yearly: '毎年', custom: 'カスタム' }[recurrence.type]}
              </span>
            </button>

            {/* メモ */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg shadow-sm">
                  <FileText size={20} className="text-amber-600" />
                </div>
                <span className="text-gray-700 font-medium">メモ</span>
              </div>
              <textarea
                placeholder="メモを入力"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg outline-none focus:border-amber-500 shadow-sm resize-none"
              />
            </div>

            {/* 削除ボタン（編集時のみ） */}
            {editingEvent && onDelete && (
              <div className="px-6 py-5">
                <button
                  onClick={handleDelete}
                  className="w-full py-3 text-red-500 border-2 border-red-300 rounded-xl hover:bg-red-50 font-medium"
                >
                  この予定を削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* サブモーダル */}
      <ColorPickerModal
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        selectedColorId={colorId}
        onSelect={setColorId}
        colorPresets={colorPresets}
        onUpdateLabels={onUpdateColorPresets}
      />

      <RecurrenceModal
        isOpen={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal(false)}
        config={recurrence}
        onSave={setRecurrence}
        startDate={startDate}
      />

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        notifications={notifications}
        onSave={setNotifications}
      />
    </div>
  );
};
