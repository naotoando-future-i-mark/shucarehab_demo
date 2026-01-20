import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '../router/Router';

export default function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { navigate } = useRouter();

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* メニュー */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 bg-white rounded-lg shadow-lg py-2 min-w-48">
          <button
            onClick={() => handleNavigate('/create')}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
          >
            <span className="text-xl">📅</span>
            <span className="text-gray-800">カレンダー作成</span>
          </button>
          <button
            onClick={() => handleNavigate('/company-new')}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
          >
            <span className="text-xl">📝</span>
            <span className="text-gray-800">就活ノート作成</span>
          </button>
        </div>
      )}

      {/* フローティングボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-orange-500 hover:bg-orange-600 rounded-full shadow-lg flex items-center justify-center transition-transform"
        style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
      >
        <Plus size={28} className="text-white" strokeWidth={2.5} />
      </button>
    </>
  );
}
