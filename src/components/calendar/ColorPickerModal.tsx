import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { ColorPreset } from '../../data/colorPresets';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColorId: string;
  onSelect: (colorId: string) => void;
  colorPresets: ColorPreset[];
  onUpdateLabels: (presets: ColorPreset[]) => void;
}

const DEFAULT_COLORS = [
  '#FF9500', '#007AFF', '#FF3B30', '#5856D6', '#34C759',
  '#FF2D55', '#30B0C7', '#FFCC00', '#8E8E93', '#AF52DE',
  '#FF6961', '#2DD4BF', '#22D3EE', '#FB923C', '#86EFAC',
  '#F59E0B', '#4B0082', '#00CED1', '#FF69B4', '#4169E1',
];

export const ColorPickerModal = ({
  isOpen,
  onClose,
  selectedColorId,
  onSelect,
  colorPresets,
  onUpdateLabels,
}: ColorPickerModalProps) => {
  const [view, setView] = useState<'select' | 'edit' | 'add'>('select');
  const [editedPresets, setEditedPresets] = useState<ColorPreset[]>([]);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      setEditedPresets([...colorPresets]);
      setView('select');
      setEditingColorId(null);
      setNewLabel('');
      setNewColor(DEFAULT_COLORS[0]);
    }
  }, [isOpen, colorPresets]);

  if (!isOpen) return null;

  const handleClose = () => {
    setView('select');
    setEditingColorId(null);
    setNewLabel('');
    setNewColor(DEFAULT_COLORS[0]);
    onClose();
  };

  const handleSelect = (preset: ColorPreset) => {
    onSelect(preset.id);
    handleClose();
  };

  const handleLabelChange = (id: string, label: string) => {
    setEditedPresets(prev => prev.map(p => p.id === id ? { ...p, label } : p));
  };

  const handleColorChange = (id: string, color: string) => {
    setEditedPresets(prev => prev.map(p => p.id === id ? { ...p, color } : p));
  };

  const handleDelete = (id: string) => {
    if (editedPresets.length <= 1) {
      alert('最低1つのカラーが必要です');
      return;
    }
    setEditedPresets(prev => prev.filter(p => p.id !== id));
  };

  const handleAddNew = () => {
    if (!newLabel.trim()) {
      alert('ラベル名を入力してください');
      return;
    }
    const newPreset: ColorPreset = {
      id: `temp-${Date.now()}`,
      color: newColor,
      label: newLabel.trim(),
      order: editedPresets.length,
    };
    setEditedPresets(prev => [...prev, newPreset]);
    setNewLabel('');
    setNewColor(DEFAULT_COLORS[0]);
    setView('edit');
  };

  const handleSaveLabels = () => {
    const hasEmpty = editedPresets.some(p => !p.label.trim());
    if (hasEmpty) {
      alert('すべてのラベルを入力してください');
      return;
    }
    onUpdateLabels(editedPresets);
    setView('select');
  };

  // 全画面を覆うポータル的なラッパー（イベント伝搬を止める）
  return (
    <div className="fixed inset-0 z-[100]" onClick={(e) => e.stopPropagation()}>
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={handleClose} />

      {/* モーダル本体を中央配置 */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto" onClick={(e) => e.stopPropagation()}>

          {/* ── カラー追加画面 ── */}
          {view === 'add' && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button onClick={() => setView('edit')} className="text-sm text-gray-500">キャンセル</button>
                <h3 className="text-base font-semibold text-gray-800">カラー追加</h3>
                <button onClick={handleAddNew} className="text-sm font-semibold text-[#FFA52F]">追加</button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">ラベル名</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="例: 最終面接"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">カラー選択</label>
                  <div className="grid grid-cols-5 gap-3">
                    {DEFAULT_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewColor(color)}
                        className={`w-full aspect-square rounded-xl transition-all ${newColor === color ? 'ring-3 ring-[#FFA52F] ring-offset-2 scale-105' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 編集画面 ── */}
          {view === 'edit' && (
            <div className="bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button onClick={() => setView('select')} className="text-sm text-gray-500">キャンセル</button>
                <h3 className="text-base font-semibold text-gray-800">カラー管理</h3>
                <button onClick={handleSaveLabels} className="text-sm font-semibold text-[#FFA52F]">保存</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {editedPresets.map(preset => (
                  <div key={preset.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingColorId(editingColorId === preset.id ? null : preset.id)}
                        className="w-10 h-10 rounded-xl flex-shrink-0 border-2 border-white shadow-md"
                        style={{ backgroundColor: preset.color }}
                      />
                      <input
                        type="text"
                        value={preset.label}
                        onChange={(e) => handleLabelChange(preset.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]/50"
                      />
                      <button onClick={() => handleDelete(preset.id)} className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {editingColorId === preset.id && (
                      <div className="grid grid-cols-5 gap-2 pl-13 pb-2">
                        {DEFAULT_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(preset.id, color)}
                            className={`w-full aspect-square rounded-lg transition-all ${preset.color === color ? 'ring-2 ring-[#FFA52F] ring-offset-1 scale-105' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setView('add')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#FFA52F] hover:text-[#FFA52F] transition-colors"
                >
                  <Plus size={18} />
                  <span className="text-sm font-medium">新しいカラーを追加</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 選択画面（メイン） ── */}
          {view === 'select' && (
            <div className="bg-white rounded-2xl shadow-2xl max-h-[70vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="w-16" />
                <h3 className="text-base font-semibold text-gray-800">予定カラーリスト</h3>
                <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {colorPresets.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">カラーがありません</div>
                ) : (
                  colorPresets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelect(preset)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                        selectedColorId === preset.id ? 'bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex-shrink-0 ${selectedColorId === preset.id ? 'ring-2 ring-[#FFA52F] ring-offset-1' : ''}`}
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-sm font-medium text-gray-800">{preset.label}</span>
                    </button>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setView('edit')}
                  className="w-full py-2.5 bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] text-white text-sm font-semibold rounded-xl hover:shadow-md transition-shadow"
                >
                  カラー管理
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
