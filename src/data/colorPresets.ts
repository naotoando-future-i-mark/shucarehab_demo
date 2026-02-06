export interface ColorPreset {
  id: string;
  label: string;
  color: string;
  order_index: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

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
