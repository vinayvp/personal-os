import { supabase } from './client';
import {
  JobApplication,
  NewJobApplication,
  JobFollowUp,
  JobStatsData,
  CountryStat,
  SavedJobLink,
  NewSavedJobLink,
  JobPlatform,
  NewJobPlatform,
  PlatformStat,
} from '@/components/jobs/types';

const BUCKET_NAME = 'job-resumes';
const FALLBACK_BUCKET = 'note-images';
const LOCAL_STORAGE_KEY = 'portfolio_job_applications_cache';

// Allowed resume file extensions & MIME types
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Helper: Sanitize filename to prevent directory traversal or script injection
export const sanitizeFilename = (filename: string): string => {
  const base = filename.replace(/^.*[\\/]/, ''); // Strip paths
  return base.replace(/[^a-zA-Z0-9._-]/g, '_'); // Allow only safe characters
};

// Helper: Validate resume file
export const validateResumeFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds the 10 MB limit.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Only PDF and Word documents (.pdf, .doc, .docx) are allowed.' };
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid document MIME type.' };
  }

  return { valid: true };
};

// Helper: Safely normalize follow_ups to prevent any runtime exceptions
export const normalizeFollowUps = (raw: any): JobFollowUp[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter(Boolean)
      .map((item, idx) => {
        if (typeof item === 'string') {
          return {
            id: `fu_${idx}_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'Other' as const,
            notes: item,
            status: 'completed' as const,
          };
        }
        return {
          id: item.id || `fu_${idx}_${Date.now()}`,
          date: item.date || new Date().toISOString().split('T')[0],
          type: item.type || 'Other',
          notes: item.notes || '',
          status: item.status || 'completed',
          created_at: item.created_at,
        };
      });
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return normalizeFollowUps(parsed);
    } catch {
      if (raw.trim()) {
        return [
          {
            id: `fu_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'Other',
            notes: raw,
            status: 'completed',
          },
        ];
      }
      return [];
    }
  }
  return [];
};

export const normalizeAtsScore = (score: any): number | null => {
  if (score == null || score === '') return null;
  const num = Number(score);
  return isNaN(num) ? null : Math.min(100, Math.max(0, num));
};

// Helper: LocalStorage backup fallback
const getLocalApplications = (): JobApplication[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map((app) => ({
          ...app,
          follow_ups: normalizeFollowUps(app.follow_ups),
          ats_score: normalizeAtsScore(app.ats_score),
        }))
      : [];
  } catch {
    return [];
  }
};

