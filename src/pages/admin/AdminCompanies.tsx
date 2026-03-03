import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Plus, Upload, Pencil, Trash2, X, ChevronUp, ChevronDown, PlusCircle, ArrowUp, ArrowDown, AlertTriangle, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

const WHITE_FEATURE_LABELS = [
  '年間休日',
  '月残業',
  '離職率',
  'ボーナス',
  '有給消化',
  '特別休暇',
  '特別休暇（種類）',
  'リモート',
  'フレックス',
  '育児休暇',
] as const;

interface Company {
  id: string;
  name: string;
  industry: string | null;
  employees: string | null;
  location: string | null;
  position: string | null;
  founded_year: string | null;
  capital: string | null;
  revenue: string | null;
  business_description: string | null;
  company_url: string | null;
  recruit_url: string | null;
  points: string[] | null;
  white_features: unknown | null;
  selection_flow: unknown | null;
  job_info: unknown | null;
  intern_info: unknown | null;
  tags: string[] | null;
  tag: string | null;
  deadline: string | null;
  deadline_closed: boolean | null;
  is_premium: boolean | null;
  is_recommended: boolean | null;
  premium_image: string | null;
  is_urgent: boolean | null;
  event_title: string | null;
  event_period: string | null;
  event_area: string | null;
  event_duration: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FormData {
  name: string;
  industry: string;
  employees: string;
  location: string;
  position: string;
  founded_year: string;
  capital: string;
  revenue: string;
  business_description: string;
  company_url: string;
  recruit_url: string;
  points: string[];
  tags: string[];
  tag: string;
  deadline: string;
  deadline_closed: boolean;
  is_premium: boolean;
  is_recommended: boolean;
  premium_image: string;
  is_urgent: boolean;
}

type WhiteLevel = 'normal' | 'high' | 'highest' | 'god';

interface JobInfoItem {
  key: string;
  value: string;
}

interface InternEventItem {
  id: string;
  title: string;
  typeLabel: string;
  date: string;
  time: string;
  deadline: string;
  area: string;
  duration: string;
}

const emptyForm: FormData = {
  name: '',
  industry: '',
  employees: '',
  location: '',
  position: '',
  founded_year: '',
  capital: '',
  revenue: '',
  business_description: '',
  company_url: '',
  recruit_url: '',
  points: [],
  tags: [],
  tag: '',
  deadline: '',
  deadline_closed: false,
  is_premium: false,
  is_recommended: false,
  premium_image: '',
  is_urgent: false,
};

type FixedWhiteFeatureItem = {
  label: string;
  iconName: string;
  value: string;
  level: WhiteLevel;
};

function makeEmptyWhiteFeatures(): FixedWhiteFeatureItem[] {
  return WHITE_FEATURE_LABELS.map((label) => ({ label, iconName: label, value: '', level: 'normal' as WhiteLevel }));
}

function parseWhiteFeaturesFixed(raw: unknown): FixedWhiteFeatureItem[] {
  const base = makeEmptyWhiteFeatures();
  if (!Array.isArray(raw)) return base;
  return base.map((item) => {
    const match = (raw as Record<string, unknown>[]).find((r) => r.label === item.label);
    if (!match) return item;
    return {
      ...item,
      value: typeof match.value === 'string' ? match.value : '',
      level: (['normal', 'high', 'highest', 'god'].includes(match.level as string) ? match.level : 'normal') as WhiteLevel,
    };
  });
}

type SortKey = 'name' | 'industry' | 'employees' | 'location' | 'created_at';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-2 mt-2">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1.5">
        {children}
      </h3>
    </div>
  );
}

function StringArrayEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addItem() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setInput('');
  }

  function removeItem(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="space-y-1.5 mb-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-gray-700">
              {v}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="入力してEnterまたは追加ボタン"
        />
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <PlusCircle size={13} />
          追加
        </button>
      </div>
    </div>
  );
}

