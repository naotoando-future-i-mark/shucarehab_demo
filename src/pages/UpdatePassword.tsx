import { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { supabase } from '../lib/supabase';

export default function UpdatePassword() {
  const { navigate } = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('パスワードリセット用のリンクが無効です。もう一度リセットをお試しください。');
      } else {
        setHasSession(true);
      }
    };
    checkSession();
  }, []);

  const onUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setError('新しいパスワードとパスワード確認を入力してください');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      alert('パスワードを変更しました。新しいパスワードでログインしてください。');

      await supabase.auth.signOut();

      navigate('/login');
    } catch (err: any) {
      console.error('Update password error:', err);
      setError(err.message || 'パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">hub</span>
          </div>
          <div className="text-2xl font-semibold">
            <span className="text-gray-700">就カレ</span>
            <span className="text-orange-500">hub</span>
          </div>
        </div>

        <h1 className="text-center text-lg font-semibold text-gray-900 mb-2">
          新しいパスワードの設定
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          新しいパスワードを入力してください
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {hasSession ? (
          <>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">新しいパスワード</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="新しいパスワード（6文字以上）"
                type="password"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-2">パスワード確認</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワード再入力"
                type="password"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>

            <button
              onClick={onUpdatePassword}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold
                         bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600
                         hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
            >
              {loading ? '変更中...' : 'パスワードを変更'}
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/reset-password')}
            className="w-full py-3 rounded-xl text-white font-semibold
                       bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600
                       hover:opacity-95 active:opacity-90 transition"
          >
            パスワードリセットページに戻る
          </button>
        )}
      </div>
    </div>
  );
}