const saveLocalApplications = (items: JobApplication[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
};

// =========================================================
// Storage: Upload, Signed URL, and Direct Download
// =========================================================

/**
 * Uploads a document (resume or cover letter) to private storage.
 */
export const uploadJobDocument = async (
  file: File,
  folder = 'resumes'
): Promise<{ storagePath: string; filename: string }> => {
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const sanitized = sanitizeFilename(file.name);
  const timestamp = Date.now();
  const filePath = `${folder}/${timestamp}_${sanitized}`;

  // Try primary bucket first, fallback if not yet created
  let uploadBucket = BUCKET_NAME;
  let { error } = await supabase.storage.from(uploadBucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    // If job-resumes bucket is not yet created, attempt fallback to note-images
    uploadBucket = FALLBACK_BUCKET;
    const fallbackRes = await supabase.storage.from(uploadBucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (fallbackRes.error) {
      throw new Error(`Upload failed: ${error.message || fallbackRes.error.message}`);
    }
  }

  return {
    storagePath: `${uploadBucket}::${filePath}`,
    filename: file.name,
  };
};

/**
 * Uploads a resume to private storage.
 * Returns the storage path and filename.
 */
export const uploadResume = async (
  file: File
): Promise<{ storagePath: string; filename: string }> => {
  return uploadJobDocument(file, 'resumes');
};

/**
 * Uploads an optional cover letter to private storage.
 * Returns the storage path and filename.
 */
export const uploadCoverLetter = async (
  file: File
): Promise<{ storagePath: string; filename: string }> => {
  return uploadJobDocument(file, 'cover_letters');
};

/**
 * Generates a secure, temporary Signed URL (valid for 15 minutes)
 * to safely view or stream a private document (resume or cover letter).
 */
export const getResumeSignedUrl = async (
  compositePath: string,
  expiresInSeconds = 900 // 15 minutes
): Promise<string | null> => {
  if (!compositePath) return null;

  let bucket = BUCKET_NAME;
  let path = compositePath;

  if (compositePath.includes('::')) {
    const parts = compositePath.split('::');
    bucket = parts[0];
    path = parts[1];
  }

  // Attempt to generate signed URL
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    // Fallback: Check if public URL is available
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicData?.publicUrl || null;
  }

  return data.signedUrl;
};

export const getDocumentSignedUrl = getResumeSignedUrl;

/**
 * Downloads a document as a Blob and triggers an in-browser file download.
 */
export const downloadResume = async (
  compositePath: string,
  downloadName = 'document.pdf'
): Promise<void> => {
  let bucket = BUCKET_NAME;
  let path = compositePath;

  if (compositePath.includes('::')) {
    const parts = compositePath.split('::');
    bucket = parts[0];
    path = parts[1];
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    // If direct blob download fails, fallback to signed URL navigation
    const signedUrl = await getResumeSignedUrl(compositePath);
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    throw new Error(error?.message || 'Failed to download file');
  }

  const blobUrl = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

export const downloadDocument = downloadResume;

// =========================================================
// Database CRUD Operations
// =========================================================

export const fetchJobApplications = async (): Promise<JobApplication[]> => {
  try {
    const { data, error } = await (supabase
      .from('job_applications' as any)
      .select('*')
      .order('applied_date', { ascending: false }) as any);

    if (error) {
      // If table does not exist yet, use localStorage cache
      console.warn('job_applications table not ready, using local storage fallback:', error.message);
      return getLocalApplications();
    }

    const rawList: any[] = data || [];
    const applications: JobApplication[] = rawList.map((app) => ({
      ...app,
      follow_ups: normalizeFollowUps(app.follow_ups),
      ats_score: normalizeAtsScore(app.ats_score),
    }));
    saveLocalApplications(applications);
    return applications;
  } catch (err) {
    console.error('Error fetching job applications:', err);
    return getLocalApplications();
  }
};

export const createJobApplication = async (
  newJob: NewJobApplication
): Promise<JobApplication> => {
  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID ? crypto.randomUUID() : `job_${Date.now()}`;

  const payload: JobApplication = {
    ...newJob,
    id,
    created_at: timestamp,
    updated_at: timestamp,
    follow_ups: normalizeFollowUps(newJob.follow_ups),
    ats_score: normalizeAtsScore(newJob.ats_score),
  };

  try {
    let { data, error } = await (supabase
      .from('job_applications' as any)
      .insert([payload])
      .select()
      .single() as any);

    // If Supabase table does not yet have ats_score or follow_ups columns, retry without them
    if (error && (error.message?.includes('column') || error.code === '42703')) {
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as any).ats_score;
      delete (fallbackPayload as any).follow_ups;
      const retry = await (supabase
        .from('job_applications' as any)
        .insert([fallbackPayload])
        .select()
        .single() as any);
      if (!retry.error && retry.data) {
        data = { ...retry.data, ats_score: payload.ats_score, follow_ups: payload.follow_ups };
        error = null;
      }
    }

    if (error) {
      console.warn('Using local storage fallback for create:', error.message);
      const current = getLocalApplications();
      const updated = [payload, ...current];
      saveLocalApplications(updated);
      return payload;
    }

    const result: JobApplication = {
      ...(data || payload),
      follow_ups: normalizeFollowUps(data?.follow_ups ?? payload.follow_ups),
      ats_score: normalizeAtsScore(data?.ats_score ?? payload.ats_score),
    };
    const current = getLocalApplications();
    saveLocalApplications([result, ...current.filter(item => item.id !== id)]);
    return result;
  } catch (err) {
    const current = getLocalApplications();
    const updated = [payload, ...current];
    saveLocalApplications(updated);
    return payload;
  }
};

export const updateJobApplication = async (
  id: string,
  updates: Partial<JobApplication>
): Promise<JobApplication> => {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  try {
    let { data, error } = await (supabase
      .from('job_applications' as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single() as any);

    // If Supabase table does not yet have ats_score or follow_ups columns, retry without them
    if (error && (error.message?.includes('column') || error.code === '42703')) {
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as any).ats_score;
      delete (fallbackPayload as any).follow_ups;
      const retry = await (supabase
        .from('job_applications' as any)
        .update(fallbackPayload)
        .eq('id', id)
        .select()
        .single() as any);
      if (!retry.error && retry.data) {
        data = { ...retry.data, ats_score: updates.ats_score, follow_ups: updates.follow_ups };
        error = null;
      }
    }

    const current = getLocalApplications();
    const existing = current.find(item => item.id === id);

    if (error) {
      console.warn('Using local storage fallback for update:', error.message);
      const updatedApp: JobApplication = {
        ...(existing || ({} as JobApplication)),
        ...payload,
        follow_ups: normalizeFollowUps(payload.follow_ups ?? existing?.follow_ups),
        ats_score: normalizeAtsScore(payload.ats_score ?? existing?.ats_score),
      };
      const updatedList = current.map(item => (item.id === id ? updatedApp : item));
      saveLocalApplications(updatedList);
      return updatedApp;
    }

    const result: JobApplication = {
      ...(data || existing || {}),
      ...payload,
      follow_ups: normalizeFollowUps(data?.follow_ups ?? payload.follow_ups ?? existing?.follow_ups),
      ats_score: normalizeAtsScore(data?.ats_score ?? payload.ats_score ?? existing?.ats_score),
    };
    saveLocalApplications(current.map(item => (item.id === id ? result : item)));
    return result;
  } catch {
    const current = getLocalApplications();
    const existing = current.find(item => item.id === id);
    const fallbackApp: JobApplication = {
      ...(existing || ({} as JobApplication)),
      ...payload,
      follow_ups: normalizeFollowUps(payload.follow_ups ?? existing?.follow_ups),
      ats_score: normalizeAtsScore(payload.ats_score ?? existing?.ats_score),
    };
    const updated = current.map(item => (item.id === id ? fallbackApp : item));
    saveLocalApplications(updated);
    return fallbackApp;
  }
};

export const deleteJobApplication = async (id: string): Promise<void> => {
  try {
    await (supabase.from('job_applications' as any).delete().eq('id', id) as any);
  } catch (e) {
    console.error('Delete from Supabase failed:', e);
  } finally {
    const current = getLocalApplications();
    saveLocalApplications(current.filter(item => item.id !== id));
  }
};

export const addJobFollowUp = async (
  jobId: string,
  followUp: Omit<JobFollowUp, 'id' | 'created_at'>
): Promise<JobApplication> => {
  const newFollowUp: JobFollowUp = {
    ...followUp,
    id: crypto.randomUUID ? crypto.randomUUID() : `fu_${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const localApps = getLocalApplications();
  const target = localApps.find(app => app.id === jobId);
  const currentFollowUps = Array.isArray(target?.follow_ups) ? target.follow_ups : [];
  const updatedFollowUps = [newFollowUp, ...currentFollowUps];

  return updateJobApplication(jobId, { follow_ups: updatedFollowUps });
};

export const deleteJobFollowUp = async (
  jobId: string,
  followUpId: string
): Promise<JobApplication> => {
  const localApps = getLocalApplications();
  const target = localApps.find(app => app.id === jobId);
  const currentFollowUps = Array.isArray(target?.follow_ups) ? target.follow_ups : [];
  const updatedFollowUps = currentFollowUps.filter(fu => fu.id !== followUpId);

  return updateJobApplication(jobId, { follow_ups: updatedFollowUps });
};

// =========================================================
// Statistics & Country Aggregations
// =========================================================

export const calculateJobStats = (applications: JobApplication[]): JobStatsData => {
  const stats: JobStatsData = {
    totalApplied: applications.length,
    interviewing: 0,
    negotiating: 0,
    accepted: 0,
    noResponse: 0,
    notSelected: 0,
    withdrew: 0,
  };

  applications.forEach(app => {
    switch (app.status) {
      case 'interviewing':
        stats.interviewing++;
        break;
      case 'negotiating':
        stats.negotiating++;
        break;
      case 'accepted':
        stats.accepted++;
        break;
      case 'no response':
        stats.noResponse++;
        break;
      case 'not selected':
        stats.notSelected++;
        break;
      case 'withdrew':
        stats.withdrew++;
        break;
    }
  });

  return stats;
};

export const calculateCountryStats = (applications: JobApplication[]): CountryStat[] => {
  const map = new Map<string, CountryStat>();

  applications.forEach(app => {
    const countryName = (app.country || 'Unspecified').trim();
    if (!map.has(countryName)) {
      map.set(countryName, {
        country: countryName,
        total: 0,
        applied: 0,
        interviewing: 0,
        negotiating: 0,
        accepted: 0,
        noResponse: 0,
        notSelected: 0,
        withdrew: 0,
        responseRate: 0,
      });
    }

    const stat = map.get(countryName)!;
    stat.total++;

    switch (app.status) {
      case 'applied':
        stat.applied++;
        break;
      case 'interviewing':
        stat.interviewing++;
        break;
      case 'negotiating':
        stat.negotiating++;
        break;
      case 'accepted':
        stat.accepted++;
        break;
      case 'no response':
        stat.noResponse++;
        break;
      case 'not selected':
        stat.notSelected++;
        break;
      case 'withdrew':
        stat.withdrew++;
        break;
    }
  });

  const list = Array.from(map.values()).map(stat => {
    const respondedCount = stat.total - stat.noResponse;
    stat.responseRate = stat.total > 0 ? Math.round((respondedCount / stat.total) * 100) : 0;
    return stat;
  });

  // Sort descending by total applications
  return list.sort((a, b) => b.total - a.total);
};

// =========================================================
// Fast Forex API Currency Conversion & Lakhs Formatter
// =========================================================

const FAST_FOREX_API_KEY =
  (import.meta as any).env?.VITE_FASTFOREX_API_KEY || '64d1e7c7fa-86e02203bc-tktz09';

// In-memory cache for exchange rates to avoid redundant network hits
const rateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Fetch live exchange rate from FastForex API with fallback.
 */
export const getInrExchangeRate = async (currency: string): Promise<number> => {
  const curr = currency.toUpperCase().trim();
  if (curr === 'INR') return 1;

  const cached = rateCache[curr];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.rate;
  }

  try {
    const url = `https://api.fastforex.io/fetch-one?from=${curr}&to=INR&api_key=${FAST_FOREX_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Forex API error: ${res.statusText}`);
    const json = await res.json();
    const inrRate = json?.result?.INR;
    if (typeof inrRate === 'number' && inrRate > 0) {
      rateCache[curr] = { rate: inrRate, timestamp: Date.now() };
      return inrRate;
    }
  } catch (err) {
    console.warn(`FastForex rate fetch failed for ${curr}, using fallback:`, err);
  }

  // Sensible fallback exchange rates if offline or API limit reached
  const fallbackRates: Record<string, number> = {
    USD: 94.5,
    EUR: 102.5,
    GBP: 122.0,
    AED: 25.7,
    SGD: 71.0,
    CAD: 68.5,
  };
  return fallbackRates[curr] || 1;
};

/**
 * Convert salary to INR using FastForex.
 * If already INR, skips conversion.
 */
export const convertSalaryToInr = async (
  salaryMin?: number | null,
  salaryMax?: number | null,
  currency = 'USD'
): Promise<{
  salary_min_inr: number | null;
  salary_max_inr: number | null;
  salary_inr_rate: number;
}> => {
  const curr = currency.toUpperCase().trim();
  if (curr === 'INR') {
    return {
      salary_min_inr: salaryMin != null ? salaryMin : null,
      salary_max_inr: salaryMax != null ? salaryMax : null,
      salary_inr_rate: 1,
    };
  }

  const rate = await getInrExchangeRate(curr);

  return {
    salary_min_inr: salaryMin != null ? Math.round(salaryMin * rate) : null,
    salary_max_inr: salaryMax != null ? Math.round(salaryMax * rate) : null,
    salary_inr_rate: rate,
  };
};

/**
 * Format salary in Lakhs (Lacs).
 * 1 Lakh = 1,00,000 INR
 */
export const formatSalaryInLakhs = (
  minInr?: number | null,
  maxInr?: number | null,
  originalMin?: number | null,
  originalMax?: number | null,
  originalCurrency = 'USD'
): { lakhsText: string; originalText: string | null } => {
  const toLakhs = (val: number): string => {
    const l = val / 100000;
    return l % 1 === 0 ? `${l}L` : `${l.toFixed(1)}L`;
  };

  // If minInr/maxInr are missing but original salary exists, estimate dynamically
  let effectiveMinInr = minInr;
  let effectiveMaxInr = maxInr;

  if (effectiveMinInr == null && originalMin != null) {
    const rate = originalCurrency === 'INR' ? 1 : rateCache[originalCurrency]?.rate || 94.5;
    effectiveMinInr = Math.round(originalMin * rate);
  }
  if (effectiveMaxInr == null && originalMax != null) {
    const rate = originalCurrency === 'INR' ? 1 : rateCache[originalCurrency]?.rate || 94.5;
    effectiveMaxInr = Math.round(originalMax * rate);
  }

  let lakhsText = '—';
  if (effectiveMinInr != null && effectiveMaxInr != null) {
    lakhsText = `₹${toLakhs(effectiveMinInr)} - ₹${toLakhs(effectiveMaxInr)}`;
  } else if (effectiveMinInr != null) {
    lakhsText = `₹${toLakhs(effectiveMinInr)}+`;
  } else if (effectiveMaxInr != null) {
    lakhsText = `Up to ₹${toLakhs(effectiveMaxInr)}`;
  }

  let originalText: string | null = null;
  if (originalCurrency !== 'INR' && (originalMin != null || originalMax != null)) {
    if (originalMin != null && originalMax != null) {
      originalText = `${originalMin.toLocaleString()} - ${originalMax.toLocaleString()} ${originalCurrency}`;
    } else if (originalMin != null) {
      originalText = `${originalMin.toLocaleString()}+ ${originalCurrency}`;
    } else if (originalMax != null) {
      originalText = `Up to ${originalMax.toLocaleString()} ${originalCurrency}`;
    }
  }

  return { lakhsText, originalText };
};

// =========================================================
// Saved Job Links (Apply Later Backlog)
// =========================================================

const SAVED_LINKS_CACHE_KEY = 'portfolio_saved_job_links_cache';

const getLocalSavedLinks = (): SavedJobLink[] => {
  try {
    const raw = localStorage.getItem(SAVED_LINKS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalSavedLinks = (items: SavedJobLink[]) => {
  try {
    localStorage.setItem(SAVED_LINKS_CACHE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to write saved job links to localStorage', e);
  }
};

/**
 * Automatically inspects a URL hostname and returns a common job source name.
 */
export const detectJobSourceFromUrl = (url: string): string => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('wellfound.com') || host.includes('angel.co')) return 'Wellfound (AngelList)';
    if (host.includes('indeed.com')) return 'Indeed';
    if (host.includes('glassdoor.com')) return 'Glassdoor';
    if (host.includes('ycombinator.com')) return 'Y Combinator Jobs';
    if (host.includes('otta.com') || host.includes('welcometothejungle.com')) return 'Otta / Welcome to the Jungle';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'X (Twitter)';

    // Otherwise clean the domain name
    const domain = host.replace(/^www\./, '');
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Company Website / Careers';
  }
};

/**
 * Fetches all saved links, prioritizing Supabase with localStorage backup fallback.
 */
export const fetchSavedJobLinks = async (): Promise<SavedJobLink[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_job_links' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase saved_job_links query failed, using localStorage fallback:', error.message);
      return getLocalSavedLinks();
    }

    const links = (data || []) as unknown as SavedJobLink[];
    saveLocalSavedLinks(links);
    return links;
  } catch (err) {
    console.warn('Network error fetching saved links, using localStorage:', err);
    return getLocalSavedLinks();
  }
};

