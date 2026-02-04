import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface YearMonthSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
}

export const YearMonthSelector = ({ isOpen, onClose, currentDate, onSelectDate }: YearMonthSelectorProps) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);

  useEffect(() => {
    setSelectedYear(currentDate.getFullYear());
  }, [currentDate]);

  if (!isOpen) return null;

  const handleMonthSelect = (monthIndex: number) => {
    onSelectDate(new Date(selectedYear, monthIndex, 1));
    handleClose();
  };

  const handleClose = () => {
    setStartY(null);
    setCurrentY(null);
    onClose();
  };

  // ドラッグで閉じる処理
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY !== null) {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 0) setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentY !== null && currentY > 100) {
      handleClose();
    } else {
      setCurrentY(null);
    }
    setStartY(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => setStartY(e.clientY);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startY !== null) {
      const deltaY = e.clientY - startY;
      if (deltaY > 0) setCurrentY(deltaY);
    }
  };

  const handleMouseUp = () => {
    if (currentY !== null && currentY > 100) {
      handleClose();
    } else {
      setCurrentY(null);
    }
    setStartY(null);
  };

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* モーダル */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up transition-transform"
        style={{ transform: currentY ? `translateY(${currentY}px)` : 'translateY(0)' }}
      >
        {/* ヘッダー（ドラッグ可能） */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={startY !== null ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <h3 className="text-lg font-semibold text-gray-800">年月を選択</h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* 年選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">年</label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="text-2xl font-semibold text-gray-800 min-w-[120px] text-center">
                {selectedYear}年
              </span>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* 月選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">月</label>
            <div className="grid grid-cols-4 gap-2">
              {months.map((month, index) => (
                <button
                  key={index}
                  onClick={() => handleMonthSelect(index)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentDate.getMonth() === index && currentDate.getFullYear() === selectedYear
                      ? 'bg-[#FFA52F] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
