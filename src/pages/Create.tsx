import { Building2, FileText } from 'lucide-react';
import { useRouter } from '../router/Router';

export default function Create() {
  const { navigate } = useRouter();

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">作成</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <p className="text-sm text-gray-600 mb-6">作成したいコンテンツを選択してください</p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/admin/companies/new')}
            className="w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">企業を登録</h3>
                <p className="text-sm text-gray-600">新しい企業情報を登録します</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/magazine/new')}
            className="w-full bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">マガジンを投稿</h3>
                <p className="text-sm text-gray-600">就活に役立つ情報を共有します</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