/**
 * Creates a new saved link in Supabase or localStorage.
 */
export const createSavedJobLink = async (newLink: NewSavedJobLink): Promise<SavedJobLink> => {
  const timestamp = new Date().toISOString();
  const fallbackId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const candidate: SavedJobLink = {
    ...newLink,
    id: fallbackId,
    status: newLink.status || 'saved',
    created_at: timestamp,
    updated_at: timestamp,
  };

  try {
    const { data, error } = await supabase
      .from('saved_job_links' as any)
      .insert({
        url: candidate.url,
        company_name: candidate.company_name || null,
        role_name: candidate.role_name || null,
        location: candidate.location || null,
        platform_id: candidate.platform_id || null,
        source: candidate.source || null,
        notes: candidate.notes || null,
        deadline: candidate.deadline || null,
        salary_note: candidate.salary_note || null,
        status: candidate.status,
      } as any)
      .select()
      .single();

    if (error) {
      console.warn('Failed to insert into Supabase saved_job_links, falling back to local storage:', error.message);
      const local = getLocalSavedLinks();
      const updated = [candidate, ...local];
      saveLocalSavedLinks(updated);
      return candidate;
    }

    const created = data as unknown as SavedJobLink;
    const local = getLocalSavedLinks();
    saveLocalSavedLinks([created, ...local.filter((l) => l.id !== created.id)]);
    return created;
  } catch (err) {
    console.warn('Error inserting saved link, using local storage:', err);
    const local = getLocalSavedLinks();
    const updated = [candidate, ...local];
    saveLocalSavedLinks(updated);
    return candidate;
  }
};

