import { useState } from 'react';
import { Pencil, ChevronRight, Plus } from 'lucide-react';
import { CompanyMemo } from '../../types/company';
import { MemoEditorModal } from './MemoEditorModal';

interface CompanyMemosBlockProps {
  companyNoteId: string;
  memos: CompanyMemo[];
  onAddMemo: (memo: Omit<CompanyMemo, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateMemo: (memoId: string, updates: Partial<CompanyMemo>) => void;
}

type Category = '企業研究' | '面接対策' | 'ES';
const fixedCategories: Category[] = ['企業研究', '面接対策', 'ES'];

export const CompanyMemosBlock = ({ companyNoteId, memos, onAddMemo, onUpdateMemo }: CompanyMemosBlockProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [editingMemo, setEditingMemo] = useState<{ memo: CompanyMemo | null; category: string } | null>(null);

  const getPreviewText = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const getMemoForCategory = (category: string): CompanyMemo | undefined => {
    return memos.find((m) => m.category === category && !m.is_deleted);
  };

  const customMemos = memos.filter((m) => !fixedCategories.includes(m.category as Category) && !m.is_deleted);

  const handleAddNewMemo = () => {
    if (newMemoTitle.trim()) {
      setEditingMemo({ memo: null, category: newMemoTitle.trim() });
      setNewMemoTitle('');
      setIsAddingNew(false);
    }
  };

  const handleSaveMemo = (content: string) => {
    if (!editingMemo) return;

    if (editingMemo.memo) {
      onUpdateMemo(editingMemo.memo.id, { content });
    } else {
      onAddMemo({
        company_note_id: companyNoteId,
        category: editingMemo.category as CompanyMemo['category'],
        title: editingMemo.category,
        content,
      });
    }
    setEditingMemo(null);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">選考対策メモ</h3>
          <button onClick={() => setIsAddingNew(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Plus size={18} className="text-[#FFA52F]" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {fixedCategories.map((category) => {
            const memo = getMemoForCategory(category);
            const previewText = memo ? getPreviewText(memo.content) : '';

            return (
              <button
                key={category}
                onClick={() => setEditingMemo({ memo: memo || null, category })}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#FFA52F] hover:bg-orange-50 text-left group"
              >
                <Pencil size={20} className="text-[#FFA52F] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">{category}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{previewText || 'メモを追加...'}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400 flex-shrink-0 group-hover:text-[#FFA52F]" />
              </button>
            );
          })}

          {customMemos.map((memo) => (
            <button
              key={memo.id}
              onClick={() => setEditingMemo({ memo, category: memo.category })}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#FFA52F] hover:bg-orange-50 text-left group"
            >
              <Pencil size={20} className="text-[#FFA52F] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-1">{memo.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{getPreviewText(memo.content) || 'メモを追加...'}</p>
              </div>
              <ChevronRight size={18} className="text-gray-400 flex-shrink-0 group-hover:text-[#FFA52F]" />
            </button>
          ))}

          {isAddingNew && (
            <div className="border border-[#FFA52F] rounded-xl p-3 bg-orange-50">
              <input
                type="text"
                placeholder="メモのタイトルを入力"
                value={newMemoTitle}
                onChange={(e) => setNewMemoTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNewMemo()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F] mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsAddingNew(false); setNewMemoTitle(''); }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddNewMemo}
                  disabled={!newMemoTitle.trim()}
                  className="flex-1 px-3 py-2 bg-[#FFA52F] text-white rounded-lg text-sm font-medium hover:bg-[#FF8F0F] disabled:opacity-50"
                >
                  作成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingMemo && (
        <MemoEditorModal
          isOpen={true}
          onClose={() => setEditingMemo(null)}
          title={editingMemo.category}
          initialContent={editingMemo.memo?.content || ''}
          onSave={handleSaveMemo}
        />
      )}
    </>
  );
};