function WhiteFeaturesEditor({
  items,
  onChange,
}: {
  items: FixedWhiteFeatureItem[];
  onChange: (v: FixedWhiteFeatureItem[]) => void;
}) {
  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300';

  function updateItem(idx: number, field: 'value' | 'level', val: string) {
    onChange(items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }

  return (
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-2">ホワイト制度</label>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-28 text-xs text-gray-700 font-medium shrink-0">{item.label}</span>
            <input
              type="text"
              value={item.value}
              onChange={(e) => updateItem(idx, 'value', e.target.value)}
              className={`flex-1 ${inputCls}`}
              placeholder="値を入力"
            />
            <select
              value={item.level}
              onChange={(e) => updateItem(idx, 'level', e.target.value)}
              className={`w-24 ${inputCls}`}
            >
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="highest">highest</option>
              <option value="god">god</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectionFlowEditor({
  steps,
  onChange,
}: {
  steps: string[];
  onChange: (v: string[]) => void;
}) {
  function addStep() {
    onChange([...steps, '']);
  }

  function removeStep(idx: number) {
    onChange(steps.filter((_, i) => i !== idx));
  }

  function updateStep(idx: number, val: string) {
    onChange(steps.map((s, i) => i === idx ? val : s));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...steps];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }

  function moveDown(idx: number) {
    if (idx === steps.length - 1) return;
    const next = [...steps];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  }

  return (
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-2">選考フロー</label>
      <div className="space-y-1.5 mb-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-4 text-right">{idx + 1}</span>
            <input
              type="text"
              value={step}
              onChange={(e) => updateStep(idx, e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="例: ES提出"
            />
            <button type="button" onClick={() => moveUp(idx)} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={idx === 0}>
              <ArrowUp size={13} />
            </button>
            <button type="button" onClick={() => moveDown(idx)} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={idx === steps.length - 1}>
              <ArrowDown size={13} />
            </button>
            <button type="button" onClick={() => removeStep(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addStep}
        className="flex items-center gap-1 px-3 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors w-full justify-center"
      >
        <Plus size={13} />
        ステップ追加
      </button>
    </div>
  );
}

function JobInfoEditor({
  items,
  onChange,
}: {
  items: JobInfoItem[];
  onChange: (v: JobInfoItem[]) => void;
}) {
  function addItem() {
    onChange([...items, { key: '', value: '' }]);
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: 'key' | 'value', val: string) {
    onChange(items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }

  return (
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-2">求人情報</label>
      <div className="space-y-1.5 mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item.key}
              onChange={(e) => updateItem(idx, 'key', e.target.value)}
              className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="項目名"
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => updateItem(idx, 'value', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="内容"
            />
            <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 px-3 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors w-full justify-center"
      >
        <Plus size={13} />
        項目追加
      </button>
    </div>
  );
}

function InternInfoEditor({
  items,
  onChange,
}: {
  items: InternEventItem[];
  onChange: (v: InternEventItem[]) => void;
}) {
  const inputCls = 'w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300';

  function addItem() {
    onChange([
      ...items,
      { id: crypto.randomUUID(), title: '', typeLabel: '', date: '', time: '', deadline: '', area: '', duration: '' },
    ]);
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof InternEventItem, val: string) {
    onChange(items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }

  return (
    <div className="col-span-2">
      <label className="block text-xs font-medium text-gray-600 mb-2">インターン情報</label>
      <div className="space-y-2 mb-2">
        {items.map((item, idx) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">イベント #{idx + 1}</span>
              <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">タイトル</p>
                <input type="text" value={item.title} onChange={(e) => updateItem(idx, 'title', e.target.value)} className={inputCls} placeholder="例: 1Day体験" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">種別ラベル</p>
                <input type="text" value={item.typeLabel} onChange={(e) => updateItem(idx, 'typeLabel', e.target.value)} className={inputCls} placeholder="例: 仕事体験" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">日にち</p>
                <input type="text" value={item.date} onChange={(e) => updateItem(idx, 'date', e.target.value)} className={inputCls} placeholder="例: 2025年6月1日" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">時間</p>
                <input type="text" value={item.time} onChange={(e) => updateItem(idx, 'time', e.target.value)} className={inputCls} placeholder="例: 10:00-17:00" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">締切日</p>
                <input type="text" value={item.deadline} onChange={(e) => updateItem(idx, 'deadline', e.target.value)} className={inputCls} placeholder="例: 2025年5月20日" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">エリア</p>
                <input type="text" value={item.area} onChange={(e) => updateItem(idx, 'area', e.target.value)} className={inputCls} placeholder="例: 東京・大阪" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">期間</p>
                <input type="text" value={item.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)} className={inputCls} placeholder="例: 半日" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 px-3 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors w-full justify-center"
      >
        <Plus size={13} />
        イベント追加
      </button>
    </div>
  );
}

type CsvCompanyRow = {
  name: string;
  industry: string;
  location: string;
  employees: string;
  position: string;
  founded_year: string;
  capital: string;
  revenue: string;
  business_description: string;
  company_url: string;
  tags: string[];
  _raw: Record<string, string>;
};

type DuplicatePolicy = 'overwrite' | 'skip';

type ImportResult = { success: number; skipped: number; errors: number } | null;

function parseCsvText(text: string): CsvCompanyRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = splitCsvLine(line);
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = vals[i] ?? ''; });
    return {
      name: raw['企業名'] ?? raw['name'] ?? '',
      industry: raw['業種'] ?? raw['industry'] ?? '',
      location: raw['本社所在地'] ?? raw['location'] ?? '',
      employees: raw['従業員数'] ?? raw['employees'] ?? '',
      position: raw['職種'] ?? raw['position'] ?? '',
      founded_year: raw['設立年'] ?? raw['founded_year'] ?? '',
      capital: raw['資本金'] ?? raw['capital'] ?? '',
      revenue: raw['売上高'] ?? raw['revenue'] ?? '',
      business_description: raw['事業内容'] ?? raw['business_description'] ?? '',
      company_url: raw['企業HP'] ?? raw['company_url'] ?? '',
      tags: (raw['タグ'] ?? raw['tags'] ?? '').split(',').map((t) => t.trim()).filter(Boolean),
      _raw: raw,
    };
  }).filter((r) => r.name.trim());
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = e.target?.result as ArrayBuffer;
      try {
        const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(buf);
        resolve(utf8);
      } catch {
        const sjis = new TextDecoder('shift_jis').decode(buf);
        resolve(sjis);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function CompanyCsvImportModal({
  existingCompanies,
  onClose,
  onDone,
}: {
  existingCompanies: Company[];
  onClose: () => void;
  onDone: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvCompanyRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('overwrite');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult>(null);
  const [parseError, setParseError] = useState('');

  const existingNames = existingCompanies.map((c) => c.name);

  const handleFile = useCallback(async (file: File) => {
    setParseError('');
    setRows([]);
    setResult(null);
    setFileName(file.name);
    const text = await readFileAsText(file);
    const parsed = parseCsvText(text);
    if (parsed.length === 0) {
      setParseError('有効な行が見つかりませんでした。CSVの形式を確認してください。');
      return;
    }
    setRows(parsed);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const duplicates = rows.filter((r) => existingNames.includes(r.name));

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      const isDuplicate = existingNames.includes(row.name);
      if (isDuplicate && duplicatePolicy === 'skip') {
        skipped++;
        continue;
      }
      const payload = {
        name: row.name,
        industry: row.industry || null,
        location: row.location || null,
        employees: row.employees || null,
        position: row.position || null,
        founded_year: row.founded_year || null,
        capital: row.capital || null,
        revenue: row.revenue || null,
        business_description: row.business_description || null,
        company_url: row.company_url || null,
        tags: row.tags.length > 0 ? row.tags : null,
      };
      if (isDuplicate && duplicatePolicy === 'overwrite') {
        const { error } = await supabase
          .from('master_companies')
          .update(payload)
          .eq('name', row.name);
        if (error) errors++;
        else success++;
      } else {
        const { error } = await supabase.from('master_companies').insert(payload);
        if (error) errors++;
        else success++;
      }
    }

    setImporting(false);
    setResult({ success, skipped, errors });
    onDone();
  };

  const previewRows = rows.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">CSVインポート（企業）</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">インポート完了</p>
                  <p className="text-sm text-green-700 mt-1">
                    成功 {result.success} 件　スキップ {result.skipped} 件　エラー {result.errors} 件
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  UTF-8 / Shift_JIS 形式のCSVファイルを選択してください。1行目はヘッダー行として扱います。
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-orange-500 text-orange-500 rounded-lg text-sm hover:bg-orange-50 transition-colors"
                  >
                    <Upload size={15} />
                    ファイルを選択
                  </button>
                  {fileName && <span className="text-sm text-gray-600">{fileName}</span>}
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </div>
                {parseError && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle size={13} /> {parseError}
                  </p>
                )}
              </div>

              {rows.length > 0 && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      全 {rows.length} 件を読み込みました（最大5行プレビュー）
                    </p>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            {['企業名', '業種', '本社所在地', '従業員数', '職種', '企業HP', 'タグ'].map((h) => (
                              <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {previewRows.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{r.name}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.industry || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.location || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.employees || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.position || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{r.company_url || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.tags.join(', ') || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {duplicates.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        {duplicates.length} 件の企業名が既に存在します
                      </p>
                      <p className="text-xs text-amber-700 mb-3">
                        {duplicates.map((d) => d.name).join('、')}
                      </p>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-amber-800 cursor-pointer">
                          <input
                            type="radio"
                            value="overwrite"
                            checked={duplicatePolicy === 'overwrite'}
                            onChange={() => setDuplicatePolicy('overwrite')}
                            className="accent-orange-500"
                          />
                          上書き
                        </label>
                        <label className="flex items-center gap-2 text-sm text-amber-800 cursor-pointer">
                          <input
                            type="radio"
                            value="skip"
                            checked={duplicatePolicy === 'skip'}
                            onChange={() => setDuplicatePolicy('skip')}
                            className="accent-orange-500"
                          />
                          スキップ
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <Upload size={14} />
                      {importing ? 'インポート中...' : `インポート実行（${rows.length}件）`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [whiteFeatures, setWhiteFeatures] = useState<FixedWhiteFeatureItem[]>(makeEmptyWhiteFeatures());
  const [selectionFlow, setSelectionFlow] = useState<string[]>([]);
  const [jobInfo, setJobInfo] = useState<JobInfoItem[]>([]);
  const [internInfo, setInternInfo] = useState<InternEventItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  async function fetchCompanies() {
    setLoading(true);
    const { data, error } = await supabase
      .from('master_companies')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCompanies(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = String(av).localeCompare(String(bv), 'ja');
    return sortAsc ? cmp : -cmp;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function parseSelectionFlow(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((s) => (typeof s === 'string' ? s : String(s)));
  }

  function parseJobInfo(raw: unknown): JobInfoItem[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item: Record<string, unknown>) => ({
      key: typeof item.key === 'string' ? item.key : '',
      value: typeof item.value === 'string' ? item.value : '',
    }));
  }

  function parseInternInfo(raw: unknown): InternEventItem[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item: Record<string, unknown>) => ({
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      title: typeof item.title === 'string' ? item.title : '',
      typeLabel: typeof item.typeLabel === 'string' ? item.typeLabel : '',
      date: typeof item.date === 'string' ? item.date : '',
      time: typeof item.time === 'string' ? item.time : '',
      deadline: typeof item.deadline === 'string' ? item.deadline : '',
      area: typeof item.area === 'string' ? item.area : '',
      duration: typeof item.duration === 'string' ? item.duration : '',
    }));
  }

  function openCreate() {
    setEditTarget(null);
    setFormData(emptyForm);
    setWhiteFeatures(makeEmptyWhiteFeatures());
    setSelectionFlow([]);
    setJobInfo([]);
    setInternInfo([]);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(company: Company) {
    setEditTarget(company);
    setFormData({
      name: company.name,
      industry: company.industry ?? '',
      employees: company.employees ?? '',
      location: company.location ?? '',
      position: company.position ?? '',
      founded_year: company.founded_year ?? '',
      capital: company.capital ?? '',
      revenue: company.revenue ?? '',
      business_description: company.business_description ?? '',
      company_url: company.company_url ?? '',
      recruit_url: company.recruit_url ?? '',
      points: Array.isArray(company.points) ? company.points : [],
      tags: Array.isArray(company.tags) ? company.tags : [],
      tag: company.tag ?? '',
      deadline: company.deadline ?? '',
      deadline_closed: company.deadline_closed ?? false,
      is_premium: company.is_premium ?? false,
      is_recommended: company.is_recommended ?? false,
      premium_image: company.premium_image ?? '',
      is_urgent: company.is_urgent ?? false,
    });
    setWhiteFeatures(parseWhiteFeaturesFixed(company.white_features));
    setSelectionFlow(parseSelectionFlow(company.selection_flow));
    setJobInfo(parseJobInfo(company.job_info));
    setInternInfo(parseInternInfo(company.intern_info));
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setFormData(emptyForm);
    setWhiteFeatures(makeEmptyWhiteFeatures());
    setSelectionFlow([]);
    setJobInfo([]);
    setInternInfo([]);
    setError(null);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      setError('企業名は必須です');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      industry: formData.industry || null,
      employees: formData.employees || null,
      location: formData.location || null,
      position: formData.position || null,
      founded_year: formData.founded_year || null,
      capital: formData.capital || null,
      revenue: formData.revenue || null,
      business_description: formData.business_description || null,
      company_url: formData.company_url || null,
      recruit_url: formData.recruit_url || null,
      points: formData.points.length > 0 ? formData.points : null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      tag: formData.tag || null,
      deadline: formData.deadline || null,
      deadline_closed: formData.deadline_closed,
      is_premium: formData.is_premium,
      is_recommended: formData.is_recommended,
      premium_image: formData.premium_image || null,
      is_urgent: formData.is_urgent,
      white_features: whiteFeatures.some((w) => w.value) ? whiteFeatures : null,
      selection_flow: selectionFlow.length > 0 ? selectionFlow : null,
      job_info: jobInfo.length > 0 ? jobInfo : null,
      intern_info: internInfo.length > 0 ? internInfo : null,
    };

    let err;
    if (editTarget) {
      ({ error: err } = await supabase
        .from('master_companies')
        .update(payload)
        .eq('id', editTarget.id));
    } else {
      ({ error: err } = await supabase.from('master_companies').insert(payload));
    }

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      closeModal();
      fetchCompanies();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('master_companies').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchCompanies();
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={14} className="text-gray-300" />;
    return sortAsc
      ? <ChevronUp size={14} className="text-blue-500" />
      : <ChevronDown size={14} className="text-blue-500" />;
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300';

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">企業管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">master_companies テーブル</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-orange-500 rounded-lg text-sm text-orange-500 bg-white hover:bg-orange-50 transition-colors"
          >
            <Upload size={16} />
            CSVインポート
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white transition-colors"
            style={{ backgroundColor: '#FFA52F' }}
          >
            <Plus size={16} />
            新規追加
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="企業名で検索"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {([
                  { key: 'name', label: '企業名' },
                  { key: 'industry', label: '業種' },
                  { key: 'employees', label: '従業員数' },
                  { key: 'location', label: '本社所在地' },
                  { key: 'created_at', label: '作成日' },
                ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort(key)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      <SortIcon col={key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">読み込み中...</td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {searchText ? '検索結果が見つかりません' : 'データがありません'}
                  </td>
                </tr>
              ) : (
                sorted.map((company) => (
                  <tr key={company.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{company.name}</td>
                    <td className="px-4 py-3 text-gray-600">{company.industry ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{company.employees ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{company.location ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {company.created_at
                        ? new Date(company.created_at).toLocaleDateString('ja-JP')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(company)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Pencil size={12} />
                          編集
                        </button>
                        <button
                          onClick={() => setDeleteTarget(company)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={12} />
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} 件
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editTarget ? '企業を編集' : '企業を新規追加'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">

                <SectionTitle>基本情報</SectionTitle>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    企業名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputCls}
                    placeholder="例: 株式会社〇〇"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">業種</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className={inputCls}
                    placeholder="例: IT・通信"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">従業員数</label>
                  <input
                    type="text"
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                    className={inputCls}
                    placeholder="例: 1000名以上"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">本社所在地</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={inputCls}
                    placeholder="例: 東京都渋谷区"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">職種</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className={inputCls}
                    placeholder="例: エンジニア"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">設立年</label>
                  <input
                    type="text"
                    value={formData.founded_year}
                    onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                    className={inputCls}
                    placeholder="例: 1990年"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">資本金</label>
                  <input
                    type="text"
                    value={formData.capital}
                    onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                    className={inputCls}
                    placeholder="例: 1億円"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">売上高</label>
                  <input
                    type="text"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                    className={inputCls}
                    placeholder="例: 100億円"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">事業内容</label>
                  <textarea
                    value={formData.business_description}
                    onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="事業内容を入力"
                  />
                </div>

                <SectionTitle>掲載情報</SectionTitle>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">タグ（単一）</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className={inputCls}
                    placeholder="例: 優良企業"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">締め切り</label>
                  <input
                    type="text"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className={inputCls}
                    placeholder="例: 2025年3月31日"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">プレミアム画像URL</label>
                  <input
                    type="text"
                    value={formData.premium_image}
                    onChange={(e) => setFormData({ ...formData, premium_image: e.target.value })}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_premium}
                      onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                      className="w-4 h-4 rounded accent-orange-400"
                    />
                    <span className="text-sm text-gray-700">プレミアム</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_recommended}
                      onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                      className="w-4 h-4 rounded accent-orange-500"
                    />
                    <span className="text-sm text-gray-700">おすすめに表示</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_urgent}
                      onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                      className="w-4 h-4 rounded accent-orange-400"
                    />
                    <span className="text-sm text-gray-700">緊急</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.deadline_closed}
                      onChange={(e) => setFormData({ ...formData, deadline_closed: e.target.checked })}
                      className="w-4 h-4 rounded accent-orange-400"
                    />
                    <span className="text-sm text-gray-700">締め切り終了</span>
                  </label>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">※「おすすめに表示」をオンにすると、フリープラン企業でも「おすすめ」タブに表示されます</p>
                </div>

                <SectionTitle>イベント情報</SectionTitle>

                <InternInfoEditor items={internInfo} onChange={setInternInfo} />

                <SectionTitle>URL</SectionTitle>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">企業HP URL</label>
                  <input
                    type="text"
                    value={formData.company_url}
                    onChange={(e) => setFormData({ ...formData, company_url: e.target.value })}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">採用/申込ページURL</label>
                  <input
                    type="text"
                    value={formData.recruit_url}
                    onChange={(e) => setFormData({ ...formData, recruit_url: e.target.value })}
                    className={inputCls}
                    placeholder="https://..."
                  />
                </div>

                <SectionTitle>詳細データ</SectionTitle>

                {formData.is_premium && (
                  <StringArrayEditor
                    label="企業ポイント"
                    values={formData.points}
                    onChange={(v) => setFormData({ ...formData, points: v })}
                  />
                )}

                {formData.is_premium && (
                  <StringArrayEditor
                    label="タグ"
                    values={formData.tags}
                    onChange={(v) => setFormData({ ...formData, tags: v })}
                  />
                )}

                {formData.is_premium && (
                  <WhiteFeaturesEditor items={whiteFeatures} onChange={setWhiteFeatures} />
                )}

                <SelectionFlowEditor steps={selectionFlow} onChange={setSelectionFlow} />
                <JobInfoEditor items={jobInfo} onChange={setJobInfo} />

              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm rounded-lg text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#FFA52F' }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-2">企業を削除しますか？</h3>
            <p className="text-sm text-gray-500 mb-6">
              「<span className="font-medium text-gray-700">{deleteTarget.name}</span>」を削除します。この操作は元に戻せません。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {csvModalOpen && (
        <CompanyCsvImportModal
          existingCompanies={companies}
          onClose={() => setCsvModalOpen(false)}
          onDone={fetchCompanies}
        />
      )}
    </AdminLayout>
  );
}