/**
 * Updates an existing saved link.
 */
export const updateSavedJobLink = async (
  id: string,
  updates: Partial<SavedJobLink>
): Promise<SavedJobLink> => {
  const timestamp = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('saved_job_links' as any)
      .update({ ...updates, updated_at: timestamp } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update saved link failed, updating localStorage:', error.message);
      const local = getLocalSavedLinks();
      const target = local.find((l) => l.id === id);
      const updated = {
        ...(target || ({} as SavedJobLink)),
        ...updates,
        id,
        updated_at: timestamp,
      } as SavedJobLink;
      saveLocalSavedLinks(local.map((l) => (l.id === id ? updated : l)));
      return updated;
    }

    const updated = data as unknown as SavedJobLink;
    const local = getLocalSavedLinks();
    saveLocalSavedLinks(local.map((l) => (l.id === id ? updated : l)));
    return updated;
  } catch (err) {
    console.warn('Error updating saved link, using localStorage:', err);
    const local = getLocalSavedLinks();
    const target = local.find((l) => l.id === id);
    const updated = {
      ...(target || ({} as SavedJobLink)),
      ...updates,
      id,
      updated_at: timestamp,
    } as SavedJobLink;
    saveLocalSavedLinks(local.map((l) => (l.id === id ? updated : l)));
    return updated;
  }
};

