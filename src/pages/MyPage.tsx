import { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, Mail, Lock, ChevronRight, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';
import Header from '../components/Header';
import BottomTab from '../components/BottomTab';

interface UserProfile {
  university: string;
  faculty: string;
  department: string;
  graduation_year: number | null;
  preferred_locations: string[];
  interested_industries: string[];
}

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    university: '',
    faculty: '',
    department: '',
    graduation_year: null,
    preferred_locations: [],
    interested_industries: [],
  });
  const [email, setEmail] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingLocations, setIsEditingLocations] = useState(false);
  const [isEditingIndustries, setIsEditingIndustries] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || '');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          university: data.university || '',
          faculty: data.faculty || '',
          department: data.department || '',
          graduation_year: data.graduation_year,
          preferred_locations: data.preferred_locations || [],
          interested_industries: data.interested_industries || [],
        });
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
      showToast('プロフィールの読み込みに失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            ...profile,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            ...profile,
          });

        if (error) throw error;
      }

      showToast('プロフィールを保存しました');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('プロフィール保存エラー:', error);
      showToast('プロフィールの保存に失敗しました', 'error');
    }
  };

  const saveLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          preferred_locations: profile.preferred_locations,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      showToast('希望勤務地を保存しました');
      setIsEditingLocations(false);
    } catch (error) {
      console.error('勤務地保存エラー:', error);
      showToast('勤務地の保存に失敗しました', 'error');
    }
  };

  const saveIndustries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          interested_industries: profile.interested_industries,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      showToast('興味のある業界を保存しました');
      setIsEditingIndustries(false);
    } catch (error) {
      console.error('業界保存エラー:', error);
      showToast('業界の保存に失敗しました', 'error');
    }
  };

  const updateEmail = async () => {
    if (!newEmail) {
      showToast('メールアドレスを入力してください', 'error');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      showToast('確認メールを送信しました。メールを確認して変更を完了してください。');
      setNewEmail('');
      setIsEditingEmail(false);
    } catch (error) {
      console.error('メールアドレス更新エラー:', error);
      showToast('メールアドレスの更新に失敗しました', 'error');
    }
  };

  const updatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('パスワードを入力してください', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('パスワードが一致しません', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('パスワードは6文字以上で入力してください', 'error');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      showToast('パスワードを更新しました');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);
    } catch (error) {
      console.error('パスワード更新エラー:', error);
      showToast('パスワードの更新に失敗しました', 'error');
    }
  };

  const addLocation = () => {
    if (locationInput.trim()) {
      setProfile({
        ...profile,
        preferred_locations: [...profile.preferred_locations, locationInput.trim()],
      });
      setLocationInput('');
    }
  };

  const removeLocation = (index: number) => {
    setProfile({
      ...profile,
      preferred_locations: profile.preferred_locations.filter((_, i) => i !== index),
    });
  };

  const addIndustry = () => {
    if (industryInput.trim()) {
      setProfile({
        ...profile,
        interested_industries: [...profile.interested_industries, industryInput.trim()],
      });
      setIndustryInput('');
    }
  };

  const removeIndustry = (index: number) => {
    setProfile({
      ...profile,
      interested_industries: profile.interested_industries.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-16 pb-20 max-w-md mx-auto">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">マイページ</h1>

          <div className="space-y-4">
            {/* プロフィール */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-gray-600" />
                  <h2 className="text-sm font-semibold text-gray-700">プロフィール</h2>
                </div>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-sm text-orange-600 font-medium"
                  >
                    編集
                  </button>
                ) : (
                  <button
                    onClick={saveProfile}
                    className="flex items-center gap-1 text-sm text-orange-600 font-medium"
                  >
                    <Save size={16} />
                    保存
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">大学</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profile.university}
                      onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="〇〇大学"
                    />
                  ) : (
                    <p className="text-gray-800">{profile.university || '未設定'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">学部</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profile.faculty}
                      onChange={(e) => setProfile({ ...profile, faculty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="〇〇学部"
                    />
                  ) : (
                    <p className="text-gray-800">{profile.faculty || '未設定'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">学科</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="〇〇学科"
                    />
                  ) : (
                    <p className="text-gray-800">{profile.department || '未設定'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">卒業年度</label>
                  {isEditingProfile ? (
                    <select
                      value={profile.graduation_year || ''}
                      onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">選択してください</option>
                      {Array.from({ length: 41 }, (_, i) => 2000 + i).map(year => (
                        <option key={year} value={year}>{year}年</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-800">{profile.graduation_year ? `${profile.graduation_year}年` : '未設定'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 希望勤務地 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-gray-600" />
                  <h2 className="text-sm font-semibold text-gray-700">希望勤務地</h2>
                </div>
                {!isEditingLocations ? (
                  <button
                    onClick={() => setIsEditingLocations(true)}
                    className="text-sm text-orange-600 font-medium"
                  >
                    編集
                  </button>
                ) : (
                  <button
                    onClick={saveLocations}
                    className="flex items-center gap-1 text-sm text-orange-600 font-medium"
                  >
                    <Save size={16} />
                    保存
                  </button>
                )}
              </div>

              <div className="p-4">
                {isEditingLocations && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="東京都、大阪府など"
                    />
                    <button
                      onClick={addLocation}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                    >
                      追加
                    </button>
                  </div>
                )}

                {profile.preferred_locations.length === 0 ? (
                  <p className="text-gray-500 text-sm">未設定</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.preferred_locations.map((location, index) => (
                      <div
                        key={index}
                        className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {location}
                        {isEditingLocations && (
                          <button
                            onClick={() => removeLocation(index)}
                            className="text-orange-700 hover:text-orange-900"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 興味のある業界 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-gray-600" />
                  <h2 className="text-sm font-semibold text-gray-700">興味のある業界</h2>
                </div>
                {!isEditingIndustries ? (
                  <button
                    onClick={() => setIsEditingIndustries(true)}
                    className="text-sm text-orange-600 font-medium"
                  >
                    編集
                  </button>
                ) : (
                  <button
                    onClick={saveIndustries}
                    className="flex items-center gap-1 text-sm text-orange-600 font-medium"
                  >
                    <Save size={16} />
                    保存
                  </button>
                )}
              </div>

              <div className="p-4">
                {isEditingIndustries && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={industryInput}
                      onChange={(e) => setIndustryInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addIndustry()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="IT、金融、商社など"
                    />
                    <button
                      onClick={addIndustry}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                    >
                      追加
                    </button>
                  </div>
                )}

                {profile.interested_industries.length === 0 ? (
                  <p className="text-gray-500 text-sm">未設定</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.interested_industries.map((industry, index) => (
                      <div
                        key={index}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {industry}
                        {isEditingIndustries && (
                          <button
                            onClick={() => removeIndustry(index)}
                            className="text-blue-700 hover:text-blue-900"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ログイン情報 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <h2 className="px-4 py-3 text-sm font-semibold text-gray-500 bg-gray-50">ログイン情報</h2>

              {/* メールアドレス */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-700">メールアドレス</h3>
                  </div>
                  {!isEditingEmail ? (
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="text-sm text-orange-600 font-medium"
                    >
                      変更
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingEmail(false)}
                      className="text-sm text-gray-600 font-medium"
                    >
                      キャンセル
                    </button>
                  )}
                </div>

                {!isEditingEmail ? (
                  <p className="text-gray-800 text-sm">{email}</p>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="新しいメールアドレス"
                    />
                    <button
                      onClick={updateEmail}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                    >
                      メールアドレスを変更
                    </button>
                  </div>
                )}
              </div>

              {/* パスワード */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock size={18} className="text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-700">パスワード</h3>
                  </div>
                  {!isEditingPassword ? (
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="text-sm text-orange-600 font-medium"
                    >
                      変更
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingPassword(false)}
                      className="text-sm text-gray-600 font-medium"
                    >
                      キャンセル
                    </button>
                  )}
                </div>

                {!isEditingPassword ? (
                  <p className="text-gray-800 text-sm">••••••••</p>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="新しいパスワード"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="パスワード（確認）"
                    />
                    <button
                      onClick={updatePassword}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                    >
                      パスワードを変更
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomTab />
    </div>
  );
}
