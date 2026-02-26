import { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, Eye, Pencil, Ban, Trash2, X, Check, ChevronDown,
  AlertTriangle, Copy, CheckCheck,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase, getCurrentUserId } from '../../lib/supabase';

type UserProfile = {
  id: string;
  user_id: string;
  last_name: string | null;
  first_name: string | null;
  last_kana: string | null;
  first_kana: string | null;
  university: string | null;
  faculty: string | null;
  department: string | null;
  graduation_year: number | null;
  preferred_locations: string[] | null;
  interested_industries: string[] | null;
  created_at: string | null;
};

type UserBan = {
  id: string;
  user_id: string;
  reason: string;
  banned_at: string;
  banned_by: string | null;
  unbanned_at: string | null;
};

type UserRow = UserProfile & {
  email: string | null;
  last_login: string | null;
  isBanned: boolean;
  activeBan: UserBan | null;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 font-mono text-xs text-gray-500 hover:text-gray-800 group"
      title={id}
    >
      <span>{id.slice(0, 8)}</span>
      {copied
        ? <CheckCheck size={12} className="text-green-500" />
        : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
}

function DetailModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [bans, setBans] = useState<UserBan[]>([]);

  useEffect(() => {
    supabase
      .from('user_bans')
      .select('*')
      .eq('user_id', user.user_id)
      .order('banned_at', { ascending: false })
      .then(({ data }) => setBans(data ?? []));
  }, [user.user_id]);

  const fullName = [user.last_name, user.first_name].filter(Boolean).join(' ') || '—';
  const fullKana = [user.last_kana, user.first_kana].filter(Boolean).join(' ') || '—';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-800">ユーザー詳細</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">基本情報</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <DetailRow label="ID" value={<span className="font-mono text-xs break-all">{user.user_id}</span>} />
              <DetailRow label="ステータス" value={
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {user.isBanned ? '停止中' : '有効'}
                </span>
              } />
              <DetailRow label="氏名" value={fullName} />
              <DetailRow label="フリガナ" value={fullKana} />
              <DetailRow label="メールアドレス" value={user.email ?? '—'} />
              <DetailRow label="大学" value={user.university ?? '—'} />
              <DetailRow label="学部" value={user.faculty ?? '—'} />
              <DetailRow label="学科" value={user.department ?? '—'} />
              <DetailRow label="卒業年度" value={user.graduation_year ? `${user.graduation_year}年` : '—'} />
              <DetailRow label="希望勤務地" value={(user.preferred_locations ?? []).join(', ') || '—'} />
              <DetailRow label="興味のある業界" value={(user.interested_industries ?? []).join(', ') || '—'} />
              <DetailRow label="登録日" value={formatDateTime(user.created_at)} />
              <DetailRow label="最終ログイン" value={formatDateTime(user.last_login)} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">停止履歴</h3>
            {bans.length === 0 ? (
              <p className="text-sm text-gray-400">停止履歴はありません</p>
            ) : (
              <div className="space-y-2">
                {bans.map((ban) => (
                  <div key={ban.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ban.unbanned_at ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                        {ban.unbanned_at ? '解除済み' : '停止中'}
                      </span>
                      <span className="text-gray-400 text-xs">{formatDateTime(ban.banned_at)}</span>
                    </div>
                    <p className="text-gray-700 font-medium">{ban.reason}</p>
                    {ban.unbanned_at && (
                      <p className="text-gray-400 text-xs mt-1">解除日時: {formatDateTime(ban.unbanned_at)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-gray-800">{value}</dd>
    </div>
  );
}

function EditModal({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    last_name: user.last_name ?? '',
    first_name: user.first_name ?? '',
    last_kana: user.last_kana ?? '',
    first_kana: user.first_kana ?? '',
    university: user.university ?? '',
    faculty: user.faculty ?? '',
    department: user.department ?? '',
    graduation_year: user.graduation_year?.toString() ?? '',
    preferred_locations: (user.preferred_locations ?? []).join(', '),
    interested_industries: (user.interested_industries ?? []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('user_profiles')
        .update({
          last_name: form.last_name || null,
          first_name: form.first_name || null,
          last_kana: form.last_kana || null,
          first_kana: form.first_kana || null,
          university: form.university || null,
          faculty: form.faculty || null,
          department: form.department || null,
          graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
          preferred_locations: form.preferred_locations ? form.preferred_locations.split(',').map(s => s.trim()).filter(Boolean) : [],
          interested_industries: form.interested_industries ? form.interested_industries.split(',').map(s => s.trim()).filter(Boolean) : [],
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.user_id);

      if (err) throw err;
      onSaved();
      onClose();
    } catch (e) {
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, name, placeholder }: { label: string; name: keyof typeof form; placeholder?: string }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={form[name]}
        onChange={(e) => setForm(prev => ({ ...prev, [name]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-800">ユーザー編集</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="姓" name="last_name" placeholder="山田" />
            <Field label="名" name="first_name" placeholder="太郎" />
            <Field label="姓（フリガナ）" name="last_kana" placeholder="ヤマダ" />
            <Field label="名（フリガナ）" name="first_kana" placeholder="タロウ" />
          </div>
          <Field label="大学" name="university" placeholder="〇〇大学" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="学部" name="faculty" placeholder="経済学部" />
            <Field label="学科" name="department" placeholder="経済学科" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">卒業年度</label>
            <input
              type="number"
              value={form.graduation_year}
              onChange={(e) => setForm(prev => ({ ...prev, graduation_year: e.target.value }))}
              placeholder="2025"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <Field label="希望勤務地（カンマ区切り）" name="preferred_locations" placeholder="東京, 大阪" />
          <Field label="興味のある業界（カンマ区切り）" name="interested_industries" placeholder="IT, 金融" />

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BanModal({ user, onClose, onDone }: { user: UserRow; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleBan = async () => {
    if (!reason.trim()) { setError('理由を入力してください'); return; }
    setSaving(true);
    setError('');
    try {
      const adminId = await getCurrentUserId();
      const { error: err } = await supabase.from('user_bans').insert([{
        user_id: user.user_id,
        reason: reason.trim(),
        banned_at: new Date().toISOString(),
        banned_by: adminId,
      }]);
      if (err) throw err;
      onDone();
      onClose();
    } catch {
      setError('停止処理に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Ban size={18} className="text-red-500" />
            ユーザーを停止
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{[user.last_name, user.first_name].filter(Boolean).join(' ') || user.email || user.user_id.slice(0, 8)}</span> を停止します。
          </p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">停止理由 <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              placeholder="停止理由を入力してください"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            キャンセル
          </button>
          <button
            onClick={handleBan}
            disabled={saving}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Ban size={14} />
            {saving ? '処理中...' : '停止する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ user, onClose, onDone }: { user: UserRow; onClose: () => void; onDone: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.user_id);
      if (err) throw err;
      onDone();
      onClose();
    } catch {
      setError('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const displayName = [user.last_name, user.first_name].filter(Boolean).join(' ') || user.email || user.user_id.slice(0, 8);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">ユーザーを削除しますか？</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-medium text-gray-700">{displayName}</span> のプロフィールデータが削除されます。
            </p>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 px-6 pb-3">{error}</p>}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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
  | { type: 'detail'; user: UserRow }
  | { type: 'edit'; user: UserRow }
  | { type: 'ban'; user: UserRow }
  | { type: 'delete'; user: UserRow }
  | null;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, bansRes] = await Promise.all([
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_bans').select('*').is('unbanned_at', null),
      ]);

      const profiles: UserProfile[] = profilesRes.data ?? [];
      const activeBans: UserBan[] = bansRes.data ?? [];

      const activeBanMap = new Map<string, UserBan>();
      activeBans.forEach((ban) => activeBanMap.set(ban.user_id, ban));

      const rows: UserRow[] = profiles.map((p) => {
        const activeBan = activeBanMap.get(p.user_id) ?? null;
        return {
          ...p,
          email: null,
          last_login: null,
          isBanned: !!activeBan,
          activeBan,
        };
      });

      setUsers(rows);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUnban = async (user: UserRow) => {
    if (!user.activeBan) return;
    try {
      await supabase
        .from('user_bans')
        .update({ unbanned_at: new Date().toISOString() })
        .eq('id', user.activeBan.id);
      loadUsers();
    } catch {
      console.error('Unban failed');
    }
  };

  const graduationYears = Array.from(new Set(users.map(u => u.graduation_year).filter(Boolean))).sort() as number[];

  const filteredUsers = users.filter((u) => {
    const fullName = [u.last_name, u.first_name].filter(Boolean).join('');
    if (searchName && !fullName.includes(searchName)) return false;
    if (searchEmail && !(u.email ?? '').toLowerCase().includes(searchEmail.toLowerCase())) return false;
    if (filterYear && u.graduation_year?.toString() !== filterYear) return false;
    if (filterStatus === 'active' && u.isBanned) return false;
    if (filterStatus === 'banned' && !u.isBanned) return false;
    return true;
  });

  const exportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['ID', '姓', '名', '姓カナ', '名カナ', 'メール', '大学', '学部', '学科', '卒業年度', '希望勤務地', '興味のある業界', '登録日', '最終ログイン', 'ステータス'];
    const rows = users.map((u) => [
      u.user_id,
      u.last_name ?? '',
      u.first_name ?? '',
      u.last_kana ?? '',
      u.first_kana ?? '',
      u.email ?? '',
      u.university ?? '',
      u.faculty ?? '',
      u.department ?? '',
      u.graduation_year?.toString() ?? '',
      (u.preferred_locations ?? []).join('|'),
      (u.interested_industries ?? []).join('|'),
      formatDate(u.created_at),
      formatDate(u.last_login),
      u.isBanned ? '停止' : '有効',
    ].map((v) => `"${v.replace(/"/g, '""')}"`).join(','));

    const csv = BOM + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ユーザー管理</h1>
            <p className="text-sm text-gray-500 mt-1">登録ユーザーの管理・編集・停止</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={16} />
            CSVエクスポート
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="名前で検索"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="メールアドレスで検索"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="">卒業年度: 全て</option>
                {graduationYears.map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'banned')}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="all">ステータス: 全員</option>
                <option value="active">有効</option>
                <option value="banned">停止</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <p className="text-xs text-gray-400">{filteredUsers.length} 件表示</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">読み込み中...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">ユーザーが見つかりません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">名前</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">メール</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">大学</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">卒業年度</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">登録日</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">最終ログイン</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">ステータス</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <CopyId id={user.user_id} />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {[user.last_name, user.first_name].filter(Boolean).join(' ') || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{user.university ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{user.graduation_year ? `${user.graduation_year}年` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(user.last_login)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${user.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {user.isBanned ? <Ban size={11} /> : <Check size={11} />}
                          {user.isBanned ? '停止' : '有効'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <ActionButton
                            icon={<Eye size={14} />}
                            label="詳細"
                            color="blue"
                            onClick={() => setModal({ type: 'detail', user })}
                          />
                          <ActionButton
                            icon={<Pencil size={14} />}
                            label="編集"
                            color="gray"
                            onClick={() => setModal({ type: 'edit', user })}
                          />
                          {user.isBanned ? (
                            <ActionButton
                              icon={<Check size={14} />}
                              label="解除"
                              color="green"
                              onClick={() => handleUnban(user)}
                            />
                          ) : (
                            <ActionButton
                              icon={<Ban size={14} />}
                              label="停止"
                              color="red"
                              onClick={() => setModal({ type: 'ban', user })}
                            />
                          )}
                          <ActionButton
                            icon={<Trash2 size={14} />}
                            label="削除"
                            color="red"
                            onClick={() => setModal({ type: 'delete', user })}
                          />
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

      {modal?.type === 'detail' && (
        <DetailModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <EditModal user={modal.user} onClose={() => setModal(null)} onSaved={loadUsers} />
      )}
      {modal?.type === 'ban' && (
        <BanModal user={modal.user} onClose={() => setModal(null)} onDone={loadUsers} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal user={modal.user} onClose={() => setModal(null)} onDone={loadUsers} />
      )}
    </AdminLayout>
  );
}

function ActionButton({
  icon, label, color, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'gray' | 'red' | 'green';
  onClick: () => void;
}) {
  const colorClass = {
    blue: 'text-blue-600 hover:bg-blue-50',
    gray: 'text-gray-600 hover:bg-gray-100',
    red: 'text-red-500 hover:bg-red-50',
    green: 'text-green-600 hover:bg-green-50',
  }[color];

  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${colorClass}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
