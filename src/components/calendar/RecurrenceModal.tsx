import { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';

export interface RecurrenceConfig {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  customType?: 'day' | 'week' | 'month' | 'year';
  days?: number[];
  monthlyType?: 'day_of_month' | 'day_of_week';
  monthlyDay?: number;
  monthlyWeekday?: number;
  endType: 'never' | 'count' | 'date';
  endCount?: number;
  endDate?: string;
}

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RecurrenceConfig;
  onSave: (config: RecurrenceConfig) => void;
  startDate?: string;
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

export const RecurrenceModal = ({ isOpen, onClose, config, onSave, startDate }: RecurrenceModalProps) => {
  const [localConfig, setLocalConfig] = useState<RecurrenceConfig>(config);
  const [showCustom, setShowCustom] = useState(config.type === 'custom');

  if (!isOpen) return null;

  const getDateInfo = () => {
    if (!startDate) return { dayOfMonth: 1, weekday: 0, weekOfMonth: 1 };
    const date = new Date(startDate);
    const dayOfMonth = date.getDate();
    const weekday = (date.getDay() + 6) % 7;
    const weekOfMonth = Math.ceil(dayOfMonth / 7);
    return { dayOfMonth, weekday, weekOfMonth };
  };

  const { dayOfMonth, weekday, weekOfMonth } = getDateInfo();

  const handleTypeSelect = (type: RecurrenceConfig['type']) => {
    if (type === 'custom') {
      setShowCustom(true);
      setLocalConfig({ ...localConfig, type, customType: 'day' });
    } else {
      setLocalConfig({ ...localConfig, type });
      onSave({ ...localConfig, type });
      onClose();
    }
  };

  const handleCustomSave = () => {
    onSave(localConfig);
    onClose();
  };

  const toggleDay = (dayIndex: number) => {
    const days = localConfig.days || [];
    const newDays = days.includes(dayIndex)
      ? days.filter(d => d !== dayIndex)
      : [...days, dayIndex].sort();
    setLocalConfig({ ...localConfig, days: newDays });
  };

  const handleClose = () => {
    setShowCustom(false);
    onClose();
  };

  const getIntervalText = () => {
    const interval = localConfig.interval;
    const type = localConfig.customType || 'day';
    const labels: Record<string, string> = { day: '日', week: '週', month: 'か月', year: '年' };
    return `${interval}${labels[type]}ごと`;
  };

  // カスタム設定画面
  if (showCustom) {
    return (
      <>
        <div className="fixed inset-0 z-[90] bg-black bg-opacity-50" onClick={handleClose} />
        <div className="fixed inset-x-0 bottom-0 z-[90] flex justify-center">
          <div
            className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col border-t-2 border-[#FFA52F]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-between px-6 py-4 border-b-2 border-gray-100">
              <button onClick={() => setShowCustom(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl">
                <ChevronLeft size={22} />
              </button>
              <h3 className="text-lg font-bold text-gray-800">繰り返し</h3>
              <button onClick={handleCustomSave} className="px-4 py-2 text-[#FFA52F] font-semibold hover:bg-orange-50 rounded-xl">
                保存
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* タイプ選択 */}
              <div className="grid grid-cols-4 gap-2 my-4">
                {(['day', 'week', 'month', 'year'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setLocalConfig({ ...localConfig, customType: type })}
                    className={`py-2.5 rounded-xl font-medium transition-all ${
                      localConfig.customType === type
                        ? 'bg-[#FFA52F] text-white shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#FFA52F]/40'
                    }`}
                  >
                    {{ day: '日', week: '週', month: '月', year: '年' }[type]}
                  </button>
                ))}
              </div>

              {/* 頻度 */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">頻度</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLocalConfig({ ...localConfig, interval: Math.max(1, localConfig.interval - 1) })}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200 text-gray-700 hover:border-[#FFA52F]"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium text-gray-900 min-w-[80px] text-center">{getIntervalText()}</span>
                    <button
                      onClick={() => setLocalConfig({ ...localConfig, interval: localConfig.interval + 1 })}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200 text-gray-700 hover:border-[#FFA52F]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 週の場合：曜日選択 */}
              {localConfig.customType === 'week' && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">曜日</div>
                  <div className="grid grid-cols-7 gap-2">
                    {WEEKDAYS.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => toggleDay(index)}
                        className={`w-10 h-10 rounded-full font-medium transition-all ${
                          localConfig.days?.includes(index)
                            ? 'bg-[#FFA52F] text-white shadow-md'
                            : 'bg-white text-gray-700 border-2 border-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 月の場合：基準選択 */}
              {localConfig.customType === 'month' && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">基準</div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setLocalConfig({ ...localConfig, monthlyType: 'day_of_month', monthlyDay: dayOfMonth })}
                      className={`w-full p-3 text-left rounded-xl transition-all flex items-center justify-between ${
                        localConfig.monthlyType === 'day_of_month'
                          ? 'bg-white border-2 border-[#FFA52F]'
                          : 'bg-white border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <span className="text-sm text-gray-700">毎月{dayOfMonth}日</span>
                      {localConfig.monthlyType === 'day_of_month' && <span className="text-[#FFA52F]">✓</span>}
                    </button>
                    <button
                      onClick={() => setLocalConfig({ ...localConfig, monthlyType: 'day_of_week', monthlyDay: weekOfMonth, monthlyWeekday: weekday })}
                      className={`w-full p-3 text-left rounded-xl transition-all flex items-center justify-between ${
                        localConfig.monthlyType === 'day_of_week'
                          ? 'bg-white border-2 border-[#FFA52F]'
                          : 'bg-white border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <span className="text-sm text-gray-700">毎月第{weekOfMonth}{WEEKDAYS[weekday]}曜日</span>
                      {localConfig.monthlyType === 'day_of_week' && <span className="text-[#FFA52F]">✓</span>}
                    </button>
                  </div>
                </div>
              )}

              {/* 終了条件 */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">終了</div>
                <div className="space-y-2">
                  <button
                    onClick={() => setLocalConfig({ ...localConfig, endType: 'never' })}
                    className={`w-full p-3 text-left rounded-xl transition-all flex items-center justify-between ${
                      localConfig.endType === 'never' ? 'bg-white border-2 border-[#FFA52F]' : 'bg-white border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <span className="text-sm text-gray-700">なし</span>
                    {localConfig.endType === 'never' && <span className="text-[#FFA52F]">✓</span>}
                  </button>

                  <button
                    onClick={() => setLocalConfig({ ...localConfig, endType: 'count', endCount: localConfig.endCount || 10 })}
                    className={`w-full p-3 text-left rounded-xl transition-all flex items-center justify-between ${
                      localConfig.endType === 'count' ? 'bg-white border-2 border-[#FFA52F]' : 'bg-white border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <span className="text-sm text-gray-700">回数指定</span>
                    {localConfig.endType === 'count' && <span className="text-[#FFA52F]">✓</span>}
                  </button>
                  {localConfig.endType === 'count' && (
                    <div className="mt-2 px-3 py-2 bg-white rounded-xl border-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">回数</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLocalConfig({ ...localConfig, endCount: Math.max(1, (localConfig.endCount || 10) - 1) })}
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium min-w-[60px] text-center">{localConfig.endCount || 10}回</span>
                          <button
                            onClick={() => setLocalConfig({ ...localConfig, endCount: (localConfig.endCount || 10) + 1 })}
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const defaultDate = new Date();
                      defaultDate.setMonth(defaultDate.getMonth() + 1);
                      setLocalConfig({ ...localConfig, endType: 'date', endDate: localConfig.endDate || defaultDate.toISOString().split('T')[0] });
                    }}
                    className={`w-full p-3 text-left rounded-xl transition-all flex items-center justify-between ${
                      localConfig.endType === 'date' ? 'bg-white border-2 border-[#FFA52F]' : 'bg-white border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    <span className="text-sm text-gray-700">日付指定</span>
                    {localConfig.endType === 'date' && <span className="text-[#FFA52F]">✓</span>}
                  </button>
                  {localConfig.endType === 'date' && (
                    <div className="mt-2">
                      <input
                        type="date"
                        value={localConfig.endDate || ''}
                        onChange={(e) => setLocalConfig({ ...localConfig, endDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg outline-none focus:border-[#FFA52F]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // メイン選択画面
  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black bg-opacity-50" onClick={handleClose} />
      <div className="fixed inset-x-0 bottom-0 z-[90] flex justify-center">
        <div
          className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col border-t-2 border-[#FFA52F]/40"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex items-center justify-between px-6 py-4 border-b-2 border-gray-100">
            <button onClick={handleClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl">
              <X size={22} />
            </button>
            <h3 className="text-lg font-bold text-gray-800">繰り返し</h3>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-4">
            <div className="space-y-2">
              {[
                { type: 'none' as const, label: 'しない' },
                { type: 'daily' as const, label: '毎日' },
                { type: 'weekly' as const, label: '毎週' },
                { type: 'monthly' as const, label: '毎月' },
                { type: 'yearly' as const, label: '毎年' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className={`w-full px-5 py-3.5 text-left rounded-2xl transition-all flex items-center justify-between ${
                    localConfig.type === type
                      ? 'bg-orange-50 border-2 border-[#FFA52F]'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <span className="text-[15px] font-medium text-gray-800">{label}</span>
                  {localConfig.type === type && <span className="text-[#FFA52F]">✓</span>}
                </button>
              ))}

              <div className="h-4" />

              <button
                onClick={() => handleTypeSelect('custom')}
                className={`w-full px-5 py-3.5 text-left rounded-2xl transition-all flex items-center justify-between ${
                  localConfig.type === 'custom'
                    ? 'bg-orange-50 border-2 border-[#FFA52F]'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <span className="text-[15px] font-medium text-gray-800">カスタム</span>
                {localConfig.type === 'custom' && <span className="text-[#FFA52F]">✓</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
