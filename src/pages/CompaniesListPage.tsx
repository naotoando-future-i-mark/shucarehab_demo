import { useState, useEffect, useRef } from 'react';
import { Plus, Building2, Search, Trash2, X } from 'lucide-react';
import { Company, SelectionProgress } from '../types/company';
import { supabase, getCurrentUserId } from '../lib/supabase';
import { showToast } from '../components/Toast';

interface CompaniesListPageProps {
  onCompanySelect: (companyId: string) => void;
}

interface CompanyWithProgress extends Company {
  latestProgress?: {
    trackType: 'intern' | 'fulltime';
    stage: string;
  };
}

interface MasterCompanySuggestion {
  name: string;
  industry: string;
  location: string;
  employees: string;
}

export const CompaniesListPage = ({ onCompanySelect }: CompaniesListPageProps) => {
  const [companies, setCompanies] = useState<CompanyWithProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<MasterCompanySuggestion[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<MasterCompanySuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addError, setAddError] = useState('');
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (companiesError) throw companiesError;

      if (!companiesData || companiesData.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      const { data: notesData, error: notesError } = await supabase
        .from('company_notes')
        .select('id, company_id')
        .eq('user_id', userId);

      if (notesError) throw notesError;

      const noteIds = notesData?.map(n => n.id) || [];

      if (noteIds.length === 0) {
        const companiesWithProgress: CompanyWithProgress[] = companiesData.map(company => ({
          ...company,
          latestProgress: undefined,
        }));
        setCompanies(companiesWithProgress);
        setLoading(false);
        return;
      }

      const { data: progressData, error: progressError } = await supabase
        .from('selection_progress')
        .select('*')
        .in('company_note_id', noteIds)
        .order('created_at', { ascending: false });

      if (progressError) throw progressError;

      const noteIdToCompanyId = new Map(notesData?.map(n => [n.id, n.company_id]) || []);

      const companyProgressMap = new Map<string, SelectionProgress>();
      progressData?.forEach(progress => {
        const companyId = noteIdToCompanyId.get(progress.company_note_id);
        if (!companyId) return;
        const existing = companyProgressMap.get(companyId);
        if (!existing || new Date(progress.created_at) > new Date(existing.created_at)) {
          companyProgressMap.set(companyId, progress);
        }
      });

      const companiesWithProgress: CompanyWithProgress[] = companiesData.map(company => {
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
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyNameChange = (value: string) => {
    setNewCompanyName(value);
    setSelectedMaster(null);
    setAddError('');

    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('master_companies')
          .select('name, industry, location, employees')
          .ilike('name', `%${value}%`)
          .limit(5);

        if (data && data.length > 0) {
          setSuggestions(data.map(d => ({
            name: d.name,
            industry: d.industry || '',
            location: d.location || '',
            employees: d.employees || '',
          })));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleSelectSuggestion = (suggestion: MasterCompanySuggestion) => {
    setSelectedMaster(suggestion);
    setNewCompanyName(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setAddError('');
  };

  const handleClearSelection = () => {
    setSelectedMaster(null);
    setNewCompanyName('');
    setSuggestions([]);
    setShowSuggestions(false);
    setAddError('');
  };

  const handleAddCompany = async () => {
    const trimmedName = newCompanyName.trim();
    if (!trimmedName) return;

    setAddError('');

    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', userId)
        .eq('name', trimmedName)
        .maybeSingle();

      if (existing) {
        setAddError('この企業は既に追加されています');
        return;
      }

      const { data: masterData } = await supabase
        .from('master_companies')
        .select('id')
        .eq('name', trimmedName)
        .maybeSingle();

      const insertData: any = { user_id: userId, name: trimmedName };
      if (masterData) {
        insertData.master_company_id = masterData.id;
      }

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([insertData])
        .select()
        .single();

      if (companyError) throw companyError;

      await supabase.from('company_notes').insert([{
        user_id: userId,
        company_id: companyData.id,
        industry: selectedMaster?.industry || '',
        job_type: '',
        location: selectedMaster?.location || '',
        employee_count: selectedMaster?.employees || '',
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
      }]);

      setCompanies([{ ...companyData, latestProgress: undefined }, ...companies]);
      setNewCompanyName('');
      setSelectedMaster(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding company:', error);
      showToast('', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewCompanyName('');
    setSelectedMaster(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setAddError('');
  };

  const handleDeleteCompany = async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      setCompanies(companies.filter(c => c.id !== companyId));
    } catch (error) {
      console.error('Error deleting company:', error);
      showToast('', 'error');
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-600">...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 relative pt-14 max-w-md mx-auto">
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">就活ノート</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="企業名で検索"
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
              {searchQuery ? '該当する企業がありません' : '企業を追加して就活ノートを始めましょう'}
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
                        <span className="text-xs font-medium text-gray-600">選考:</span>
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

      {!showAddModal && (
        <div className="fixed bottom-20 left-0 right-0 z-40 pointer-events-none">
          <div className="max-w-md mx-auto relative">
            <button
              onClick={() => setShowAddModal(true)}
              className="absolute bottom-0 right-4 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto bg-gradient-to-r from-[#FFA52F] to-[#FF8C00] hover:shadow-xl transition-shadow"
            >
              <Plus size={28} />
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">企業を追加</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>

              {selectedMaster ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
                  <span className="text-sm text-orange-700 flex-1">
                    ✓ {selectedMaster.name}（master_companies から選択）
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="text-orange-400 hover:text-orange-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    placeholder="例: 株式会社○○"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFA52F]"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && !showSuggestions && handleAddCompany()}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-gray-800">{suggestion.name}</div>
                          {suggestion.industry && (
                            <div className="text-xs text-gray-500 mt-0.5">{suggestion.industry}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {addError && (
                <p className="text-xs text-red-500 mt-2">{addError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
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