/**
 * Deletes a saved link.
 */
export const deleteSavedJobLink = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('saved_job_links' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete saved link failed, updating localStorage:', error.message);
    }
  } catch (err) {
    console.warn('Error deleting saved link from Supabase:', err);
  } finally {
    const local = getLocalSavedLinks();
    saveLocalSavedLinks(local.filter((l) => l.id !== id));
  }
};

/**
 * Marks a saved link as 'applied' once converted to an active application.
 */
export const markSavedJobLinkAsApplied = async (id: string): Promise<SavedJobLink> => {
  return updateSavedJobLink(id, { status: 'applied' });
};

// =========================================================
// Job Platforms: Directory & Stats per Platform
// =========================================================

const LOCAL_STORAGE_PLATFORMS_KEY = 'portfolio_job_platforms_cache';

export const DEFAULT_JOB_PLATFORMS: JobPlatform[] = [];

const getLocalJobPlatforms = (): JobPlatform[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLATFORMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any legacy default-* mock entries so only real user data appears
      const clean = parsed.filter((p: any) => p && !p.id?.startsWith('default-'));
      if (clean.length !== parsed.length) {
        localStorage.setItem(LOCAL_STORAGE_PLATFORMS_KEY, JSON.stringify(clean));
      }
      return clean;
    }
    return [];
  } catch {
    return [];
  }
};

