import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Globe,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  UploadCloud,
  X,
  Loader2,
  Download,
  ScrollText,
} from 'lucide-react';
import {
  JobApplication,
  JobStatus,
  STATUS_CONFIG,
  COMMON_CURRENCIES,
  FOUND_IN_OPTIONS,
  JOB_TYPE_OPTIONS,
} from './types';
import {
  uploadResume,
  uploadCoverLetter,
  validateResumeFile,
  downloadResume,
  convertSalaryToInr,
} from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface Props {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: string, updates: Partial<JobApplication>) => Promise<void>;
}

const EditJobModal: React.FC<Props> = ({ job, isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [appliedDate, setAppliedDate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [isCustomJobType, setIsCustomJobType] = useState(false);
  const [customJobType, setCustomJobType] = useState('');
  const [status, setStatus] = useState<JobStatus>('applied');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [applicationLink, setApplicationLink] = useState('');
  const [isCustomFoundIn, setIsCustomFoundIn] = useState(false);
  const [foundInPreset, setFoundInPreset] = useState('LinkedIn');
  const [customFoundIn, setCustomFoundIn] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Resume state
  const [existingResumePath, setExistingResumePath] = useState<string | null>(null);
  const [existingResumeName, setExistingResumeName] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Cover letter state
  const [existingCoverLetterPath, setExistingCoverLetterPath] = useState<string | null>(null);
  const [existingCoverLetterName, setExistingCoverLetterName] = useState<string | null>(null);
  const [newCoverLetterFile, setNewCoverLetterFile] = useState<File | null>(null);
  const [isUploadingCoverLetter, setIsUploadingCoverLetter] = useState(false);

  useEffect(() => {
    if (job) {
      setAppliedDate(job.applied_date || '');
      setCompanyName(job.company_name || '');
      setRoleName(job.role_name || '');
      setCity(job.city || '');
      setCountry(job.country || '');
      setStatus(job.status || 'applied');
      setSalaryMin(job.salary_min != null ? String(job.salary_min) : '');
      setSalaryMax(job.salary_max != null ? String(job.salary_max) : '');
      setSalaryCurrency(job.salary_currency || 'USD');
      setApplicationLink(job.application_link || '');

      if (job.job_type) {
        if (JOB_TYPE_OPTIONS.includes(job.job_type as any)) {
          setIsCustomJobType(false);
          setJobType(job.job_type);
          setCustomJobType('');
        } else {
          setIsCustomJobType(true);
          setJobType('Full-time');
          setCustomJobType(job.job_type);
        }
      } else {
        setIsCustomJobType(false);
        setJobType('Full-time');
        setCustomJobType('');
      }

      if (job.found_in) {
        if (FOUND_IN_OPTIONS.includes(job.found_in)) {
          setIsCustomFoundIn(false);
          setFoundInPreset(job.found_in);
          setCustomFoundIn('');
        } else {
          setIsCustomFoundIn(true);
          setFoundInPreset('LinkedIn');
          setCustomFoundIn(job.found_in);
        }
      } else {
        setIsCustomFoundIn(false);
        setFoundInPreset('LinkedIn');
        setCustomFoundIn('');
      }

      setJobDescription(job.job_description || '');
      setRecruiterEmail(job.recruiter_email || '');
      setRecruiterPhone(job.recruiter_phone || '');
      setFollowUpNotes(job.follow_up_notes || '');
      setExistingResumePath(job.resume_storage_path || null);
      setExistingResumeName(job.resume_filename || null);
      setNewFile(null);
      setExistingCoverLetterPath(job.cover_letter_storage_path || null);
      setExistingCoverLetterName(job.cover_letter_filename || null);
      setNewCoverLetterFile(null);
    }
  }, [job]);

  if (!job) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateResumeFile(file);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: validation.error,
      });
      return;
    }

    setNewFile(file);
  };

  const handleCoverLetterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateResumeFile(file);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: validation.error,
      });
      return;
    }

    setNewCoverLetterFile(file);
  };

  const handleDownloadExisting = async () => {
    if (!existingResumePath) return;
    try {
      await downloadResume(existingResumePath, existingResumeName || 'resume.pdf');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err?.message || 'Could not download resume',
      });
    }
  };

  const handleDownloadExistingCoverLetter = async () => {
    if (!existingCoverLetterPath) return;
    try {
      await downloadResume(existingCoverLetterPath, existingCoverLetterName || 'cover_letter.pdf');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err?.message || 'Could not download cover letter',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !roleName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Company Name and Role Name are required.',
      });
      return;
    }

    let cleanLink: string | null = applicationLink.trim() || null;
    if (cleanLink && !cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      cleanLink = `https://${cleanLink}`;
    }

    setIsSubmitting(true);

    try {
      let resumeStoragePath = existingResumePath;
      let resumeFilename = existingResumeName;
      let coverLetterStoragePath = existingCoverLetterPath;
      let coverLetterFilename = existingCoverLetterName;

      // If a new resume is provided, upload it
      if (newFile) {
        setIsUploadingResume(true);
        const uploadResult = await uploadResume(newFile);
        resumeStoragePath = uploadResult.storagePath;
        resumeFilename = uploadResult.filename;
        setIsUploadingResume(false);
      }

      // If a new cover letter is provided, upload it
      if (newCoverLetterFile) {
        setIsUploadingCoverLetter(true);
        const clUploadResult = await uploadCoverLetter(newCoverLetterFile);
        coverLetterStoragePath = clUploadResult.storagePath;
        coverLetterFilename = clUploadResult.filename;
        setIsUploadingCoverLetter(false);
      }

      const numMin = salaryMin ? parseFloat(salaryMin) : null;
      const numMax = salaryMax ? parseFloat(salaryMax) : null;
      const salaryConversion = await convertSalaryToInr(numMin, numMax, salaryCurrency);

      const updates: Partial<JobApplication> = {
        applied_date: appliedDate,
        company_name: companyName.trim(),
        role_name: roleName.trim(),
        city: city.trim() || null,
        country: country.trim() || null,
        job_type: (isCustomJobType ? customJobType.trim() : jobType) || null,
        status,
        salary_min: numMin,
        salary_max: numMax,
        salary_currency: salaryCurrency,
        salary_min_inr: salaryConversion.salary_min_inr,
        salary_max_inr: salaryConversion.salary_max_inr,
        salary_inr_rate: salaryConversion.salary_inr_rate,
        resume_filename: resumeFilename,
        resume_storage_path: resumeStoragePath,
        cover_letter_filename: coverLetterFilename,
        cover_letter_storage_path: coverLetterStoragePath,
        application_link: cleanLink,
        found_in: (isCustomFoundIn ? customFoundIn.trim() : foundInPreset) || null,
        job_description: jobDescription.trim() || null,
        recruiter_email: recruiterEmail.trim() || null,
        recruiter_phone: recruiterPhone.trim() || null,
        follow_up_notes: followUpNotes.trim() || null,
      };

      await onSuccess(job.id, updates);
      onClose();
      toast({
        title: 'Application Updated',
        description: `Saved changes to ${roleName} at ${companyName}`,
      });
    } catch (err: any) {
      console.error('Error updating application:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to update application.',
      });
    } finally {
      setIsSubmitting(false);
      setIsUploadingResume(false);
      setIsUploadingCoverLetter(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="text-left pb-2 border-b border-border/60">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Edit Job Application
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Update application status, tailored resume, or follow-up notes.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="editCompanyName" className="text-xs font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Company Name *
              </Label>
              <Input
                id="editCompanyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editRoleName" className="text-xs font-semibold flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Role / Title *
              </Label>
              <Input
                id="editRoleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
                className="h-9"
              />
            </div>
          </div>

          {/* Status, Date, & Found In */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="editStatus" className="text-xs font-semibold">
                Application Status
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as JobStatus)}>
                <SelectTrigger id="editStatus" className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CONFIG) as JobStatus[]).map((st) => (
                    <SelectItem key={st} value={st}>
                      {STATUS_CONFIG[st].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editAppliedDate" className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Applied Date
              </Label>
              <Input
                id="editAppliedDate"
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="editFoundIn" className="text-xs font-semibold">
                  Found In / Platform
                </Label>
                <button
                  type="button"
                  onClick={() => setIsCustomFoundIn(!isCustomFoundIn)}
                  className="text-[11px] text-primary hover:underline"
                >
                  {isCustomFoundIn ? '← List' : '+ Custom'}
                </button>
              </div>

              {isCustomFoundIn ? (
                <Input
                  id="editFoundIn"
                  placeholder="e.g. Hacker News, Meetup..."
                  value={customFoundIn}
                  onChange={(e) => setCustomFoundIn(e.target.value)}
                  className="h-9 text-xs"
                  autoFocus
                />
              ) : (
                <Select
                  value={foundInPreset}
                  onValueChange={(val) => {
                    if (val === '__custom__') {
                      setIsCustomFoundIn(true);
                    } else {
                      setFoundInPreset(val);
                    }
                  }}
                >
                  <SelectTrigger id="editFoundIn" className="h-9 text-xs">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOUND_IN_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-primary font-medium">
                      + Other (Type custom text...)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Location & Job Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="editCity" className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                City / Region
              </Label>
              <Input
                id="editCity"
                placeholder="e.g. London, Malmö"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editCountry" className="text-xs font-semibold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Country
              </Label>
              <Input
                id="editCountry"
                placeholder="e.g. Sweden, USA, UK"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="editJobType" className="text-xs font-semibold flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                  Job Type
                </Label>
                <button
                  type="button"
                  onClick={() => setIsCustomJobType(!isCustomJobType)}
                  className="text-[11px] text-primary hover:underline"
                >
                  {isCustomJobType ? '← List' : '+ Custom'}
                </button>
              </div>

              {isCustomJobType ? (
                <Input
                  id="editJobType"
                  placeholder="e.g. Contract-to-hire"
                  value={customJobType}
                  onChange={(e) => setCustomJobType(e.target.value)}
                  className="h-9 text-xs"
                  autoFocus
                />
              ) : (
                <Select
                  value={jobType}
                  onValueChange={(val) => {
                    if (val === '__custom__') {
                      setIsCustomJobType(true);
                    } else {
                      setJobType(val);
                    }
                  }}
                >
                  <SelectTrigger id="editJobType" className="h-9 text-xs">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPE_OPTIONS.map((jt) => (
                      <SelectItem key={jt} value={jt}>
                        {jt}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-primary font-medium">
                      + Custom (Type text...)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Compensation Range */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Estimated Compensation Range
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              <Input
                type="number"
                placeholder="Min"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="h-9"
              />
              <Input
                type="number"
                placeholder="Max"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="h-9"
              />
              <Select value={salaryCurrency} onValueChange={setSalaryCurrency}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Documents Management (Resume & Optional Cover Letter) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Tailored Resume Management */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Tailored Resume
                </span>
                <span className="text-[10px] text-muted-foreground">PDF/Word ≤10MB</span>
              </Label>

              {/* Currently attached resume */}
              {existingResumePath && !newFile && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/40 min-h-[72px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      {existingResumeName || 'Tailored Resume'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-primary hover:text-primary/90 px-2"
                      onClick={handleDownloadExisting}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setExistingResumePath(null);
                        setExistingResumeName(null);
                      }}
                      title="Remove attached resume"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Newly selected file to upload */}
              {newFile ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/40 bg-primary/10 min-h-[72px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      Replace with: {newFile.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setNewFile(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : !existingResumePath ? (
                <label className="border border-dashed border-border/70 hover:border-primary/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-card/40 hover:bg-card/70 transition-colors min-h-[72px]">
                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-foreground text-center">
                    Upload Tailored Resume
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : null}

              {/* If existing resume is present, show replace link */}
              {existingResumePath && !newFile && (
                <label className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1 justify-end pt-0.5">
                  <UploadCloud className="w-3 h-3" />
                  <span>Replace resume</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Cover Letter Management */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ScrollText className="w-3.5 h-3.5 text-emerald-400" />
                  Cover Letter <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
                </span>
                <span className="text-[10px] text-muted-foreground">PDF/Word ≤10MB</span>
              </Label>

              {/* Currently attached cover letter */}
              {existingCoverLetterPath && !newCoverLetterFile && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/40 min-h-[72px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <ScrollText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      {existingCoverLetterName || 'Cover Letter'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-emerald-400 hover:text-emerald-300 px-2"
                      onClick={handleDownloadExistingCoverLetter}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setExistingCoverLetterPath(null);
                        setExistingCoverLetterName(null);
                      }}
                      title="Remove attached cover letter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Newly selected cover letter to upload */}
              {newCoverLetterFile ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 min-h-[72px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <ScrollText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      Replace with: {newCoverLetterFile.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setNewCoverLetterFile(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : !existingCoverLetterPath ? (
                <label className="border border-dashed border-border/70 hover:border-emerald-500/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-card/40 hover:bg-card/70 transition-colors min-h-[72px]">
                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-foreground text-center">
                    Upload Cover Letter
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCoverLetterFileChange}
                    className="hidden"
                  />
                </label>
              ) : null}

              {/* If existing cover letter is present, show replace link */}
              {existingCoverLetterPath && !newCoverLetterFile && (
                <label className="text-[11px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 justify-end pt-0.5">
                  <UploadCloud className="w-3 h-3" />
                  <span>Replace cover letter</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCoverLetterFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Application Link */}
          <div className="space-y-1.5">
            <Label htmlFor="editApplicationLink" className="text-xs font-semibold flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
              Application / Job Posting Link
            </Label>
            <Input
              id="editApplicationLink"
              type="url"
              value={applicationLink}
              onChange={(e) => setApplicationLink(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Recruiter Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="editRecruiterEmail" className="text-xs font-semibold flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Recruiter Email
              </Label>
              <Input
                id="editRecruiterEmail"
                type="email"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editRecruiterPhone" className="text-xs font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Recruiter Phone
              </Label>
              <Input
                id="editRecruiterPhone"
                type="tel"
                value={recruiterPhone}
                onChange={(e) => setRecruiterPhone(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-1.5">
            <Label htmlFor="editJobDescription" className="text-xs font-semibold">
              Job Description / Notes
            </Label>
            <Textarea
              id="editJobDescription"
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="resize-y text-xs"
            />
          </div>

          {/* Follow-up Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="editFollowUpNotes" className="text-xs font-semibold">
              Follow-Up Notes & Next Steps
            </Label>
            <Textarea
              id="editFollowUpNotes"
              rows={2}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              className="resize-y text-xs"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/60 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isUploadingResume
                    ? 'Uploading Resume...'
                    : isUploadingCoverLetter
                    ? 'Uploading Cover Letter...'
                    : 'Saving...'}
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobModal;

