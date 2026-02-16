import { useState } from 'react';
import { LogOut, Trash2, FileText, Shield, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../router/Router';
import Header from '../components/Header';
import BottomTab from '../components/BottomTab';

export default function Settings() {
  const { navigate } = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    const confirmed = window.confirm('ログアウトしますか？');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('アカウントを削除しますか？この操作は取り消せません。');
    if (!confirmed) return;

    const doubleConfirm = window.confirm('本当に削除しますか？すべてのデータが失われます。');
    if (!doubleConfirm) return;

    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('ユーザー情報を取得できませんでした');
        return;
      }

      await Promise.all([
        supabase.from('events').delete().eq('user_id', user.id),
        supabase.from('color_presets').delete().eq('user_id', user.id),
        supabase.from('companies').delete().eq('user_id', user.id),
        supabase.from('memos').delete().eq('user_id', user.id),
      ]);

      await supabase.auth.signOut();
      navigate('/login');
      alert('アカウントを削除しました');
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      alert('アカウント削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsClick = () => {
    alert('利用規約ページ（準備中）');
  };

  const handlePrivacyClick = () => {
    alert('プライバシーポリシーページ（準備中）');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-16 pb-20 max-w-md mx-auto">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">設定</h1>

          <div className="space-y-4">
            {/* アカウント設定 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <h2 className="px-4 py-3 text-sm font-semibold text-gray-500 bg-gray-50">アカウント</h2>

              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <LogOut size={20} className="text-orange-600" />
                  </div>
                  <span className="text-gray-800 font-medium">ログアウト</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>

              <div className="border-t border-gray-100"></div>

              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                  <span className="text-red-600 font-medium">アカウント削除</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>

            {/* 法的情報 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <h2 className="px-4 py-3 text-sm font-semibold text-gray-500 bg-gray-50">法的情報</h2>

              <button
                onClick={handleTermsClick}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <span className="text-gray-800 font-medium">利用規約</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>

              <div className="border-t border-gray-100"></div>

              <button
                onClick={handlePrivacyClick}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield size={20} className="text-green-600" />
                  </div>
                  <span className="text-gray-800 font-medium">プライバシーポリシー</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>

            {/* アプリ情報 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <h2 className="px-4 py-3 text-sm font-semibold text-gray-500 bg-gray-50">アプリ情報</h2>
              <div className="px-4 py-4">
                <p className="text-gray-600 text-sm">バージョン: 1.0.0</p>
                <p className="text-gray-600 text-sm mt-1">© 2026 就カレHUB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomTab />
    </div>
  );
}
