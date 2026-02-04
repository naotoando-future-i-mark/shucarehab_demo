import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { NotificationConfig } from '../../types/event';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationConfig[];
  onSave: (notifications: NotificationConfig[]) => void;
}

const PRESET_OPTIONS = [
  { type: 'at_time' as const, label: '予定時間' },
  { type: 'before_10min' as const, label: '10分前' },
  { type: 'before_1hour' as const, label: '1時間前' },
];

const CUSTOM_UNITS = [
  { value: 'minute', label: '分' },
  { value: 'hour', label: '時間' },
  { value: 'day', label: '日' },
  { value: 'week', label: '週間' },
];

export const NotificationModal = ({ isOpen, onClose, notifications, onSave }: NotificationModalProps) => {
  const [localNotifications, setLocalNotifications] = useState<NotificationConfig[]>(notifications);
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState(1);
  const [customUnit, setCustomUnit] = useState<'minute' | 'hour' | 'day' | 'week'>('minute');
  const [customReferenceTime, setCustomReferenceTime] = useState<'start' | 'end'>('start');

  useEffect(() => {
    if (isOpen) {
      setLocalNotifications(notifications);
    }
  }, [isOpen, notifications]);

  if (!isOpen) return null;

  const handlePresetToggle = (type: 'at_time' | 'before_10min' | 'before_1hour') => {
    const exists = localNotifications.some(n => n.type === type);
    if (exists) {
      setLocalNotifications(localNotifications.filter(n => n.type !== type));
    } else {
      setLocalNotifications([...localNotifications, { type, referenceTime: 'start' }]);
    }
  };

  const handleAddCustom = () => {
    const newNotification: NotificationConfig = {
      type: 'custom',
      customValue,
      customUnit,
      referenceTime: customReferenceTime,
    };
    setLocalNotifications([...localNotifications, newNotification]);
    setShowCustom(false);
    setCustomValue(1);
    setCustomUnit('minute');
    setCustomReferenceTime('start');
  };

  const handleRemoveCustom = (index: number) => {
    setLocalNotifications(localNotifications.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(localNotifications);
    onClose();
  };

  const handleClose = () => {
    setShowCustom(false);
    onClose();
  };

  const getNotificationLabel = (notification: NotificationConfig) => {
    if (notification.type === 'at_time') return '予定時間';
    if (notification.type === 'before_10min') return '10分前';
    if (notification.type === 'before_1hour') return '1時間前';
    if (notification.type === 'custom') {
      const unitLabel = CUSTOM_UNITS.find(u => u.value === notification.customUnit)?.label;
      const refLabel = notification.referenceTime === 'start' ? '開始' : '終了';
      return `${notification.customValue}${unitLabel}前（${refLabel}時間）`;
    }
    return '';
  };

  // カスタム通知追加画面
  if (showCustom) {
    return (
      <div className="fixed inset-0 bg-black/40 z-[70] flex items-end" onClick={handleClose}>
        <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button onClick={() => setShowCustom(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <span className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-200 rounded-full">
              カスタム通知
            </span>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">時間</label>
              <input
                type="number"
                min="1"
                value={customValue}
                onChange={(e) => setCustomValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#FFA52F] focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">単位</label>
              <div className="grid grid-cols-4 gap-2">
                {CUSTOM_UNITS.map((unit) => (
                  <button
                    key={unit.value}
                    onClick={() => setCustomUnit(unit.value as any)}
                    className={`py-2.5 rounded-xl font-medium transition-all ${
                      customUnit === unit.value
                        ? 'bg-[#FFA52F] text-white shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-200'
                    }`}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">基準時間</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCustomReferenceTime('start')}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    customReferenceTime === 'start'
                      ? 'bg-[#FFA52F] text-white shadow-md'
                      : 'bg-white text-gray-700 border-2 border-gray-200'
                  }`}
                >
                  開始時間
                </button>
                <button
                  onClick={() => setCustomReferenceTime('end')}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    customReferenceTime === 'end'
                      ? 'bg-[#FFA52F] text-white shadow-md'
                      : 'bg-white text-gray-700 border-2 border-gray-200'
                  }`}
                >
                  終了時間
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleAddCustom}
              className="w-full bg-[#FFA52F] text-white py-3.5 rounded-xl font-medium hover:bg-[#FF9A1F] shadow-lg"
            >
              追加
            </button>
          </div>
        </div>
      </div>
    );
  }

  // メイン画面
  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-end" onClick={handleClose}>
      <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="w-10" />
          <span className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-200 rounded-full">
            通知
          </span>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* プリセット */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">プリセット</h3>
            <div className="space-y-2">
              {PRESET_OPTIONS.map((option) => {
                const isSelected = localNotifications.some(n => n.type === option.type);
                return (
                  <button
                    key={option.type}
                    onClick={() => handlePresetToggle(option.type)}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FFA52F] text-white shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-200'
                    }`}
                  >
                    <span>{option.label}</span>
                    <Bell className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* カスタム通知 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">カスタム通知</h3>
              <button
                onClick={() => setShowCustom(true)}
                className="text-[#FFA52F] text-sm font-medium"
              >
                + 追加
              </button>
            </div>

            {localNotifications.filter(n => n.type === 'custom').length > 0 ? (
              <div className="space-y-2">
                {localNotifications.map((notification, index) => {
                  if (notification.type !== 'custom') return null;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 px-4 bg-white border-2 border-gray-200 rounded-xl"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {getNotificationLabel(notification)}
                      </span>
                      <button onClick={() => handleRemoveCustom(index)} className="text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                カスタム通知はありません
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="w-full bg-[#FFA52F] text-white py-3.5 rounded-xl font-medium hover:bg-[#FF9A1F] shadow-lg"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
