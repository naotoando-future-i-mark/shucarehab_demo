import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '../router/Router';

export default function MagazineNew() {
  const { navigate } = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('マガジン投稿機能は準備中です');
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/create')} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">マガジン投稿</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              画像
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">クリックして画像をアップロード</p>
              <p className="text-xs text-gray-500">※画像アップロード機能は後で実装予定</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: 面接で聞かれた想定外の質問TOP5"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              本文 <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={8}
              placeholder="就活に役立つ情報を入力してください"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              関連URL
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">記事や企業サイトなど、参考となるURLを入力</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-md"
          >
            投稿する
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
