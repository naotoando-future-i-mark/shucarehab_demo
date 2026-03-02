import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Company, CompanyNote, CompanyMemo, SelectionEvent, SelectionProgress, ReferenceSite } from '../types/company';
import { MemoTab } from '../components/jobhunting/MemoTab';
import { SelectionTab } from '../components/jobhunting/SelectionTab';
import { supabase, getCurrentUserId } from '../lib/supabase';
import { showToast } from '../components/Toast';

interface CompanyNotePageProps {
  companyId: string;
  onBack: () => void;
}

type TabType = 'memo' | 'selection';

export const CompanyNotePage = ({ companyId, onBack }: CompanyNotePageProps) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [companyNote, setCompanyNote] = useState<CompanyNote | null>(null);
  const [companyMemos, setCompanyMemos] = useState<CompanyMemo[]>([]);
  const [selectionEvents, setSelectionEvents] = useState<SelectionEvent[]>([]);
  const [selectionProgress, setSelectionProgress] = useState<SelectionProgress[]>([]);
  const [referenceSites, setReferenceSites] = useState<ReferenceSite[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('memo');
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<{
    industry?: string;
    location?: string;
    employees?: string;
    position?: string;
    founded_year?: string;
    capital?: string;
    revenue?: string;
    business_description?: string;
    company_url?: string;
  } | null>(null);

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .eq('user_id', userId)
        .maybeSingle();

      if (companyError) throw companyError;
      if (companyData) {
        setCompany(companyData);
        if (companyData.master_company_id) {
          const { data: masterRow } = await supabase
            .from('master_companies')
            .select('industry, location, employees, position, founded_year, capital, revenue, business_description, company_url')
            .eq('id', companyData.master_company_id)
            .maybeSingle();
          if (masterRow) setMasterData(masterRow);
        }
      }

      let { data: noteData, error: noteError } = await supabase
        .from('company_notes')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .maybeSingle();

      if (noteError && noteError.code !== 'PGRST116') throw noteError;

      if (!noteData) {
        const { data: newNote, error: insertError } = await supabase
          .from('company_notes')
          .insert([{
            user_id: userId,
            company_id: companyId,
            industry: '',
            location: '',
            employee_count: '',
            job_type: '',
            founded_year: '',
            capital: '',
            revenue: '',
            business_description: '',
            website_url: '',
            mypage_url: '',
            login_id: '',
            password: '',
            login_notes: '',
            custom_fields: [],
            free_memo: '',
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        noteData = newNote;
      }

      setCompanyNote(noteData);

      const [memosResult, eventsResult, progressResult, sitesResult] = await Promise.all([
        supabase.from('company_memos').select('*').eq('company_note_id', noteData.id).order('created_at', { ascending: false }),
        supabase.from('selection_events').select('*').eq('company_note_id', noteData.id).order('date', { ascending: true }),
        supabase.from('selection_progress').select('*').eq('company_note_id', noteData.id).order('created_at', { ascending: false }),
        supabase.from('reference_sites').select('*').eq('company_id', companyId).eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      if (memosResult.data) setCompanyMemos(memosResult.data);
      if (eventsResult.data) setSelectionEvents(eventsResult.data);
      if (progressResult.data) setSelectionProgress(progressResult.data);
      if (sitesResult.data) setReferenceSites(sitesResult.data);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (updates: Partial<CompanyNote>) => {
    if (!companyNote) return;

    try {
      const { error } = await supabase
        .from('company_notes')
        .update(updates)
        .eq('id', companyNote.id);

      if (error) throw error;

      const updatedNote = { ...companyNote, ...updates };
      setCompanyNote(updatedNote);
    } catch (error) {
      console.error('Error updating note:', error);
      showToast('ノートの更新に失敗しました', 'error');
    }
  };

  const handleAddMemo = async (memo: Omit<CompanyMemo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('company_memos')
        .insert([memo])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCompanyMemos([data, ...companyMemos]);
      }
    } catch (error) {
      console.error('Error adding memo:', error);
      showToast('メモの追加に失敗しました', 'error');
    }
  };

  const handleUpdateMemo = async (memoId: string, updates: Partial<CompanyMemo>) => {
    try {
      const { error } = await supabase
        .from('company_memos')
        .update(updates)
        .eq('id', memoId);

      if (error) throw error;

      setCompanyMemos(companyMemos.map(m => m.id === memoId ? { ...m, ...updates } : m));
    } catch (error) {
      console.error('Error updating memo:', error);
      showToast('メモの更新に失敗しました', 'error');
    }
  };

  const handleAddEvent = async (event: Omit<SelectionEvent, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('selection_events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSelectionEvents([...selectionEvents, data]);
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error adding event:', error);
      showToast('イベントの追加に失敗しました', 'error');
      return null;
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: Partial<SelectionEvent>) => {
    try {
      const { error } = await supabase
        .from('selection_events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      setSelectionEvents(selectionEvents.map(e => e.id === eventId ? { ...e, ...updates } : e));
    } catch (error) {
      console.error('Error updating event:', error);
      showToast('イベントの更新に失敗しました', 'error');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('selection_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setSelectionEvents(selectionEvents.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('イベントの削除に失敗しました', 'error');
    }
  };

  const handleAddProgress = async (progress: Omit<SelectionProgress, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('selection_progress')
        .insert([progress])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSelectionProgress([data, ...selectionProgress]);
      }
    } catch (error) {
      console.error('Error adding progress:', error);
      showToast('選考進捗の追加に失敗しました', 'error');
    }
  };

  const handleDeleteProgress = async (progressId: string) => {
    try {
      const { error } = await supabase
        .from('selection_progress')
        .delete()
        .eq('id', progressId);

      if (error) throw error;

      setSelectionProgress(selectionProgress.filter(p => p.id !== progressId));
    } catch (error) {
      console.error('Error deleting progress:', error);
      showToast('選考進捗の削除に失敗しました', 'error');
    }
  };

  const handleAddSite = async (name: string, url: string) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('reference_sites')
        .insert([{ user_id: userId, company_id: companyId, name, url }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReferenceSites([data, ...referenceSites]);
      }
    } catch (error) {
      console.error('Error adding site:', error);
      showToast('参考サイトの追加に失敗しました', 'error');
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    try {
      const { error } = await supabase
        .from('reference_sites')
        .delete()
        .eq('id', siteId);

      if (error) throw error;

      setReferenceSites(referenceSites.filter(s => s.id !== siteId));
    } catch (error) {
      console.error('Error deleting site:', error);
      showToast('参考サイトの削除に失敗しました', 'error');
    }
  };

  if (loading || !company || !companyNote) {
    return <div className="h-full flex items-center justify-center text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 max-w-md mx-auto">
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{company.name}</h1>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('memo')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'memo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            メモ
          </button>
          <button
            onClick={() => setActiveTab('selection')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'selection' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            選考管理
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'memo' && (
          <MemoTab
            companyNote={companyNote}
            companyMemos={companyMemos}
            referenceSites={referenceSites}
            masterData={masterData}
            onUpdateNote={handleUpdateNote}
            onAddMemo={handleAddMemo}
            onUpdateMemo={handleUpdateMemo}
            onAddSite={handleAddSite}
            onDeleteSite={handleDeleteSite}
          />
        )}
        {activeTab === 'selection' && (
          <SelectionTab
            companyNoteId={companyNote.id}
            companyName={company.name}
            events={selectionEvents}
            progress={selectionProgress}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddProgress={handleAddProgress}
            onDeleteProgress={handleDeleteProgress}
          />
        )}
      </div>
    </div>
  );
};
