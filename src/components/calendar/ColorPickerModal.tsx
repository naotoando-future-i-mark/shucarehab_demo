import { useState } from 'react';
import { X, Plus, Trash2, Palette } from 'lucide-react';
import { ColorPreset } from '../../data/colorPresets';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColorId: string | null;
  onSelect: (colorId: string) => void;
  colorPresets: ColorPreset[];
  onUpdateLabels: (presets: ColorPreset[]) => void;
}

const DEFAULT_COLORS = [
  '#FF9500', '#007AFF', '#FF3B30', '#5856D6', '#34C759',
  '#FF2D55', '#00C7BE', '#FFD60A', '#8E8E93', '#AF52DE',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7B731', '#5F27CD', '#00D2D3', '#FF9FF3', '#54A0FF',
];

export const ColorPickerModal = ({
  isOpen,
  onClose,
  selectedColorId,
  onSelect,
  colorPresets,
  onUpdateLabels,
}: ColorPickerModalProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editedPresets, setEditedPresets] = useState<ColorPreset[]>(colorPresets);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
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
    setIsAddMode(false);
    setEditingColorId(null);
    setNewLabel('');
    setNewColor(DEFAULT_COLORS[0]);
    setEditedPresets(colorPresets);
    onClose();
  };

  const handleSelect = (colorId: string) => {
    if (!isEditMode && !isAddMode && !editingColorId) {
      onSelect(colorId);
      handleClose();
    }
  };

  const handleLabelChange = (id: string, newLabelValue: string) => {
    setEditedPresets(prev =>
      prev.map(preset =>
        preset.id === id ? { ...preset, label: newLabelValue } : preset
      )
    );
  };

  const handleColorChange = (id: string, newColorValue: string) => {
    setEditedPresets(prev =>
      prev.map(preset =>
        preset.id === id ? { ...preset, color: newColorValue } : preset
      )
    );
  };

  const handleDelete = (id: string) => {
    if (editedPresets.length <= 1) {
      alert('最低1つのカラープリセットが必要です');
      return;
    }
    setEditedPresets(prev => prev.filter(preset => preset.id !== id));
  };

  const handleAddNew = () => {
    if (!newLabel.trim()) {
      alert('ラベル名を入力してください');
      return;
    }
    const newPreset: ColorPreset = {
      id: `temp-${Date.now()}`,
      label: newLabel.trim(),
      color: newColor,
      order_index: editedPresets.length,
    };
    setEditedPresets(prev => [...prev, newPreset]);
    setNewLabel('');
    setNewColor(DEFAULT_COLORS[0]);
    setIsAddMode(false);
  };

  const handleSaveLabels = () => {
    if (editedPresets.some(p => !p.label.trim())) {
      alert('すべてのラベル名を入力してください');
      return;
    }
    onUpdateLabels(editedPresets);
    setIsEditMode(false);
  };

  // 追加モード
  if (isAddMode) {
    return (
      <>
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-50" onClick={handleClose} />
        <div
          className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col transition-transform border-t-2 border-[#FFA52F]/40"
          style={{ transform: currentY ? `translateY(${currentY}px)` : 'translateY(0)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex items-center justify-between px-6 py-4 border-b-2 border-gray-100">
            <button
              onClick={() => {
                setIsAddMode(false);
                setNewLabel('');
                setNewColor(DEFAULT_COLORS[0]);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
            <h3 className="text-lg font-bold text-gray-800">カラー追加</h3>
            <button
              onClick={handleAddNew}
              className="text-[#FFA52F] font-semibold hover:text-[#FF9520]"
            >
              追加
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ラベル名</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="例: 最終面接"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#FFA52F] focus:ring-2 focus:ring-[#FFA52F]/20 text-[15px] font-medium bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">カラー選択</label>
              <div className="grid grid-cols-5 gap-3">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-full aspect-square rounded-xl transition-all ${
                      newColor === color
                        ? 'ring-3 ring-[#FFA52F] ring-offset-2 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 編集モード
  if (isEditMode) {
    return (
      <>
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-50" onClick={handleClose} />
        <div
          className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col transition-transform border-t-2 border-[#FFA52F]/40"
          style={{ transform: currentY ? `translateY(${currentY}px)` : 'translateY(0)' }}
          onClick={(e) => e.stopPropagation()}
        >
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
            <h3 className="text-lg font-bold text-gray-800">カラー管理</h3>
            <button
              onClick={handleSaveLabels}
              className="text-[#FFA52F] font-semibold hover:text-[#FF9520]"
            >
              保存
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-3">
              {editedPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 bg-gray-50 rounded-2xl space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingColorId(editingColorId === preset.id ? null : preset.id)}
                      className="relative group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 shadow-md border-2 border-white transition-transform group-hover:scale-110"
                        style={{ backgroundColor: preset.color }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Palette size={18} className="text-white drop-shadow" />
                      </div>
                    </button>
                    <input
                      type="text"
                      value={preset.label}
                      onChange={(e) => handleLabelChange(preset.id, e.target.value)}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[#FFA52F] focus:ring-2 focus:ring-[#FFA52F]/20 text-[15px] font-medium bg-white transition-all"
                    />
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {editingColorId === preset.id && (
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            handleColorChange(preset.id, color);
                            setEditingColorId(null);
                          }}
                          className={`w-full aspect-square rounded-lg transition-all ${
                            preset.color === color
                              ? 'ring-2 ring-[#FFA52F] ring-offset-1 scale-105'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 border-t-2 border-gray-100">
            <button
              onClick={() => setIsAddMode(true)}
              className="w-full py-3.5 bg-white border-2 border-[#FFA52F] text-[#FFA52F] text-base font-semibold hover:bg-[#FFA52F] hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              新しいカラーを追加
            </button>
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

        {/* カラー管理ボタン */}
        <div className="px-5 py-4 border-t-2 border-white/80">
          <button
            onClick={() => setIsEditMode(true)}
            className="w-full py-3.5 bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] text-white text-base font-semibold hover:from-[#FF9520] hover:to-[#FF7A00] rounded-2xl transition-all shadow-lg hover:shadow-xl"
          >
            カラー管理
          </button>
        </div>
      </div>
    </>
  );
};
