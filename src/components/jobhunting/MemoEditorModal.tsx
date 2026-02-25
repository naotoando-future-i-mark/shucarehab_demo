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
    <div className="fixed inset-0 z-50 flex justify-center bg-black bg-opacity-30">
      <div className="w-full max-w-md bg-white flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={onClose} className="p-1 text-gray-600 hover:text-gray-800">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#FFA52F] text-white text-sm font-medium rounded-lg hover:bg-[#FF9520] transition-colors"
          >
            保存
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[300px] p-3 text-sm text-gray-800 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FFA52F]/50 focus:border-[#FFA52F]"
            placeholder="メモを入力..."
          />
        </div>
      </div>
    </div>
  );
};
