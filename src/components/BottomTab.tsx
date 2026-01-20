import { Calendar, Building2, BookOpen, Plus } from 'lucide-react';
import { useRouter } from '../router/Router';

const tabs = [
  { path: '/calendar', icon: Calendar, label: 'カレンダー' },
  { path: '/companies', icon: Building2, label: '企業検索' },
  { path: '/magazine', icon: BookOpen, label: 'マガジン' },
  { path: '/create', icon: Plus, label: '作成', isSpecial: true },
];

export default function BottomTab() {
  const { currentPath, navigate } = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath.startsWith(tab.path);

          if (tab.isSpecial) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white shadow-md"
              >
                <Icon size={20} strokeWidth={2.5} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
