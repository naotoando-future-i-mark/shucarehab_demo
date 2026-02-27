import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, X, AlertTriangle, Tag } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

type TagRow = {
  id: string;
  name: string;
  created_at: string;
};

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; tag: TagRow }
  | { type: 'delete'; tag: TagRow }
  | null;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

function TagFormModal({
  tag,
  existingNames,
  onClose,
  onSaved,
}: {
  tag: TagRow | null;
  existingNames: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tag?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('タグ名は必須です');
      return;
    }
    const isDuplicate = existingNames.some(
      (n) => n === trimmed && n !== tag?.name
    );
    if (isDuplicate) {
      setError('同じ名前のタグが既に存在します');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (tag) {
        const { error: err } = await supabase
          .from('tags')
          .update({ name: trimmed })
          .eq('id', tag.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('tags')
          .insert({ name: trimmed });
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">
            {tag ? 'タグ編集' : 'タグ新規追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              タグ名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="タグ名を入力"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              autoFocus
            />
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
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : tag ? '更新する' : '作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  tag,
  onClose,
  onDone,
}: {
  tag: TagRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsage = async () => {
      const { count } = await supabase
        .from('article_tag_links')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tag.id);
      setUsageCount(count ?? 0);
    };
    fetchUsage();
  }, [tag.id]);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const { error: linkErr } = await supabase
        .from('article_tag_links')
        .delete()
        .eq('tag_id', tag.id);
      if (linkErr) throw linkErr;

      const { error: tagErr } = await supabase
        .from('tags')
        .delete()
        .eq('id', tag.id);
      if (tagErr) throw tagErr;

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
            <h2 className="font-bold text-gray-800">タグを削除しますか？</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              「<span className="font-medium text-gray-700">{tag.name}</span>」を削除します。この操作は取り消せません。
            </p>
            {usageCount !== null && usageCount > 0 && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  このタグは{usageCount}件の記事で使用されています。削除すると記事からも外れます。
                </span>
              </div>
            )}
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
            disabled={deleting || usageCount === null}
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

export default function AdminTags() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [search, setSearch] = useState('');

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });
      setTags((data ?? []) as TagRow[]);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const filtered = tags.filter((t) =>
    !search || t.name.includes(search)
  );

  const existingNames = tags.map((t) => t.name);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">タグ管理</h1>
            <p className="text-sm text-gray-500 mt-1">記事に付与するタグの作成・管理</p>
          </div>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={16} />
            新規追加
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="タグ名で検索"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
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
              <Tag size={36} className="text-gray-300" />
              <p className="text-gray-400 text-sm">タグが見つかりません</p>
              {tags.length === 0 && (
                <button
                  onClick={() => setModal({ type: 'create' })}
                  className="mt-2 flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  <Plus size={14} />
                  最初のタグを作成する
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      タグ名
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      作成日
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          <Tag size={11} />
                          {t.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModal({ type: 'edit', tag: t })}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil size={13} />
                            編集
                          </button>
                          <button
                            onClick={() => setModal({ type: 'delete', tag: t })}
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
        <TagFormModal
          tag={modal.type === 'edit' ? modal.tag : null}
          existingNames={existingNames}
          onClose={() => setModal(null)}
          onSaved={loadTags}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          tag={modal.tag}
          onClose={() => setModal(null)}
          onDone={loadTags}
        />
      )}
    </AdminLayout>
  );
}
