import { useState } from 'react';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import { ReferenceSite } from '../../types/company';

interface ReferenceSitesBlockProps {
  sites: ReferenceSite[];
  onAddSite: (name: string, url: string) => void;
  onDeleteSite: (siteId: string) => void;
}

export const ReferenceSitesBlock = ({ sites, onAddSite, onDeleteSite }: ReferenceSitesBlockProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (newName.trim() && newUrl.trim()) {
      onAddSite(newName.trim(), newUrl.trim());
      setNewName('');
      setNewUrl('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">参考サイト</h3>
        <button onClick={() => setIsAdding(true)} className="p-2 hover:bg-gray-100 rounded-lg">
          <Plus size={18} className="text-[#FFA52F]" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        {sites.length === 0 && !isAdding && (
          <p className="text-sm text-gray-400 text-center py-4">参考サイトを追加してください</p>
        )}

        {sites.map((site) => (
          <div key={site.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl group">
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-2 text-sm text-[#FFA52F] hover:text-[#FF8F0F] truncate"
            >
              <span className="truncate">{site.name}</span>
              <ExternalLink size={14} className="flex-shrink-0" />
            </a>
            <button
              onClick={() => onDeleteSite(site.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        ))}

        {isAdding && (
          <div className="border border-[#FFA52F] rounded-xl p-3 bg-orange-50 space-y-2">
            <input
              type="text"
              placeholder="サイト名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
              autoFocus
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setIsAdding(false); setNewName(''); setNewUrl(''); }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !newUrl.trim()}
                className="flex-1 px-3 py-2 bg-[#FFA52F] text-white rounded-lg text-sm font-medium hover:bg-[#FF8F0F] disabled:opacity-50"
              >
                追加
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
