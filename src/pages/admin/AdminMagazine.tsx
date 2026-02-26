import { useEffect, useRef, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Image, GripVertical, Upload } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

interface Article {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  likes: number;
  created_at: string;
}

interface Tag {
  id: string;
  name: string;
}

interface ArticleImage {
  id?: string;
  url: string;
  sort_order: number;
  storagePath?: string;
}

interface FormData {
  title: string;
  description: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string;
  selectedTagIds: string[];
  images: ArticleImage[];
}

const emptyForm: FormData = {
  title: '',
  description: '',
  status: 'draft',
  published_at: '',
  selectedTagIds: [],
  images: [],
};

const STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  published: '公開',
  scheduled: '予約投稿',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
};

type SortKey = 'title' | 'status' | 'published_at' | 'likes' | 'created_at';

export default function AdminMagazine() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Article | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingArticleId, setPendingArticleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchArticles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setArticles(data);
    setLoading(false);
  }

  async function fetchTags() {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) setTags(data);
  }

  useEffect(() => {
    fetchArticles();
    fetchTags();
  }, []);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(searchText.toLowerCase())
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

  function openCreate() {
    setEditTarget(null);
    setFormData(emptyForm);
    setPendingArticleId(null);
    setError(null);
    setModalOpen(true);
  }

  async function openEdit(article: Article) {
    setEditTarget(article);
    setPendingArticleId(article.id);
    setError(null);

    const [{ data: tagLinks }, { data: images }] = await Promise.all([
      supabase.from('article_tag_links').select('tag_id').eq('article_id', article.id),
      supabase
        .from('article_images')
        .select('id, url, sort_order')
        .eq('article_id', article.id)
        .order('sort_order'),
    ]);

    setFormData({
      title: article.title,
      description: article.description ?? '',
      status: article.status,
      published_at: article.published_at
        ? new Date(article.published_at).toISOString().slice(0, 16)
        : '',
      selectedTagIds: tagLinks ? tagLinks.map((l) => l.tag_id) : [],
      images: images
        ? images.map((img) => ({ id: img.id, url: img.url, sort_order: img.sort_order }))
        : [],
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setFormData(emptyForm);
    setPendingArticleId(null);
    setError(null);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    let articleId = pendingArticleId;

    if (!articleId) {
      const tempTitle = formData.title.trim() || '(未保存)';
      const { data, error: err } = await supabase
        .from('articles')
        .insert({
          title: tempTitle,
          description: formData.description || null,
          status: 'draft',
          published_at: null,
        })
        .select('id')
        .single();
      if (err || !data) {
        setError('記事の一時保存に失敗しました');
        setUploading(false);
        return;
      }
      articleId = data.id;
      setPendingArticleId(articleId);
    }

    const uploadedImages: ArticleImage[] = [];

    for (const file of Array.from(files)) {
      const timestamp = Date.now();
      const filePath = `article-images/${articleId}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (uploadError) {
        setError(`アップロードに失敗しました: ${file.name}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      const maxOrder = formData.images.length + uploadedImages.length;
      uploadedImages.push({ url: publicUrl, sort_order: maxOrder, storagePath: filePath });
    }

    if (uploadedImages.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          ...uploadedImages.map((img, i) => ({
            ...img,
            sort_order: prev.images.length + i,
          })),
        ],
      }));
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function removeImage(index: number) {
    const img = formData.images[index];

    if (img.storagePath) {
      await supabase.storage.from('article-images').remove([img.storagePath]);
    } else if (img.url && img.url.includes('article-images')) {
      const urlParts = img.url.split('/article-images/');
      if (urlParts.length > 1) {
        const storagePath = `article-images/${urlParts[1]}`;
        await supabase.storage.from('article-images').remove([storagePath]);
      }
    }

    const updated = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updated.map((im, i) => ({ ...im, sort_order: i })) });
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= formData.images.length) return;
    const updated = [...formData.images];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    const reordered = updated.map((img, i) => ({ ...img, sort_order: i }));
    setFormData({ ...formData, images: reordered });
  }

  function toggleTag(tagId: string) {
    const ids = formData.selectedTagIds;
    if (ids.includes(tagId)) {
      setFormData({ ...formData, selectedTagIds: ids.filter((id) => id !== tagId) });
    } else {
      setFormData({ ...formData, selectedTagIds: [...ids, tagId] });
    }
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    if (formData.status === 'scheduled' && !formData.published_at) {
      setError('予約投稿の場合は公開日時を入力してください');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: formData.title.trim(),
      description: formData.description || null,
      status: formData.status,
      published_at:
        formData.status === 'scheduled' && formData.published_at
          ? new Date(formData.published_at).toISOString()
          : formData.status === 'published'
          ? new Date().toISOString()
          : null,
    };

    let articleId: string;

    if (editTarget) {
      const { error: err } = await supabase
        .from('articles')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editTarget.id);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      articleId = editTarget.id;
    } else if (pendingArticleId) {
      const { error: err } = await supabase
        .from('articles')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', pendingArticleId);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      articleId = pendingArticleId;
    } else {
      const { data, error: err } = await supabase
        .from('articles')
        .insert(payload)
        .select('id')
        .single();
      if (err || !data) {
        setError(err?.message ?? '保存に失敗しました');
        setSaving(false);
        return;
      }
      articleId = data.id;
    }

    await supabase.from('article_tag_links').delete().eq('article_id', articleId);
    if (formData.selectedTagIds.length > 0) {
      await supabase.from('article_tag_links').insert(
        formData.selectedTagIds.map((tag_id) => ({ article_id: articleId, tag_id }))
      );
    }

    await supabase.from('article_images').delete().eq('article_id', articleId);
    if (formData.images.length > 0) {
      await supabase.from('article_images').insert(
        formData.images.map((img, i) => ({
          article_id: articleId,
          url: img.url,
          sort_order: i,
        }))
      );
    }

    setSaving(false);
    closeModal();
    fetchArticles();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('articles').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchArticles();
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={14} className="text-gray-300" />;
    return sortAsc
      ? <ChevronUp size={14} className="text-blue-500" />
      : <ChevronDown size={14} className="text-blue-500" />;
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">マガジン管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">articles テーブル</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white transition-colors"
          style={{ backgroundColor: '#FFA52F' }}
        >
          <Plus size={16} />
          新規作成
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="タイトルで検索"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {(
                  [
                    { key: 'title', label: 'タイトル' },
                    { key: 'status', label: 'ステータス' },
                    { key: 'published_at', label: '公開日' },
                    { key: 'likes', label: 'いいね' },
                    { key: 'created_at', label: '作成日' },
                  ] as { key: SortKey; label: string }[]
                ).map(({ key, label }) => (
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
                sorted.map((article) => (
                  <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[240px] truncate">
                      {article.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[article.status]}`}>
                        {STATUS_LABELS[article.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString('ja-JP')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{article.likes}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(article.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(article)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Pencil size={12} />
                          編集
                        </button>
                        <button
                          onClick={() => setDeleteTarget(article)}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editTarget ? '記事を編集' : '記事を新規作成'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="記事タイトルを入力"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">説明文</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  placeholder="記事の説明を入力"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">ステータス</label>
                <div className="flex gap-3">
                  {(['draft', 'published', 'scheduled'] as const).map((s) => (
                    <label
                      key={s}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                        formData.status === s
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={formData.status === s}
                        onChange={() => setFormData({ ...formData, status: s })}
                        className="hidden"
                      />
                      {STATUS_LABELS[s]}
                    </label>
                  ))}
                </div>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    公開日時 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">タグ</label>
                {tags.length === 0 ? (
                  <p className="text-xs text-gray-400">タグがありません。タグ管理から追加してください。</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const selected = formData.selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            selected
                              ? 'border-orange-400 bg-orange-400 text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                          }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Image size={13} />
                    画像管理
                  </span>
                </label>

                <div className="space-y-2 mb-3">
                  {formData.images.length === 0 ? (
                    <p className="text-xs text-gray-400">画像が追加されていません</p>
                  ) : (
                    formData.images.map((img, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 border rounded-lg text-sm transition-colors ${
                          dragIndex === index ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'
                        }`}
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragIndex !== null && dragIndex !== index) {
                            moveImage(dragIndex, index);
                          }
                          setDragIndex(null);
                        }}
                        onDragEnd={() => setDragIndex(null)}
                      >
                        <GripVertical size={14} className="text-gray-400 cursor-grab flex-shrink-0" />
                        <span className="text-xs text-gray-500 w-5 text-center">{index + 1}</span>
                        {img.url && (
                          <img
                            src={img.url}
                            alt=""
                            className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="flex-1 text-xs text-gray-600 truncate min-w-0">{img.url}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => moveImage(index, index - 1)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, index + 1)}
                            disabled={index === formData.images.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                >
                  <Upload size={15} />
                  {uploading ? 'アップロード中...' : '画像を追加'}
                </button>
                <p className="text-xs text-gray-400 mt-1.5">複数ファイルを同時に選択できます</p>
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
                disabled={saving || uploading}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-2">記事を削除しますか？</h3>
            <p className="text-sm text-gray-500 mb-6">
              「<span className="font-medium text-gray-700">{deleteTarget.title}</span>
              」を削除します。この操作は元に戻せません。
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
    </AdminLayout>
  );
}
