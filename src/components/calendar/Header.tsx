import { Menu, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentDate: Date;
  onTodayClick: () => void;
  onYearMonthClick: () => void;
}

export const Header = ({ currentDate, onTodayClick, onYearMonthClick }: HeaderProps) => {
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2">
        <button className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <button
          onClick={onYearMonthClick}
          className="flex items-center gap-1 px-2.5 py-1 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span className="text-base font-semibold">
            {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>
        <button
          onClick={onTodayClick}
          className="px-2 py-0.5 text-[10px] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          今日
        </button>
      </div>

      <button className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell size={20} />
      </button>
    </header>
  );
};
