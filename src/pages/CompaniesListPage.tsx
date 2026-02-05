import { useState, useEffect } from 'react';
import { Plus, Building2, Search, Trash2 } from 'lucide-react';
import { Company, SelectionProgress } from '../types/company';

interface CompaniesListPageProps {
  onCompanySelect: (companyId: string) => void;
}

interface CompanyWithProgress extends Company {
  latestProgress?: {
    trackType: 'intern' | 'fulltime';
    stage: string;
  };
}

const COMPANIES_STORAGE_KEY = 'shukarehub_companies';
const COMPANY_NOTES_STORAGE_KEY = 'shukarehub_company_notes';
const SELECTION_PROGRESS_STORAGE_KEY = 'shukarehub_selection_progress';

export const CompaniesListPage = ({ onCompanySelect }: CompaniesListPageProps) => {
  const [companies, setCompanies] = useState<CompanyWithProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = () => {
    const savedCompanies = localStorage.getItem(COMPANIES_STORAGE_KEY);
    const savedProgress = localStorage.getItem(SELECTION_PROGRESS_STORAGE_KEY);
    const savedNotes = localStorage.getItem(COMPANY_NOTES_STORAGE_KEY);

    const companiesData: Company[] = savedCompanies ? JSON.parse(savedCompanies) : [];
    const progressData: SelectionProgress[] = savedProgress ? JSON.parse(savedProgress) : [];
    const notesData = savedNotes ? JSON.parse(savedNotes) : [];

    const noteIdToCompanyId = new Map(notesData.map((n: any) => [n.id, n.company_id]));

    const companyProgressMap = new Map<string, SelectionProgress>();
    progressData.forEach(progress => {
      const companyId = noteIdToCompanyId.get(progress.company_note_id);
      if (!companyId) return;
      const existing = companyProgressMap.get(companyId);
      if (!existing || new Date(progress.created_at) > new Date(existing.created_at)) {
        companyProgressMap.set(companyId, progress);
      }
    });

    const companiesWithProgress: CompanyWithProgress[] = companiesData
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .map(company => {
        const latestProgress = companyProgressMap.get(company.id);
        return {
          ...company,
          latestProgress: latestProgress ? {
            trackType: latestProgress.track_type,
            stage: latestProgress.stage,
          } : undefined,
        };
      });

    setCompanies(companiesWithProgress);
  };

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) return;

    const now = new Date().toISOString();
    const newCompany: Company = {
      id: crypto.randomUUID(),
      name: newCompanyName.trim(),
      created_at: now,
      updated_at: now,
    };

    const savedCompanies = localStorage.getItem(COMPANIES_STORAGE_KEY);
    const companiesData: Company[] = savedCompanies ? JSON.parse(savedCompanies) : [];
    companiesData.push(newCompany);
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companiesData));

    const savedNotes = localStorage.getItem(COMPANY_NOTES_STORAGE_KEY);
    const notesData = savedNotes ? JSON.parse(savedNotes) : [];
    notesData.push({
      id: crypto.randomUUID(),
      company_id: newCompany.id,
      industry: '',
      job_type: '',
      location: '',
      employee_count: '',
      listing_status: '',
      base_salary: '',
      web_test: '',
      working_hours: '',
      mypage_url: '',
      login_id: '',
      password: '',
      login_notes: '',
      custom_fields: [],
      free_memo: '',
      created_at: now,
      updated_at: now,
    });
    localStorage.setItem(COMPANY_NOTES_STORAGE_KEY, JSON.stringify(notesData));

    setCompanies([{ ...newCompany, latestProgress: undefined }, ...companies]);
    setNewCompanyName('');
    setShowAddModal(false);
  };

  const handleDeleteCompany = (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('この企業を削除してもよろしいですか？')) return;

    const savedCompanies = localStorage.getItem(COMPANIES_STORAGE_KEY);
    const companiesData: Company[] = savedCompanies ? JSON.parse(savedCompanies) : [];
    const filtered = companiesData.filter(c => c.id !== companyId);
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(filtered));

    const savedNotes = localStorage.getItem(COMPANY_NOTES_STORAGE_KEY);
    const notesData = savedNotes ? JSON.parse(savedNotes) : [];
    const filteredNotes = notesData.filter((n: any) => n.company_id !== companyId);
    localStorage.setItem(COMPANY_NOTES_STORAGE_KEY, JSON.stringify(filteredNotes));

    setCompanies(companies.filter(c => c.id !== companyId));
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">就活ノート</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="企業名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-3">
        {filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Building2 size={64} className="mb-4 opacity-30" />
            <p className="text-center">
              {searchQuery ? '該当する企業が見つかりません' : '企業を追加してください'}
            </p>
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <div
              key={company.id}
              onClick={() => onCompanySelect(company.id)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFA52F] to-[#FF8F0F] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Building2 size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(company.updated_at).toLocaleDateString('ja-JP')} 更新
                    </p>
                    {company.latestProgress && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs font-medium text-gray-600">選考状況:</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm ${
                          company.latestProgress.trackType === 'intern'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : 'bg-gradient-to-r from-[#FF8F0F] to-[#FFA52F] text-white'
                        }`}>
                          {company.latestProgress.trackType === 'intern' ? 'インターン' : '本選考'}
                        </span>
                        <span className="text-xs text-gray-700 font-semibold">
                          {company.latestProgress.stage}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteCompany(company.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} className="text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* フローティングボタン */}
      {!showAddModal && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-20 right-4 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center z-40 bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] hover:shadow-xl transition-shadow"
        >
          <Plus size={28} />
        </button>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">企業を追加</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCompanyName('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="例: 株式会社○○"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCompanyName('');
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddCompany}
                disabled={!newCompanyName.trim()}
                className="flex-1 px-3 py-2 bg-[#FFA52F] text-white rounded-xl font-medium hover:bg-[#FF8F0F] disabled:opacity-50"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
