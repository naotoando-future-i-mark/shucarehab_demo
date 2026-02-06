import { useState } from 'react';
import { useRouter } from '../router/Router';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        navigate('/calendar');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        alert('アカウント作成が完了しました');
        navigate('/calendar');
      }
    } catch (err: any) {
      console.error('SignUp error:', err);
      setError(err.message || 'アカウント作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      alert('パスワードリセットメールを送信しました');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'パスワードリセットに失敗しました');
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

        <h1 className="text-center text-lg font-semibold text-gray-900 mb-8">
          {isSignUp ? '新規会員登録' : 'ログイン'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
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

        <div className="mb-6">
          <label className="block text-sm text-gray-700 mb-2">パスワード</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            type="password"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
            disabled={loading}
          />
        </div>

        <button
          onClick={isSignUp ? onSignUp : onLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-semibold
                     bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500
                     hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
        >
          {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
        </button>

        {!isSignUp && (
          <button
            onClick={onResetPassword}
            disabled={loading}
            className="w-full text-sm text-blue-600 mt-3 disabled:opacity-50"
          >
            パスワードを忘れた方はこちら
          </button>
        )}

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-xl text-white font-semibold
                     bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500
                     hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
        >
          {isSignUp ? 'ログインに戻る' : '新規会員登録'}
        </button>
      </div>
    </div>
  );
}
