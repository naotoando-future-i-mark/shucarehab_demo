import { useState } from 'react';
import { useRouter } from '../router/Router';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onResetPassword = async () => {
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'パスワードリセットメールの送信に失敗しました');
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
          パスワードリセット
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          登録したメールアドレスにパスワード再設定用のリンクを送信します
        </p>

        {success ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm mb-3">
              パスワードリセット用のメールを送信しました。
            </p>
            <p className="text-green-700 text-xs mb-4">
              メールに記載されたリンクをクリックして、新しいパスワードを設定してください。
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 rounded-lg text-green-700 font-medium border border-green-300 hover:bg-green-50 transition"
            >
              ログインページに戻る
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-2">メールアドレス</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                type="email"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>

            <button
              onClick={onResetPassword}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold
                         bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600
                         hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
            >
              {loading ? '送信中...' : 'リセットメールを送信'}
            </button>

            <button
              onClick={() => navigate('/login')}
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl text-gray-700 font-medium border border-gray-200
                         hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-50"
            >
              ログインページに戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
}
