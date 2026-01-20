import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '../router/Router';

export default function CompanyNew() {
  const { navigate } = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    url: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('企業登録機能は準備中です');
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/create')} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">企業登録</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              会社名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: 株式会社サンプル"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">※将来的に企業サジェスト機能を追加予定</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              業種 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              <option value="IT・インターネット">IT・インターネット</option>
              <option value="商社（総合）">商社（総合）</option>
              <option value="商社（専門）">商社（専門）</option>
              <option value="電機・精密機器">電機・精密機器</option>
              <option value="金融">金融</option>
              <option value="コンサルティング">コンサルティング</option>
              <option value="広告・マーケティング">広告・マーケティング</option>
              <option value="メーカー">メーカー</option>
              <option value="人材・教育">人材・教育</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              企業URL
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              企業概要
            </label>
            <textarea
              rows={5}
              placeholder="企業の事業内容や特徴を入力してください"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-colors"
          >
            企業を登録
          </button>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
