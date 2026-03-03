import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, CalendarDays, Upload, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

type Company = {
  id: string;
  name: string;
};

type EventRow = {
  id: string;
  company_id: string;
  title: string;
  event_type: string;
  date: string | null;
  time: string | null;
  deadline: string | null;
  area: string | null;
  duration: string | null;
  memo: string | null;
  created_at: string;
  master_companies: { name: string } | null;
};

type FormData = {
  company_id: string;
  title: string;
  event_type: string;
  date: string;
  time: string;
  deadline: string;
  area: string;
  duration: string;
  memo: string;
};

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; event: EventRow }
  | { type: 'delete'; event: EventRow }
  | null;

const EVENT_TYPES = ['インターン', '本選考', '説明会', 'セミナー'];

const emptyForm = (): FormData => ({
  company_id: '',
  title: '',
  event_type: 'インターン',
  date: '',
  time: '',
  deadline: '',
  area: '',
  duration: '',
  memo: '',
});

function EventFormModal({
  event,
  companies,
  onClose,
  onSaved,
}: {
  event: EventRow | null;
  companies: Company[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormData>(() => {
    if (event) {
      return {
        company_id: event.company_id,
        title: event.title,
        event_type: event.event_type,
        date: event.date ?? '',
        time: event.time ?? '',
        deadline: event.deadline ?? '',
        area: event.area ?? '',
        duration: event.duration ?? '',
        memo: event.memo ?? '',
      };
    }
    return emptyForm();
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.company_id) {
      setError('企業を選択してください');
      return;
    }
    if (!form.title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        company_id: form.company_id,
        title: form.title.trim(),
        event_type: form.event_type,
        date: form.date || null,
        time: form.time || null,
        deadline: form.deadline || null,
        area: form.area || null,
        duration: form.duration || null,
        memo: form.memo || null,
      };

      if (event) {
        const { error: err } = await supabase
          .from('master_events')
          .update(payload)
          .eq('id', event.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('master_events')
          .insert(payload);
        if (err) throw err;
      }
      onSaved();
      onClose();
    } catch {
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {event ? 'イベント編集' : 'イベント追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              企業 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.company_id}
              onChange={(e) => set('company_id', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">企業を選択</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="イベントタイトル"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              種別
            </label>
            <select
              value={form.event_type}
              onChange={(e) => set('event_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                日付
              </label>
              <input
                type="text"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                placeholder="2026年7月"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                時間
              </label>
              <input
                type="text"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                placeholder="10:00〜17:00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              締切
            </label>
            <input
              type="text"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              placeholder="2026年6月30日"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                エリア
              </label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                placeholder="東京、大阪"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                期間
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
                placeholder="1週間"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              メモ
            </label>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              placeholder="メモを入力"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : event ? '更新する' : '作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  event,
  onClose,
  onDone,
}: {
  event: EventRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('master_events')
        .delete()
        .eq('id', event.id);
      if (err) throw err;
      onDone();
      onClose();
    } catch {
      setError('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-start gap-3 px-6 py-5">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">イベントを削除しますか？</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              「<span className="font-medium text-gray-700">{event.title}</span>」を削除します。この操作は取り消せません。
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 px-6 pb-3">{error}</p>}

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            {deleting ? '削除中...' : '削除する'}
          </button>
        </div>
      </div>
    </div>
  );
}

type CsvEventRow = {
  companyName: string;
  title: string;
  event_type: string;
  date: string;
  time: string;
  deadline: string;
  area: string;
  duration: string;
  memo: string;
  company_id: string | null;
};

type EventImportResult = { success: number; unmatched: number; errors: number } | null;

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

function parseCsvEvents(text: string, companies: Company[]): CsvEventRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  const companyMap = new Map(companies.map((c) => [c.name, c.id]));

  return lines.slice(1).map((line) => {
    const vals = splitCsvLine(line);
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = vals[i] ?? ''; });
    const companyName = raw['企業名'] ?? raw['company_name'] ?? '';
    return {
      companyName,
      title: raw['タイトル'] ?? raw['title'] ?? '',
      event_type: raw['種別'] ?? raw['type'] ?? 'インターン',
      date: raw['日付'] ?? raw['date'] ?? '',
      time: raw['時間'] ?? raw['time'] ?? '',
      deadline: raw['締切'] ?? raw['deadline'] ?? '',
      area: raw['エリア'] ?? raw['area'] ?? '',
      duration: raw['期間'] ?? raw['duration'] ?? '',
      memo: raw['メモ'] ?? raw['memo'] ?? '',
      company_id: companyMap.get(companyName) ?? null,
    };
  }).filter((r) => r.companyName.trim() || r.title.trim());
}

function EventCsvImportModal({
  companies,
  onClose,
  onDone,
}: {
  companies: Company[];
  onClose: () => void;
  onDone: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvEventRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<EventImportResult>(null);
  const [parseError, setParseError] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setParseError('');
    setRows([]);
    setResult(null);
    setFileName(file.name);
    const text = await readFileAsText(file);
    const parsed = parseCsvEvents(text, companies);
    if (parsed.length === 0) {
      setParseError('有効な行が見つかりませんでした。CSVの形式を確認してください。');
      return;
    }
    setRows(parsed);
  }, [companies]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const validRows = rows.filter((r) => r.company_id && r.title.trim());
  const invalidRows = rows.filter((r) => !r.company_id || !r.title.trim());
  const previewRows = rows.slice(0, 5);

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let unmatched = 0;
    let errors = 0;

    for (const row of rows) {
      if (!row.company_id || !row.title.trim()) {
        unmatched++;
        continue;
      }
      const payload = {
        company_id: row.company_id,
        title: row.title.trim(),
        event_type: row.event_type || 'インターン',
        date: row.date || null,
        time: row.time || null,
        deadline: row.deadline || null,
        area: row.area || null,
        duration: row.duration || null,
        memo: row.memo || null,
      };
      const { error } = await supabase.from('master_events').insert(payload);
      if (error) errors++;
      else success++;
    }

    setImporting(false);
    setResult({ success, unmatched, errors });
    onDone();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">CSVインポート（イベント）</h2>
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
                    成功 {result.success} 件　企業不一致 {result.unmatched} 件　エラー {result.errors} 件
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
                  UTF-8 / Shift_JIS 形式のCSVファイルを選択してください。1行目はヘッダー行として扱います。企業名は master_companies に登録済みの名前と完全一致している必要があります。
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
                      全 {rows.length} 件を読み込みました（最大5行プレビュー）　有効: {validRows.length} 件　企業不一致: {invalidRows.length} 件
                    </p>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            {['企業名', 'タイトル', '種別', '日付', '締切', 'エリア', '期間'].map((h) => (
                              <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {previewRows.map((r, i) => (
                            <tr key={i} className={r.company_id ? 'hover:bg-gray-50' : 'bg-red-50'}>
                              <td className="px-3 py-2 font-medium whitespace-nowrap">
                                <span className={r.company_id ? 'text-gray-800' : 'text-red-600'}>
                                  {r.companyName || '-'}
                                  {!r.company_id && <span className="ml-1 text-red-400 text-xs">（不一致）</span>}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.title || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.event_type || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.date || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.deadline || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.area || '-'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.duration || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {invalidRows.length > 0 && (
                      <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        赤くハイライトされた行はインポート対象から除外されます。
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing || validRows.length === 0}
                      className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <Upload size={14} />
                      {importing ? 'インポート中...' : `インポート実行（${validRows.length}件）`}
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

const EVENT_TYPE_COLORS: Record<string, string> = {
  インターン: 'bg-blue-100 text-blue-700',
  本選考: 'bg-red-100 text-red-700',
  説明会: 'bg-green-100 text-green-700',
  セミナー: 'bg-amber-100 text-amber-700',
};

export default function AdminEvents() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType, setFilterType] = useState('');
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, companiesRes] = await Promise.all([
        supabase
          .from('master_events')
          .select('*, master_companies(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('master_companies')
          .select('id, name')
          .order('name', { ascending: true }),
      ]);
      setEvents((eventsRes.data ?? []) as EventRow[]);
      setCompanies((companiesRes.data ?? []) as Company[]);
    } catch {
      setEvents([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = events.filter((e) => {
    if (filterCompany && e.company_id !== filterCompany) return false;
    if (filterType && e.event_type !== filterType) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">イベント管理</h1>
            <p className="text-sm text-gray-500 mt-1">掲載イベントの作成・管理</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCsvModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-orange-500 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
            >
              <Upload size={16} />
              CSVインポート
            </button>
            <button
              onClick={() => setModal({ type: 'create' })}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={16} />
              イベント追加
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">すべての企業</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">すべての種別</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400">{filtered.length} 件表示</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              読み込み中...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <CalendarDays size={36} className="text-gray-300" />
              <p className="text-gray-400 text-sm">イベントが見つかりません</p>
              {events.length === 0 && (
                <button
                  onClick={() => setModal({ type: 'create' })}
                  className="mt-2 flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  <Plus size={14} />
                  最初のイベントを追加する
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      企業名
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      タイトル
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      種別
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      日付
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      締切
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      エリア
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      期間
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                        {e.master_companies?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                        {e.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            EVENT_TYPE_COLORS[e.event_type] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {e.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {e.date ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {e.deadline ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {e.area ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {e.duration ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModal({ type: 'edit', event: e })}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil size={13} />
                            編集
                          </button>
                          <button
                            onClick={() => setModal({ type: 'delete', event: e })}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <EventFormModal
          event={modal.type === 'edit' ? modal.event : null}
          companies={companies}
          onClose={() => setModal(null)}
          onSaved={loadData}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          event={modal.event}
          onClose={() => setModal(null)}
          onDone={loadData}
        />
      )}

      {csvModalOpen && (
        <EventCsvImportModal
          companies={companies}
          onClose={() => setCsvModalOpen(false)}
          onDone={loadData}
        />
      )}
    </AdminLayout>
  );
}
