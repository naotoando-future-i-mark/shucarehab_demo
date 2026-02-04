export interface NotificationConfig {
  type: 'at_time' | 'before_10min' | 'before_1hour' | 'custom';
  customValue?: number;
  customUnit?: 'minute' | 'hour' | 'day' | 'week';
  referenceTime: 'start' | 'end';
}

export interface PreparationDate {
  id: string;
  event_id: string;
  date: string;
  end_date?: string;
  title?: string;
}

export interface Event {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  color_id: string;
  event_type?: 'intern' | 'fulltime';
  company_name?: string;
  deadline_at?: string;
  meeting_url?: string;
  location?: string;
  preparation_dates?: PreparationDate[];
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrence_interval?: number;
  recurrence_days?: number[];
  recurrence_monthly_type?: 'day_of_month' | 'day_of_week';
  recurrence_monthly_day?: number;
  recurrence_monthly_weekday?: number;
  recurrence_end_type?: 'never' | 'count' | 'date';
  recurrence_end_count?: number;
  recurrence_end_date?: string;
  memo?: string;
  notifications?: NotificationConfig[];
}

// 旧型との互換性のためのヘルパー関数
export const convertOldEventToNew = (old: any): Event => {
  return {
    id: old.id,
    title: old.title,
    start_at: `${old.date}T${old.startTime}`,
    end_at: `${old.date}T${old.endTime}`,
    all_day: old.isAllDay || false,
    color_id: old.color || '#FFA52F',
    event_type: old.eventType === 'main' ? 'fulltime' : 'intern',
    company_name: old.companyName,
    deadline_at: old.deadlineDate,
    meeting_url: old.videoUrl,
    location: old.location,
    preparation_dates: old.prepDates?.map((date: string, index: number) => ({
      id: `${old.id}-prep-${index}`,
      event_id: old.id,
      date: date,
      title: old.title,
    })),
    recurrence_type: old.repeat || 'none',
    memo: old.memo,
    notifications: [],
  };
};