const saveLocalJobPlatforms = (items: JobPlatform[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_PLATFORMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to write job platforms to localStorage', e);
  }
};

/**
 * Fetches all job platforms, prioritizing Supabase with localStorage fallback.
 * Returns only real inserted platforms (never hardcoded defaults).
 */
export const fetchJobPlatforms = async (): Promise<JobPlatform[]> => {
  try {
    const { data, error } = await supabase
      .from('job_platforms' as any)
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase job_platforms table unavailable, using local cache:', error.message);
      return getLocalJobPlatforms();
    }

    const platforms = (data || []) as unknown as JobPlatform[];
    saveLocalJobPlatforms(platforms);
    return platforms;
  } catch (err) {
    console.warn('Network error fetching job platforms, falling back to local cache:', err);
    return getLocalJobPlatforms();
  }
};

/**
 * Creates a new job platform.
 */
export const createJobPlatform = async (
  newPlatform: NewJobPlatform
): Promise<JobPlatform> => {
  const timestamp = new Date().toISOString();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `plt_${Date.now()}`;

  const candidate: JobPlatform = {
    ...newPlatform,
    id,
    created_at: timestamp,
    updated_at: timestamp,
  };

  try {
    const { data, error } = await supabase
      .from('job_platforms' as any)
      .insert({
        id: candidate.id,
        name: candidate.name,
        url: candidate.url,
        scope: candidate.scope,
        countries: candidate.countries || null,
        notes: candidate.notes || null,
      } as any)
      .select()
      .single();

    if (error) {
      console.warn('Failed to insert into Supabase job_platforms, saving locally:', error.message);
      const local = getLocalJobPlatforms();
      const updated = [candidate, ...local];
      saveLocalJobPlatforms(updated);
      return candidate;
    }

    const created = data as unknown as JobPlatform;
    const local = getLocalJobPlatforms();
    saveLocalJobPlatforms([...local.filter((p) => p.id !== created.id), created]);
    return created;
  } catch (err) {
    console.warn('Error creating job platform, using local storage:', err);
    const local = getLocalJobPlatforms();
    const updated = [candidate, ...local];
    saveLocalJobPlatforms(updated);
    return candidate;
  }
};

