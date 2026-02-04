import { useState } from 'react';
import { X } from 'lucide-react';
import { ColorPreset } from '../../data/colorPresets';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColorId: string | null;
  onSelect: (colorId: string) => void;
  colorPresets: ColorPreset[];
  onUpdateLabels: (presets: ColorPreset[]) => void;
}

export const ColorPickerModal = ({
  isOpen,
  onClose,
  selectedColorId,
  onSelect,
  colorPresets,
  onUpdateLabels,
}: ColorPickerModalProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPresets, setEditedPresets] = useState<ColorPreset[]>(colorPresets);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);

  if (!isOpen) return null;

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
    setIsEditMode(false);
    setEditedPresets(colorPresets);
    onClose();
  };

  const handleSelect = (colorId: string) => {
    if (!isEditMode) {
      onSelect(colorId);
      handleClose();
    }
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    setEditedPresets(prev =>
      prev.map(preset =>
        preset.id === id ? { ...preset, label: newLabel } : preset
      )
    );
  };

  const handleSaveLabels = () => {
    onUpdateLabels(editedPresets);
    setIsEditMode(false);
  };

  // 編集モード
  if (isEditMode) {
    return (
      <>
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-50" onClick={handleClose} />
        <div
          className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col transition-transform border-t-2 border-[#FFA52F]/40"
          style={{ transform: currentY ? `translateY(${currentY}px)` : 'translateY(0)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="relative flex items-center justify-between px-6 py-4 border-b-2 border-gray-100">
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditedPresets(colorPresets);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
            <h3 className="text-lg font-bold text-gray-800">ラベル編集</h3>
            <button
              onClick={handleSaveLabels}
              className="text-[#FFA52F] font-semibold hover:text-[#FF9520]"
            >
              保存
            </button>
          </div>

          {/* ラベル編集リスト */}
          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-3">
              {editedPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 flex items-center gap-3 bg-gray-50 rounded-2xl"
                >
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 shadow-md border-2 border-white"
                    style={{ backgroundColor: preset.color }}
                  />
                  <input
                    type="text"
                    value={preset.label}
                    onChange={(e) => handleLabelChange(preset.id, e.target.value)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[#FFA52F] focus:ring-2 focus:ring-[#FFA52F]/20 text-[15px] font-medium bg-white transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // 選択モード
  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black bg-opacity-50" onClick={handleClose} />
      <div
        className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col transition-transform border-t-2 border-[#FFA52F]/40"
        style={{ transform: currentY ? `translateY(${currentY}px)` : 'translateY(0)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー（ドラッグ可能） */}
        <div
          className="relative flex items-center justify-between px-6 py-4 border-b-2 border-white/80 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={startY !== null ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <h3 className="text-lg font-bold text-gray-800">予定カラーリスト</h3>
          <button 
            onClick={handleClose} 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* カラーリスト */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="space-y-2 px-4">
            {colorPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 active:bg-gray-100 rounded-2xl transition-all shadow-sm hover:shadow-md border-2 border-transparent hover:border-[#FFA52F]/20"
              >
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 shadow-md border-2 border-white"
                  style={{ backgroundColor: preset.color }}
                />
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-medium text-gray-800">{preset.label}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selectedColorId === preset.id || selectedColorId === preset.color
                    ? 'border-[#FFA52F] bg-[#FFA52F]/10' 
                    : 'border-gray-300'
                }`}>
                  {(selectedColorId === preset.id || selectedColorId === preset.color) && (
                    <div className="w-3 h-3 rounded-full bg-[#FFA52F]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ラベル編集ボタン */}
        <div className="px-5 py-4 border-t-2 border-white/80">
          <button
            onClick={() => setIsEditMode(true)}
            className="w-full py-3.5 bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] text-white text-base font-semibold hover:from-[#FF9520] hover:to-[#FF7A00] rounded-2xl transition-all shadow-lg hover:shadow-xl"
          >
            ラベル名を変更
          </button>
        </div>
      </div>
    </>
  );
};
