export interface ColorPreset {
  id: string;
  label: string;
  color: string;
  order_index: number;
}

export const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { id: '1', label: '説明会', color: '#FFA52F', order_index: 0 },
  { id: '2', label: '面接', color: '#3b82f6', order_index: 1 },
  { id: '3', label: 'ES締切', color: '#ef4444', order_index: 2 },
  { id: '4', label: 'インターン', color: '#22c55e', order_index: 3 },
  { id: '5', label: 'Webテスト', color: '#a855f7', order_index: 4 },
  { id: '6', label: 'OB訪問', color: '#06b6d4', order_index: 5 },
  { id: '7', label: 'その他', color: '#6b7280', order_index: 6 },
  { id: '8', label: '対策日', color: '#eab308', order_index: 7 },
];

const STORAGE_KEY = 'shukarehub_color_presets';

export const getColorPresets = (): ColorPreset[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load color presets:', e);
  }
  return DEFAULT_COLOR_PRESETS;
};

export const saveColorPresets = (presets: ColorPreset[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save color presets:', e);
  }
};

// color_id から色を取得するヘルパー
export const getColorById = (colorId: string, presets: ColorPreset[]): string => {
  const preset = presets.find(p => p.id === colorId || p.color === colorId);
  return preset?.color || colorId || '#FFA52F';
};

// colorMap を作成するヘルパー
export const createColorMap = (presets: ColorPreset[]): Record<string, string> => {
  const map: Record<string, string> = {};
  presets.forEach(p => {
    map[p.id] = p.color;
    map[p.color] = p.color; // 旧データ互換
  });
  return map;
};
