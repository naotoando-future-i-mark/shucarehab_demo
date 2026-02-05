import { Calendar, Building2, BookOpen, FileText } from 'lucide-react';
import { useRouter } from '../router/Router';

const tabs = [
  { path: '/calendar', icon: Calendar, label: 'カレンダー' },
  { path: '/companies', icon: Building2, label: '企業検索' },
  { path: '/magazine', icon: BookOpen, label: '就活マガジン' },
  { path: '/notes', icon: FileText, label: '就活ノート' },
];

export default function BottomTab() {
  const { currentPath, navigate } = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath.startsWith(tab.path);

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
