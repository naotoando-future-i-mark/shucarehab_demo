import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from '../router/Router';

const menuItems = [
  { path: '/calendar', icon: '📅', label: 'カレンダー' },
  { path: '/companies', icon: '🏢', label: '企業を探す' },
  { path: '/magazine', icon: '📰', label: '就活マガジン' },
  { path: '/memo', icon: '📝', label: '就活ノート' },
  { path: '/mypage', icon: '👤', label: 'マイページ' },
  { path: '/settings', icon: '⚙️', label: '設定' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { navigate } = useRouter();

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 text-gray-600"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold">
            就<span className="text-orange-500">カレ</span>HUB
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* サイドメニュー */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-end">
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-600">
            <X size={24} />
          </button>
        </div>
        <nav className="py-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="w-full px-4 py-4 flex items-center gap-4 hover:bg-gray-50 text-left"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-gray-800">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
