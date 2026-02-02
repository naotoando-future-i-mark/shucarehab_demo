import { Plus } from 'lucide-react';

export default function FloatingButton() {
  // カレンダーページ内のモーダルを開くためのカスタムイベントを発火
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('openAddEventModal'));
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto relative">
        <button
          onClick={handleClick}
          className="absolute bottom-0 right-4 w-14 h-14 bg-orange-500 hover:bg-orange-600 rounded-full shadow-lg flex items-center justify-center pointer-events-auto"
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