/**
 * Updates an existing job platform.
 */
export const updateJobPlatform = async (
  id: string,
  updates: Partial<JobPlatform>
): Promise<JobPlatform> => {
  const timestamp = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('job_platforms' as any)
      .update({ ...updates, updated_at: timestamp } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update platform failed, updating localStorage:', error.message);
      const local = getLocalJobPlatforms();
      const target = local.find((p) => p.id === id);
      const updated = {
        ...(target || ({} as JobPlatform)),
        ...updates,
        id,
        updated_at: timestamp,
      } as JobPlatform;
      saveLocalJobPlatforms(local.map((p) => (p.id === id ? updated : p)));
      return updated;
    }

    const updated = data as unknown as JobPlatform;
    const local = getLocalJobPlatforms();
    saveLocalJobPlatforms(local.map((p) => (p.id === id ? updated : p)));
    return updated;
  } catch (err) {
    console.warn('Error updating platform, using localStorage:', err);
    const local = getLocalJobPlatforms();
    const target = local.find((p) => p.id === id);
    const updated = {
      ...(target || ({} as JobPlatform)),
      ...updates,
      id,
      updated_at: timestamp,
    } as JobPlatform;
    saveLocalJobPlatforms(local.map((p) => (p.id === id ? updated : p)));
    return updated;
  }
};

