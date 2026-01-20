import { useState } from 'react';
import { useRouter } from '../router/Router';

const AUTH_KEY = 'shukarehub_auth';

export default function Login() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = () => {
    if (!email.trim() || !password.trim()) {
      alert('メールアドレスとパスワードを入力してください');
      return;
    }
    // MVPなので一旦 “ログインした扱い” にする（後でSupabase等に差し替えOK）
    localStorage.setItem(AUTH_KEY, '1');
    navigate('/calendar'); // ここを最初に見せたいページに変えてOK（/companies とか）
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-700">hub</span>
          </div>
          <div className="text-2xl font-semibold">
            <span className="text-gray-700">就カレ</span>
            <span className="text-orange-500">hub</span>
          </div>
        </div>

        <h1 className="text-center text-lg font-semibold text-gray-900 mb-8">ログイン</h1>

        {/* メール */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">メールアドレス</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            type="email"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* パスワード */}
        <div className="mb-6">
          <label className="block text-sm text-gray-700 mb-2">パスワード</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            type="password"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* ログインボタン */}
        <button
          onClick={onLogin}
          className="w-full py-3 rounded-xl text-white font-semibold
                     bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500
                     hover:opacity-95 active:opacity-90 transition"
        >
          ログイン
        </button>

        <button
          onClick={() => alert('MVPでは未対応（あとで追加OK）')}
          className="w-full text-sm text-blue-600 mt-3"
        >
          パスワードを忘れた方はこちら
        </button>

        {/* 新規会員登録 */}
        <button
          onClick={() => alert('MVPでは未対応（あとで追加OK）')}
          className="w-full mt-6 py-3 rounded-xl text-white font-semibold
                     bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500
                     hover:opacity-95 active:opacity-90 transition"
        >
          新規会員登録
        </button>

        <button
          onClick={() => alert('利用規約：MVPではリンク仮置き')}
          className="w-full text-sm text-blue-600 mt-3"
        >
          利用規約はこちら
        </button>
      </div>
    </div>
  );
}
