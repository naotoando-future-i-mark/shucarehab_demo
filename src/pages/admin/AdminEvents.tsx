import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, CalendarDays } from 'lucide-react';
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
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={16} />
            イベント追加
          </button>
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
    </AdminLayout>
  );
}
