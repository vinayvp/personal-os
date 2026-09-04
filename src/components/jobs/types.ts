export type JobStatus =
  | 'applied'
  | 'interviewing'
  | 'negotiating'
  | 'accepted'
  | 'withdrew'
  | 'no response'
  | 'not selected';

export interface JobApplication {
  id: string;
  created_at: string;
  updated_at: string;
  applied_date: string;
  company_name: string;
  role_name: string;
  city?: string | null;
  country?: string | null;
  job_type?: string | null;
  status: JobStatus;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  salary_min_inr?: number | null;
  salary_max_inr?: number | null;
  salary_inr_rate?: number | null;
  resume_url?: string | null;
  resume_filename?: string | null;
  resume_storage_path?: string | null;
  cover_letter_filename?: string | null;
  cover_letter_storage_path?: string | null;
  application_link?: string | null;
  found_in?: string | null;
  job_description?: string | null;
  recruiter_email?: string | null;
  recruiter_phone?: string | null;
  follow_up_notes?: string | null;
}

export type NewJobApplication = Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>;

export interface JobStatsData {
  totalApplied: number;
  interviewing: number;
  negotiating: number;
  accepted: number;
  noResponse: number;
  notSelected: number;
  withdrew: number;
}

export interface CountryStat {
  country: string;
  total: number;
  applied: number;
  interviewing: number;
  negotiating: number;
  accepted: number;
  noResponse: number;
  notSelected: number;
  withdrew: number;
  responseRate: number; // percentage of non-'no response'
}

export interface JobFilters {
  searchQuery: string;
  status: JobStatus | 'all';
  country: string | 'all';
  sortBy: 'applied_date' | 'company_name' | 'salary_max';
  sortOrder: 'asc' | 'desc';
}

export const STATUS_CONFIG: Record<
  JobStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    description: string;
  }
> = {
  applied: {
    label: 'Applied',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-400',
    description: 'Application submitted',
  },
  interviewing: {
    label: 'Interviewing',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
    description: 'Active interview rounds',
  },
  negotiating: {
    label: 'Negotiating',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dotClass: 'bg-indigo-400',
    description: 'Offer received & negotiating',
  },
  accepted: {
    label: 'Accepted',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    description: 'Offer accepted',
  },
  withdrew: {
    label: 'Withdrew',
    badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dotClass: 'bg-slate-400',
    description: 'Application withdrawn',
  },
  'no response': {
    label: 'No Response',
    badgeClass: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    dotClass: 'bg-zinc-400',
    description: 'Awaiting response',
  },
  'not selected': {
    label: 'Not Selected',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
    description: 'Application rejected',
  },
};

export const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'AED', symbol: 'AED', label: 'AED (د.إ)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
];

export const FOUND_IN_OPTIONS = [
  'LinkedIn',
  'Wellfound (AngelList)',
  'Company Website / Careers',
  'Referral / Networking',
  'Indeed',
  'Glassdoor',
  'Y Combinator Jobs',
  'Otta / Welcome to the Jungle',
  'X (Twitter)',
  'Recruiter Outreach',
];

export const JOB_TYPE_OPTIONS = [
  'Full-time',
  'Contract',
  'Part-time',
  'Internship',
  'Freelance',
];

export interface SavedJobLink {
  id: string;
  url: string;
  company_name?: string | null;
  role_name?: string | null;
  location?: string | null;
  source?: string | null;
  notes?: string | null;
  deadline?: string | null;
  salary_note?: string | null;
  status: 'saved' | 'applied' | 'archived';
  created_at: string;
  updated_at: string;
}

export type NewSavedJobLink = Omit<SavedJobLink, 'id' | 'created_at' | 'updated_at'>;


