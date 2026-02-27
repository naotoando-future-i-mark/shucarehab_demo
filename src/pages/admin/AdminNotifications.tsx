import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Pencil, Trash2, X, AlertTriangle,
  ChevronDown, Globe, GraduationCap, Zap, Eye, EyeOff,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

type Notification = {
  id: string;
  title: string;
  body: string;
  target_type: 'all' | 'graduation_year';
  target_graduation_year: number | null;
  is_published: boolean;
  notification_type: 'manual' | 'auto';
  created_at: string;
  updated_at: string;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
};

type FormData = {
  title: string;
  body: string;
  target_type: 'all' | 'graduation_year';
  target_graduation_year: string;
  is_published: boolean;
};

const defaultForm: FormData = {
  title: '',
  body: '',
  target_type: 'all',
  target_graduation_year: '',
  is_published: true,
};

function NotificationFormModal({
  notification,
  onClose,
  onSaved,
}: {
  notification: Notification | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isAuto = notification?.notification_type === 'auto';
  const [form, setForm] = useState<FormData>(
    notification
      ? {
          title: notification.title,
          body: notification.body,
          target_type: notification.target_type,
          target_graduation_year: notification.target_graduation_year?.toString() ?? '',
          is_published: notification.is_published,
        }
      : defaultForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) { setError('タイトルは必須です'); return; }
    if (!form.body.trim()) { setError('本文は必須です'); return; }
    if (form.target_type === 'graduation_year' && !form.target_graduation_year) {
      setError('卒業年度を入力してください');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      target_type: form.target_type,
      target_graduation_year:
        form.target_type === 'graduation_year' ? parseInt(form.target_graduation_year) : null,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    };

    try {
      if (notification) {
        const { error: err } = await supabase
          .from('notifications')
          .update(payload)
          .eq('id', notification.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('notifications')
          .insert({
            title: form.title.trim(),
            body: form.body.trim(),
            target_type: form.target_type,
            target_graduation_year:
              form.target_type === 'graduation_year' ? parseInt(form.target_graduation_year) : null,
            is_published: form.is_published,
            notification_type: 'manual',
          });
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg font-bold text-gray-800">
            {notification ? 'お知らせ編集' : 'お知らせ新規作成'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isAuto && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <Zap size={14} />
              <span>自動生成のお知らせです。編集できません。</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              disabled={isAuto}
              placeholder="お知らせのタイトル"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              本文 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
              disabled={isAuto}
              rows={6}
              placeholder="お知らせの本文を入力してください"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">配信対象</label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${!isAuto ? 'hover:bg-gray-50' : ''} ${form.target_type === 'all' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="target_type"
                  value="all"
                  checked={form.target_type === 'all'}
                  onChange={() => setForm(prev => ({ ...prev, target_type: 'all' }))}
                  disabled={isAuto}
                  className="accent-orange-500"
                />
                <Globe size={15} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">全ユーザー</p>
                  <p className="text-xs text-gray-400">すべての登録ユーザーに配信します</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${!isAuto ? 'hover:bg-gray-50' : ''} ${form.target_type === 'graduation_year' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                <input
                  type="radio"
                  name="target_type"
                  value="graduation_year"
                  checked={form.target_type === 'graduation_year'}
                  onChange={() => setForm(prev => ({ ...prev, target_type: 'graduation_year' }))}
                  disabled={isAuto}
                  className="accent-orange-500 mt-0.5"
                />
                <GraduationCap size={15} className="text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">卒業年度指定</p>
                  <p className="text-xs text-gray-400 mb-2">特定の卒業年度のユーザーに配信します</p>
                  {form.target_type === 'graduation_year' && (
                    <input
                      type="number"
                      value={form.target_graduation_year}
                      onChange={(e) => setForm(prev => ({ ...prev, target_graduation_year: e.target.value }))}
                      disabled={isAuto}
                      placeholder="例: 2026"
                      className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-100"
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">公開状態</label>
            <div className="flex gap-3">
              <label className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm transition-colors ${!isAuto ? 'hover:bg-gray-50' : ''} ${form.is_published ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                <input
                  type="radio"
                  name="is_published"
                  checked={form.is_published}
                  onChange={() => setForm(prev => ({ ...prev, is_published: true }))}
                  disabled={isAuto}
                  className="accent-green-500"
                />
                <Eye size={14} />
                すぐに公開
              </label>
              <label className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm transition-colors ${!isAuto ? 'hover:bg-gray-50' : ''} ${!form.is_published ? 'border-gray-400 bg-gray-50 text-gray-700' : 'border-gray-200 text-gray-600'}`}>
                <input
                  type="radio"
                  name="is_published"
                  checked={!form.is_published}
                  onChange={() => setForm(prev => ({ ...prev, is_published: false }))}
                  disabled={isAuto}
                  className="accent-gray-500"
                />
                <EyeOff size={14} />
                下書き保存
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          {!isAuto && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : notification ? '更新する' : '作成する'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  notification,
  onClose,
  onDone,
}: {
  notification: Notification;
  onClose: () => void;
  onDone: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await supabase.from('notification_reads').delete().eq('notification_id', notification.id);
      const { error: err } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);
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
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">お知らせを削除しますか？</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              「<span className="font-medium text-gray-700">{notification.title}</span>」を削除します。この操作は取り消せません。
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

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; notification: Notification }
  | { type: 'delete'; notification: Notification }
  | null;

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [searchTitle, setSearchTitle] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'auto'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      setNotifications((data ?? []) as Notification[]);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filtered = notifications.filter((n) => {
    if (searchTitle && !n.title.includes(searchTitle)) return false;
    if (filterType !== 'all' && n.notification_type !== filterType) return false;
    if (filterStatus === 'published' && !n.is_published) return false;
    if (filterStatus === 'draft' && n.is_published) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">お知らせ管理</h1>
            <p className="text-sm text-gray-500 mt-1">ユーザーへのお知らせの作成・管理</p>
          </div>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={16} />
            新規作成
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="タイトルで検索"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'manual' | 'auto')}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="all">種別: 全て</option>
                <option value="manual">手動</option>
                <option value="auto">自動生成</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="all">公開状態: 全て</option>
                <option value="published">公開中</option>
                <option value="draft">下書き</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <p className="text-xs text-gray-400">{filtered.length} 件表示</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-gray-400 text-sm">お知らせが見つかりません</p>
              {notifications.length === 0 && (
                <button
                  onClick={() => setModal({ type: 'create' })}
                  className="mt-2 flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  <Plus size={14} />
                  最初のお知らせを作成する
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">タイトル</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">配信対象</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">公開状態</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">種別</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">作成日</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((n) => (
                    <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 line-clamp-1 max-w-xs">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">{n.body}</p>
                      </td>
                      <td className="px-4 py-3">
                        {n.target_type === 'all' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Globe size={11} />
                            全員
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                            <GraduationCap size={11} />
                            {n.target_graduation_year}年
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {n.is_published ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Eye size={11} />
                            公開中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <EyeOff size={11} />
                            下書き
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {n.notification_type === 'auto' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <Zap size={11} />
                            自動生成
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <Pencil size={11} />
                            手動
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDate(n.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModal({ type: 'edit', notification: n })}
                            title="編集"
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil size={13} />
                            編集
                          </button>
                          <button
                            onClick={() => setModal({ type: 'delete', notification: n })}
                            title="削除"
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
        <NotificationFormModal
          notification={modal.type === 'edit' ? modal.notification : null}
          onClose={() => setModal(null)}
          onSaved={loadNotifications}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          notification={modal.notification}
          onClose={() => setModal(null)}
          onDone={loadNotifications}
        />
      )}
    </AdminLayout>
  );
}