/**
 * Deletes a job platform.
 */
export const deleteJobPlatform = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('job_platforms' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete platform failed, updating localStorage:', error.message);
    }
  } catch (err) {
    console.warn('Error deleting platform from Supabase:', err);
  } finally {
    const local = getLocalJobPlatforms();
    saveLocalJobPlatforms(local.filter((p) => p.id !== id));
  }
};

/**
 * Helper to extract clean domain from a URL (e.g., 'https://www.linkedin.com/jobs' -> 'linkedin.com')
 */
const extractDomainFromUrl = (url?: string | null): string => {
  if (!url) return '';
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

/**
 * Calculates real-time statistics of applications applied per platform.
 * Matches by:
 * 1. Normalized name matching between platform.name and app.found_in
 * 2. Hostname domain matching between platform.url and app.application_link
 */
export const calculatePlatformStats = (
  platforms: JobPlatform[],
  applications: JobApplication[]
): Record<string, PlatformStat> => {
  const statsMap: Record<string, PlatformStat> = {};

  // Initialize stats for each platform
  for (const p of platforms) {
    statsMap[p.id] = {
      platformId: p.id,
      platformName: p.name,
      totalApplied: 0,
      interviewing: 0,
      negotiating: 0,
      accepted: 0,
      noResponse: 0,
      notSelected: 0,
      withdrew: 0,
      responseRate: 0,
    };
  }

  for (const app of applications) {
    const foundIn = (app.found_in || '').trim().toLowerCase();
    const appDomain = extractDomainFromUrl(app.application_link);

    let matchedPlatform: JobPlatform | undefined;

    // 1. Direct platform_id connection between both tables
    if (app.platform_id) {
      matchedPlatform = platforms.find((p) => p.id === app.platform_id);
    }

    // 2. Direct or substring match on platform name and found_in
    if (!matchedPlatform && foundIn) {
      matchedPlatform = platforms.find((p) => {
        const pName = p.name.trim().toLowerCase();
        return foundIn === pName || foundIn.includes(pName) || pName.includes(foundIn);
      });
    }

    // 3. Domain match between platform URL and application_link
    if (!matchedPlatform && appDomain) {
      matchedPlatform = platforms.find((p) => {
        const pDomain = extractDomainFromUrl(p.url);
        return pDomain && (appDomain === pDomain || appDomain.includes(pDomain) || pDomain.includes(appDomain));
      });
    }

    if (matchedPlatform && statsMap[matchedPlatform.id]) {
      const s = statsMap[matchedPlatform.id];
      s.totalApplied++;

      switch (app.status) {
        case 'interviewing':
          s.interviewing++;
          break;
        case 'negotiating':
          s.negotiating++;
          break;
        case 'accepted':
          s.accepted++;
          break;
        case 'no response':
          s.noResponse++;
          break;
        case 'not selected':
          s.notSelected++;
          break;
        case 'withdrew':
          s.withdrew++;
          break;
        default:
          break;
      }
    }
  }

  // Compute response rates
  for (const p of platforms) {
    const s = statsMap[p.id];
    if (s.totalApplied > 0) {
      const responded = s.totalApplied - s.noResponse;
      s.responseRate = Math.round((responded / s.totalApplied) * 100);
    }
  }

  return statsMap;
};

/**
 * Checks a URL domain against the user's configured job platforms.
 * Returns the matching JobPlatform if found.
 */
export const findPlatformByUrl = (
  url: string,
  platforms: JobPlatform[] = []
): JobPlatform | undefined => {
  if (!url || platforms.length === 0) return undefined;
  const targetDomain = extractDomainFromUrl(url);
  if (!targetDomain) return undefined;

  return platforms.find((p) => {
    const pDomain = extractDomainFromUrl(p.url);
    return pDomain && (targetDomain === pDomain || targetDomain.includes(pDomain) || pDomain.includes(targetDomain));
  });
};



