import { useState } from 'react';
import { Pencil, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';
import { CompanyNote } from '../../types/company';
import { EditModal } from './EditModal';

interface MyPageInfoBlockProps {
  companyNote: CompanyNote;
  onUpdate: (updates: Partial<CompanyNote>) => void;
}

export const MyPageInfoBlock = ({ companyNote, onUpdate }: MyPageInfoBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    mypage_url: companyNote.mypage_url,
    login_id: companyNote.login_id,
    password: companyNote.password,
    login_notes: companyNote.login_notes,
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">マイページ情報</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Pencil size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">マイページURL</label>
            {formData.mypage_url ? (
              <a
                href={formData.mypage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#FFA52F] hover:text-[#FF8F0F]"
              >
                <span className="truncate">{formData.mypage_url}</span>
                <ExternalLink size={14} className="flex-shrink-0" />
              </a>
            ) : (
              <p className="text-sm text-gray-400">未設定</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ログインID</label>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-900 flex-1 truncate">{formData.login_id || '未設定'}</p>
              {formData.login_id && (
                <button onClick={() => copyToClipboard(formData.login_id)} className="p-1.5 hover:bg-gray-100 rounded">
                  <Copy size={14} className="text-gray-500" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">パスワード</label>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-900 flex-1 font-mono">
                {formData.password ? (showPassword ? formData.password : '●'.repeat(Math.min(formData.password.length, 12))) : '未設定'}
              </p>
              {formData.password && (
                <>
                  <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 hover:bg-gray-100 rounded">
                    {showPassword ? <EyeOff size={14} className="text-gray-500" /> : <Eye size={14} className="text-gray-500" />}
                  </button>
                  <button onClick={() => copyToClipboard(formData.password)} className="p-1.5 hover:bg-gray-100 rounded">
                    <Copy size={14} className="text-gray-500" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">備考</label>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.login_notes || '未設定'}</p>
          </div>
        </div>
      </div>

      <EditModal isOpen={isEditing} onClose={() => setIsEditing(false)} title="マイページ情報を編集">
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">マイページURL</label>
            <input
              type="url"
              value={formData.mypage_url}
              onChange={(e) => setFormData({ ...formData, mypage_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ログインID</label>
            <input
              type="text"
              value={formData.login_id}
              onChange={(e) => setFormData({ ...formData, login_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">パスワード</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">備考</label>
            <textarea
              value={formData.login_notes}
              onChange={(e) => setFormData({ ...formData, login_notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F] resize-none"
              placeholder="例: 2段階認証あり"
            />
          </div>

          <button onClick={handleSave} className="w-full py-3 bg-[#FFA52F] text-white rounded-lg font-medium hover:bg-[#FF9A1F]">
            保存
          </button>
        </div>
      </EditModal>
    </>
  );
};
