import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface MemoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialContent: string;
  onSave: (content: string) => void;
}

export const MemoEditorModal = ({ isOpen, onClose, title, initialContent, onSave }: MemoEditorModalProps) => {
  const [content, setContent] = useState(initialContent);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#FFA52F] text-white rounded-lg font-medium hover:bg-[#FF8F0F]"
        >
          保存
        </button>
      </div>

      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="メモを入力..."
          className="w-full h-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F] resize-none text-base"
        />
      </div>
    </div>
  );
};
