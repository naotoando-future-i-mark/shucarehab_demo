import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Company, CompanyNote, CompanyMemo, SelectionEvent, SelectionProgress, ReferenceSite } from '../types/company';
import { MemoTab } from '../components/jobhunting/MemoTab';
import { SelectionTab } from '../components/jobhunting/SelectionTab';

interface CompanyNotePageProps {
  companyId: string;
  onBack: () => void;
}

type TabType = 'memo' | 'selection';

const COMPANIES_STORAGE_KEY = 'shukarehub_companies';
const COMPANY_NOTES_STORAGE_KEY = 'shukarehub_company_notes';
const COMPANY_MEMOS_STORAGE_KEY = 'shukarehub_company_memos';
const SELECTION_EVENTS_STORAGE_KEY = 'shukarehub_selection_events';
const SELECTION_PROGRESS_STORAGE_KEY = 'shukarehub_selection_progress';
const REFERENCE_SITES_STORAGE_KEY = 'shukarehub_reference_sites';

export const CompanyNotePage = ({ companyId, onBack }: CompanyNotePageProps) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [companyNote, setCompanyNote] = useState<CompanyNote | null>(null);
  const [companyMemos, setCompanyMemos] = useState<CompanyMemo[]>([]);
  const [selectionEvents, setSelectionEvents] = useState<SelectionEvent[]>([]);
  const [selectionProgress, setSelectionProgress] = useState<SelectionProgress[]>([]);
  const [referenceSites, setReferenceSites] = useState<ReferenceSite[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('memo');

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = () => {
    const savedCompanies = localStorage.getItem(COMPANIES_STORAGE_KEY);
    const companiesData: Company[] = savedCompanies ? JSON.parse(savedCompanies) : [];
    const foundCompany = companiesData.find(c => c.id === companyId);
    if (foundCompany) setCompany(foundCompany);

    const savedNotes = localStorage.getItem(COMPANY_NOTES_STORAGE_KEY);
    const notesData = savedNotes ? JSON.parse(savedNotes) : [];
    let foundNote = notesData.find((n: CompanyNote) => n.company_id === companyId);

    if (!foundNote) {
      const now = new Date().toISOString();
      foundNote = {
        id: crypto.randomUUID(),
        company_id: companyId,
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
      };
      notesData.push(foundNote);
      localStorage.setItem(COMPANY_NOTES_STORAGE_KEY, JSON.stringify(notesData));
    }
    setCompanyNote(foundNote);

    const savedMemos = localStorage.getItem(COMPANY_MEMOS_STORAGE_KEY);
    const memosData: CompanyMemo[] = savedMemos ? JSON.parse(savedMemos) : [];
    setCompanyMemos(memosData.filter(m => m.company_note_id === foundNote.id));

    const savedEvents = localStorage.getItem(SELECTION_EVENTS_STORAGE_KEY);
    const eventsData: SelectionEvent[] = savedEvents ? JSON.parse(savedEvents) : [];
    setSelectionEvents(eventsData.filter(e => e.company_note_id === foundNote.id));

    const savedProgress = localStorage.getItem(SELECTION_PROGRESS_STORAGE_KEY);
    const progressData: SelectionProgress[] = savedProgress ? JSON.parse(savedProgress) : [];
    setSelectionProgress(progressData.filter(p => p.company_note_id === foundNote.id));

    const savedSites = localStorage.getItem(REFERENCE_SITES_STORAGE_KEY);
    const sitesData: ReferenceSite[] = savedSites ? JSON.parse(savedSites) : [];
    setReferenceSites(sitesData.filter(s => s.company_id === companyId));
  };

  const handleUpdateNote = (updates: Partial<CompanyNote>) => {
    if (!companyNote) return;
    const updatedNote = { ...companyNote, ...updates, updated_at: new Date().toISOString() };
    setCompanyNote(updatedNote);

    const savedNotes = localStorage.getItem(COMPANY_NOTES_STORAGE_KEY);
    const notesData = savedNotes ? JSON.parse(savedNotes) : [];
    const index = notesData.findIndex((n: CompanyNote) => n.id === companyNote.id);
    if (index !== -1) {
      notesData[index] = updatedNote;
      localStorage.setItem(COMPANY_NOTES_STORAGE_KEY, JSON.stringify(notesData));
    }
  };

  const handleAddMemo = (memo: Omit<CompanyMemo, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newMemo: CompanyMemo = {
      ...memo,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };

    const savedMemos = localStorage.getItem(COMPANY_MEMOS_STORAGE_KEY);
    const memosData: CompanyMemo[] = savedMemos ? JSON.parse(savedMemos) : [];
    memosData.push(newMemo);
    localStorage.setItem(COMPANY_MEMOS_STORAGE_KEY, JSON.stringify(memosData));
    setCompanyMemos([newMemo, ...companyMemos]);
  };

  const handleUpdateMemo = (memoId: string, updates: Partial<CompanyMemo>) => {
    const savedMemos = localStorage.getItem(COMPANY_MEMOS_STORAGE_KEY);
    const memosData: CompanyMemo[] = savedMemos ? JSON.parse(savedMemos) : [];
    const index = memosData.findIndex(m => m.id === memoId);
    if (index !== -1) {
      memosData[index] = { ...memosData[index], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(COMPANY_MEMOS_STORAGE_KEY, JSON.stringify(memosData));
      setCompanyMemos(companyMemos.map(m => m.id === memoId ? memosData[index] : m));
    }
  };

  const handleAddEvent = (event: Omit<SelectionEvent, 'id' | 'created_at' | 'updated_at'>): string | null => {
    const now = new Date().toISOString();
    const newEvent: SelectionEvent = {
      ...event,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };

    const savedEvents = localStorage.getItem(SELECTION_EVENTS_STORAGE_KEY);
    const eventsData: SelectionEvent[] = savedEvents ? JSON.parse(savedEvents) : [];
    eventsData.push(newEvent);
    localStorage.setItem(SELECTION_EVENTS_STORAGE_KEY, JSON.stringify(eventsData));
    setSelectionEvents([...selectionEvents, newEvent]);
    return newEvent.id;
  };

  const handleUpdateEvent = (eventId: string, updates: Partial<SelectionEvent>) => {
    const savedEvents = localStorage.getItem(SELECTION_EVENTS_STORAGE_KEY);
    const eventsData: SelectionEvent[] = savedEvents ? JSON.parse(savedEvents) : [];
    const index = eventsData.findIndex(e => e.id === eventId);
    if (index !== -1) {
      eventsData[index] = { ...eventsData[index], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(SELECTION_EVENTS_STORAGE_KEY, JSON.stringify(eventsData));
      setSelectionEvents(selectionEvents.map(e => e.id === eventId ? eventsData[index] : e));
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    const savedEvents = localStorage.getItem(SELECTION_EVENTS_STORAGE_KEY);
    const eventsData: SelectionEvent[] = savedEvents ? JSON.parse(savedEvents) : [];
    const filtered = eventsData.filter(e => e.id !== eventId);
    localStorage.setItem(SELECTION_EVENTS_STORAGE_KEY, JSON.stringify(filtered));
    setSelectionEvents(selectionEvents.filter(e => e.id !== eventId));
  };

  const handleAddProgress = (progress: Omit<SelectionProgress, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newProgress: SelectionProgress = {
      ...progress,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };

    const savedProgress = localStorage.getItem(SELECTION_PROGRESS_STORAGE_KEY);
    const progressData: SelectionProgress[] = savedProgress ? JSON.parse(savedProgress) : [];
    progressData.push(newProgress);
    localStorage.setItem(SELECTION_PROGRESS_STORAGE_KEY, JSON.stringify(progressData));
    setSelectionProgress([newProgress, ...selectionProgress]);
  };

  const handleDeleteProgress = (progressId: string) => {
    const savedProgress = localStorage.getItem(SELECTION_PROGRESS_STORAGE_KEY);
    const progressData: SelectionProgress[] = savedProgress ? JSON.parse(savedProgress) : [];
    const filtered = progressData.filter(p => p.id !== progressId);
    localStorage.setItem(SELECTION_PROGRESS_STORAGE_KEY, JSON.stringify(filtered));
    setSelectionProgress(selectionProgress.filter(p => p.id !== progressId));
  };

  const handleAddSite = (name: string, url: string) => {
    const now = new Date().toISOString();
    const newSite: ReferenceSite = {
      id: crypto.randomUUID(),
      company_id: companyId,
      name,
      url,
      created_at: now,
      updated_at: now,
    };

    const savedSites = localStorage.getItem(REFERENCE_SITES_STORAGE_KEY);
    const sitesData: ReferenceSite[] = savedSites ? JSON.parse(savedSites) : [];
    sitesData.push(newSite);
    localStorage.setItem(REFERENCE_SITES_STORAGE_KEY, JSON.stringify(sitesData));
    setReferenceSites([newSite, ...referenceSites]);
  };

  const handleDeleteSite = (siteId: string) => {
    const savedSites = localStorage.getItem(REFERENCE_SITES_STORAGE_KEY);
    const sitesData: ReferenceSite[] = savedSites ? JSON.parse(savedSites) : [];
    const filtered = sitesData.filter(s => s.id !== siteId);
    localStorage.setItem(REFERENCE_SITES_STORAGE_KEY, JSON.stringify(filtered));
    setReferenceSites(referenceSites.filter(s => s.id !== siteId));
  };

  if (!company || !companyNote) {
    return <div className="h-full flex items-center justify-center text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
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
