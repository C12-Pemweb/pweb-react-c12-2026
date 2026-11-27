export type ApplicationStatus =
  | 'WISHLIST' | 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'GHOSTED';
export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';

// Minimal; Orang 3 boleh memperluas
export interface ChecklistItem { id: string; text: string; done: boolean }
export interface ActivityLog { id: string; timestamp: string; message: string }

export interface Application {
  id: string;
  company: string;
  role: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  createdAt: string;
  lastStatusChange: string;
  checklist: ChecklistItem[];
  activityLog: ActivityLog[];
}

export const ALL_STATUSES: ApplicationStatus[] =
  ['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED'];
export const WORK_MODES: WorkMode[] = ['Remote', 'Hybrid', 'Onsite'];
