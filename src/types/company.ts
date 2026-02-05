export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyNote {
  id: string;
  company_id: string;
  industry: string;
  job_type: string;
  location: string;
  employee_count: string;
  listing_status: string;
  base_salary: string;
  web_test: string;
  working_hours: string;
  mypage_url: string;
  login_id: string;
  password: string;
  login_notes: string;
  custom_fields: CustomField[];
  free_memo: string;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  label: string;
  value: string;
}

export interface CompanyMemo {
  id: string;
  company_note_id: string;
  category: '企業研究' | '面接対策' | 'ES' | 'その他';
  title: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SelectionEvent {
  id: string;
  company_note_id: string;
  track_type: 'intern' | 'fulltime';
  event_type: string;
  title: string;
  date_type: 'deadline' | 'schedule';
  deadline_date: string;
  deadline_time?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  status: 'pending' | 'completed';
  memo: string;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SelectionProgress {
  id: string;
  company_note_id: string;
  track_type: 'intern' | 'fulltime';
  stage: string;
  passed_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ReferenceSite {
  id: string;
  company_id: string;
  memo_id?: string;
  name: string;
  url: string;
  created_at: string;
  updated_at: string;
}
