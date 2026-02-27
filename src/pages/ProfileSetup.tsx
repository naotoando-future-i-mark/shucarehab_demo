import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../router/Router';

export default function ProfileSetup() {
  const { navigate } = useRouter();
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastKana, setLastKana] = useState('');
  const [firstKana, setFirstKana] = useState('');
  const [saving, setSaving] = useState(false);

  const completeProfile = async (withData: boolean) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: Record<string, unknown> = { profile_completed: true };
      if (withData) {
        updateData.last_name = lastName;
        updateData.first_name = firstName;
        updateData.last_kana = lastKana;
        updateData.first_kana = firstKana;
      }

      await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      navigate('/calendar');
    } catch (error) {
      console.error('プロフィール保存エラー:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            就<span className="text-orange-500">カレ</span>HUBへようこそ
          </h1>
          <p className="text-sm text-gray-500">プロフィールを設定してください（任意）</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">姓</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="田中"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">名</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="太郎"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">フリガナ（姓）</label>
              <input
                type="text"
                value={lastKana}
                onChange={(e) => setLastKana(e.target.value)}
                placeholder="タナカ"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">フリガナ（名）</label>
              <input
                type="text"
                value={firstKana}
                onChange={(e) => setFirstKana(e.target.value)}
                placeholder="タロウ"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => completeProfile(true)}
            disabled={saving}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            保存してはじめる
          </button>
          <button
            onClick={() => completeProfile(false)}
            disabled={saving}
            className="w-full py-3 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            スキップ
          </button>
        </div>
      </div>
    </div>
  );
}
