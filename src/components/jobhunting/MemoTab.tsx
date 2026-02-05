import { CompanyNote, CompanyMemo, ReferenceSite } from '../../types/company';
import { BasicInfoBlock } from './BasicInfoBlock';
import { MyPageInfoBlock } from './MyPageInfoBlock';
import { CompanyMemosBlock } from './CompanyMemosBlock';
import { ReferenceSitesBlock } from './ReferenceSitesBlock';

interface MemoTabProps {
  companyNote: CompanyNote;
  companyMemos: CompanyMemo[];
  referenceSites: ReferenceSite[];
  onUpdateNote: (updates: Partial<CompanyNote>) => void;
  onAddMemo: (memo: Omit<CompanyMemo, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateMemo: (memoId: string, updates: Partial<CompanyMemo>) => void;
  onAddSite: (name: string, url: string) => void;
  onDeleteSite: (siteId: string) => void;
}

export const MemoTab = ({
  companyNote,
  companyMemos,
  referenceSites,
  onUpdateNote,
  onAddMemo,
  onUpdateMemo,
  onAddSite,
  onDeleteSite,
}: MemoTabProps) => {
  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-24 space-y-4">
      <BasicInfoBlock companyNote={companyNote} onUpdate={onUpdateNote} />
      <MyPageInfoBlock companyNote={companyNote} onUpdate={onUpdateNote} />
      <CompanyMemosBlock
        companyNoteId={companyNote.id}
        memos={companyMemos}
        onAddMemo={onAddMemo}
        onUpdateMemo={onUpdateMemo}
      />
      <ReferenceSitesBlock
        sites={referenceSites}
        onAddSite={onAddSite}
        onDeleteSite={onDeleteSite}
      />
    </div>
  );
};
