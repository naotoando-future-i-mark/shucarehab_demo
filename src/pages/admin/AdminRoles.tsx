import { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

type AdminUser = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

export default function AdminRoles() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [grantError, setGrantError] = useState('');
  const [grantSuccess, setGrantSuccess] = useState('');
  const [granting, setGranting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, email, first_name, last_name, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });
      setAdmins((data ?? []) as AdminUser[]);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleGrant = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setGrantError('メールアドレスを入力してください');
      return;
    }

    setGranting(true);
    setGrantError('');
    setGrantSuccess('');

    try {
      const { data: profile, error: findErr } = await supabase
        .from('user_profiles')
        .select('user_id, email')
        .eq('email', trimmed)
        .maybeSingle();

      if (findErr) throw findErr;

      if (!profile) {
        setGrantError('該当するユーザーが見つかりません');
        return;
      }

      const { error: updateErr } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('user_id', profile.user_id);

      if (updateErr) throw updateErr;

      setGrantSuccess(`${trimmed} を管理者に追加しました`);
      setEmail('');
      await loadAdmins();
    } catch {
      setGrantError('処理に失敗しました');
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (user: AdminUser) => {
    const displayName =
      user.last_name || user.first_name
        ? `${user.last_name ?? ''}${user.first_name ?? ''}`
        : user.email;

    const confirmed = window.confirm(`${displayName} の管理者権限を剥奪しますか？`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'user' })
        .eq('user_id', user.user_id);

      if (error) throw error;
      await loadAdmins();
    } catch {
      alert('権限の剥奪に失敗しました');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">権限管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理者権限の付与・剥奪</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm">管理者権限を付与する</h2>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setGrantError('');
                setGrantSuccess('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleGrant()}
              placeholder="メールアドレスを入力"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              onClick={handleGrant}
              disabled={granting}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {granting ? '処理中...' : '管理者に追加'}
            </button>
          </div>
          {grantError && <p className="text-sm text-red-500">{grantError}</p>}
          {grantSuccess && <p className="text-sm text-green-600">{grantSuccess}</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-700 text-sm">現在の管理者一覧</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              読み込み中...
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Shield size={36} className="text-gray-300" />
              <p className="text-gray-400 text-sm">管理者が見つかりません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      メールアドレス
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      名前
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      付与日
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => {
                    const displayName =
                      admin.last_name || admin.first_name
                        ? `${admin.last_name ?? ''}${admin.first_name ?? ''}`
                        : '未設定';
                    const isSelf = admin.user_id === currentUserId;
                    return (
                      <tr key={admin.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-800">{admin.email}</td>
                        <td className="px-4 py-3 text-gray-600">{displayName}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatDate(admin.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {!isSelf && (
                            <button
                              onClick={() => handleRevoke(admin)}
                              className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                              権限を剥奪
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
