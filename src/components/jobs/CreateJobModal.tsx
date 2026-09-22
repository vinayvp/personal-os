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
  ScrollText,
  Target,
  Plus,
  Trash2,
  Clock,
  Calculator,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { AtsCalculatorModal, AtsSourceEntry } from './AtsCalculatorModal';
import {
  JobStatus,
  NewJobApplication,
  JobFollowUp,
  FollowUpType,
  STATUS_CONFIG,
  COMMON_CURRENCIES,
  JOB_TYPE_OPTIONS,
  JobPlatform,
  VisaSponsorship,
  VISA_SPONSORSHIP_OPTIONS,
} from './types';
import {
  uploadResume,
  uploadCoverLetter,
  validateResumeFile,
  convertSalaryToInr,
  findPlatformByUrl,
  normalizeFollowUps,
} from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newJob: NewJobApplication, fromSavedLinkId?: string) => Promise<void>;
  initialData?: Partial<NewJobApplication> | null;
  fromSavedLinkId?: string | null;
  platforms?: JobPlatform[];
  onOpenAddPlatform?: () => void;
}

const CreateJobModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  fromSavedLinkId,
  platforms = [],
  onOpenAddPlatform,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [isCustomJobType, setIsCustomJobType] = useState(false);
  const [customJobType, setCustomJobType] = useState('');
  const [visaSponsorship, setVisaSponsorship] = useState<VisaSponsorship>('no');
  const [status, setStatus] = useState<JobStatus>('applied');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [applicationLink, setApplicationLink] = useState('');
  const [chatgptThreadLink, setChatgptThreadLink] = useState('');
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [isCustomFoundIn, setIsCustomFoundIn] = useState(false);
  const [customFoundIn, setCustomFoundIn] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPhone, setRecruiterPhone] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [atsScore, setAtsScore] = useState('');
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [atsSources, setAtsSources] = useState<AtsSourceEntry[]>([]);
  const [followUps, setFollowUps] = useState<JobFollowUp[]>([]);
  const [newFollowUpDate, setNewFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [newFollowUpType, setNewFollowUpType] = useState<FollowUpType>('Email');
  const [newFollowUpNotes, setNewFollowUpNotes] = useState('');
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);

  // Resume file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Cover letter file state (optional)
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<File | null>(null);
  const [isUploadingCoverLetter, setIsUploadingCoverLetter] = useState(false);

  const resetForm = () => {
    setAppliedDate(new Date().toISOString().split('T')[0]);
    setCompanyName('');
    setRoleName('');
    setCity('');
    setCountry('');
    setJobType('Full-time');
    setIsCustomJobType(false);
    setCustomJobType('');
    setVisaSponsorship('no');
    setStatus('applied');
    setSalaryMin('');
    setSalaryMax('');
    setSalaryCurrency('USD');
    setApplicationLink('');
    setChatgptThreadLink('');
    setSelectedPlatformId('');
    setIsCustomFoundIn(false);
    setCustomFoundIn('');
    setJobDescription('');
    setRecruiterEmail('');
    setRecruiterPhone('');
    setFollowUpNotes('');
    setAtsScore('');
    setAtsSources([]);
    setFollowUps([]);
    setNewFollowUpDate(new Date().toISOString().split('T')[0]);
    setNewFollowUpType('Email');
    setNewFollowUpNotes('');
    setIsAddingFollowUp(false);
    setSelectedFile(null);
    setSelectedCoverLetter(null);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        if (initialData.company_name) setCompanyName(initialData.company_name);
        if (initialData.role_name) setRoleName(initialData.role_name);
        if (initialData.city) setCity(initialData.city);
        if (initialData.country) setCountry(initialData.country);
        if (initialData.visa_sponsorship) setVisaSponsorship(initialData.visa_sponsorship as VisaSponsorship);
        if (initialData.application_link) setApplicationLink(initialData.application_link);
        if (initialData.chatgpt_thread_link) setChatgptThreadLink(initialData.chatgpt_thread_link);
        if (initialData.follow_up_notes) setFollowUpNotes(initialData.follow_up_notes);
        if (initialData.ats_score != null) setAtsScore(String(initialData.ats_score));
        if (initialData.ats_scores && initialData.ats_scores.length > 0) {
          setAtsSources(
            initialData.ats_scores.map((s) => ({
              id: s.id || `src_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              platform_id: s.platform_id,
              source: s.platform_name,
              score: String(s.score),
            }))
          );
        }
        if (initialData.follow_ups) setFollowUps(normalizeFollowUps(initialData.follow_ups));
        if (initialData.platform_id) {
          setSelectedPlatformId(initialData.platform_id);
          setIsCustomFoundIn(false);
        } else if (initialData.found_in) {
          const matched = platforms.find(
            (p) => p.name.toLowerCase() === initialData.found_in?.trim().toLowerCase()
          );
          if (matched) {
            setSelectedPlatformId(matched.id);
            setIsCustomFoundIn(false);
          } else {
            setIsCustomFoundIn(true);
            setCustomFoundIn(initialData.found_in);
          }
        }
      }
    } else {
      resetForm();
    }
  }, [isOpen, initialData, platforms]);

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

    setSelectedFile(file);
  };

  const handleCoverLetterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedCoverLetter(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !roleName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please provide both Company Name and Role Name.',
      });
      return;
    }

    // Validate link if provided
    let cleanLink: string | null = applicationLink.trim() || null;
    if (cleanLink && !cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      cleanLink = `https://${cleanLink}`;
    }

    let cleanChatgptLink: string | null = chatgptThreadLink.trim() || null;
    if (cleanChatgptLink && !cleanChatgptLink.startsWith('http://') && !cleanChatgptLink.startsWith('https://')) {
      cleanChatgptLink = `https://${cleanChatgptLink}`;
    }

    setIsSubmitting(true);

    try {
      let resumeStoragePath: string | null = null;
      let resumeFilename: string | null = null;
      let coverLetterStoragePath: string | null = null;
      let coverLetterFilename: string | null = null;

      // Upload tailored resume to private bucket if selected
      if (selectedFile) {
        setIsUploadingResume(true);
        const uploadResult = await uploadResume(selectedFile);
        resumeStoragePath = uploadResult.storagePath;
        resumeFilename = uploadResult.filename;
        setIsUploadingResume(false);
      }

      // Upload optional cover letter to private bucket if selected
      if (selectedCoverLetter) {
        setIsUploadingCoverLetter(true);
        const clUploadResult = await uploadCoverLetter(selectedCoverLetter);
        coverLetterStoragePath = clUploadResult.storagePath;
        coverLetterFilename = clUploadResult.filename;
        setIsUploadingCoverLetter(false);
      }

      const numMin = salaryMin ? parseFloat(salaryMin) : null;
      const numMax = salaryMax ? parseFloat(salaryMax) : null;
      const salaryConversion = await convertSalaryToInr(numMin, numMax, salaryCurrency);

      let finalPlatformId: string | null = null;
      let finalFoundIn: string | null = null;

      if (isCustomFoundIn) {
        finalFoundIn = customFoundIn.trim() || null;
      } else if (selectedPlatformId) {
        const platform = platforms.find((p) => p.id === selectedPlatformId);
        if (platform) {
          finalPlatformId = platform.id;
          finalFoundIn = platform.name;
        }
      }

      const newJob: NewJobApplication = {
        applied_date: appliedDate,
        company_name: companyName.trim(),
        role_name: roleName.trim(),
        city: city.trim() || null,
        country: country.trim() || null,
        job_type: (isCustomJobType ? customJobType.trim() : jobType) || null,
        visa_sponsorship: visaSponsorship,
        status,
        salary_min: numMin,
        salary_max: numMax,
        salary_currency: salaryCurrency,
        salary_min_inr: salaryConversion.salary_min_inr,
        salary_max_inr: salaryConversion.salary_max_inr,
        salary_inr_rate: salaryConversion.salary_inr_rate,
        resume_url: null, // Kept private; accessed via signed URLs
        resume_filename: resumeFilename,
        resume_storage_path: resumeStoragePath,
        cover_letter_filename: coverLetterFilename,
        cover_letter_storage_path: coverLetterStoragePath,
        application_link: cleanLink,
        chatgpt_thread_link: cleanChatgptLink,
        platform_id: finalPlatformId,
        found_in: finalFoundIn,
        job_description: jobDescription.trim() || null,
        recruiter_email: recruiterEmail.trim() || null,
        recruiter_phone: recruiterPhone.trim() || null,
        follow_up_notes: followUpNotes.trim() || null,
        ats_score: atsScore.trim() !== '' && !isNaN(Number(atsScore.trim()))
          ? Math.min(100, Math.max(0, Number(atsScore.trim())))
          : null,
        follow_ups: followUps.length > 0 ? followUps : null,
        ats_scores: atsSources
          .filter((s) => s.score.trim() !== '' && !isNaN(Number(s.score)))
          .map((s) => ({
            id: s.id,
            job_id: '',
            platform_id: s.platform_id || null,
            platform_name: s.source.trim(),
            score: Number(s.score),
          })),
      };

      await onSuccess(newJob, fromSavedLinkId || undefined);
      resetForm();
      onClose();
      toast({
        title: 'Application Added',
        description: `Successfully added ${newJob.role_name} at ${newJob.company_name}`,
      });
    } catch (err: any) {
      console.error('Error adding job application:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to save application.',
      });
    } finally {
      setIsSubmitting(false);
      setIsUploadingResume(false);
      setIsUploadingCoverLetter(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="text-left pb-2 border-b border-border/60">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Add Job Application
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Track a new opportunity with tailored resume storage and recruiter details.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-xs font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Company Name *
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. Stripe, Google, Spotify"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roleName" className="text-xs font-semibold flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Role / Title *
              </Label>
              <Input
                id="roleName"
                placeholder="e.g. Senior Frontend Engineer"
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
              <Label htmlFor="status" className="text-xs font-semibold">
                Application Status
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as JobStatus)}>
                <SelectTrigger id="status" className="h-9">
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
              <Label htmlFor="appliedDate" className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Applied Date
              </Label>
              <Input
                id="appliedDate"
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="foundIn" className="text-xs font-semibold">
                  Job Platform / Source
                </Label>
                <div className="flex items-center gap-2">
                  {onOpenAddPlatform && (
                    <button
                      type="button"
                      onClick={onOpenAddPlatform}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      + New Platform
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCustomFoundIn(!isCustomFoundIn)}
                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {isCustomFoundIn ? '← Select platform' : '+ Custom text'}
                  </button>
                </div>
              </div>

              {isCustomFoundIn ? (
                <Input
                  id="foundIn"
                  placeholder="e.g. Direct Referral, Meetup, Event..."
                  value={customFoundIn}
                  onChange={(e) => setCustomFoundIn(e.target.value)}
                  className="h-9 text-xs"
                  autoFocus
                />
              ) : (
                <Select
                  value={selectedPlatformId}
                  onValueChange={(val) => {
                    if (val === '__custom__') {
                      setIsCustomFoundIn(true);
                      setSelectedPlatformId('');
                    } else if (val === '__add_new__') {
                      onOpenAddPlatform?.();
                    } else {
                      setSelectedPlatformId(val);
                    }
                  }}
                >
                  <SelectTrigger id="foundIn" className="h-9 text-xs">
                    <SelectValue placeholder={platforms.length > 0 ? "Select from Job Platforms" : "No platforms in directory"} />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.scope === 'specific' && p.countries?.length ? `(${p.countries.join(', ')})` : ''}
                      </SelectItem>
                    ))}
                    {platforms.length === 0 && (
                      <SelectItem value="__add_new__" className="text-primary font-medium">
                        + Add Platform to Directory
                      </SelectItem>
                    )}
                    <SelectItem value="__custom__" className="text-muted-foreground">
                      + Other (Type custom text...)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Location, Job Type & Visa Sponsorship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                City / Region
              </Label>
              <Input
                id="city"
                placeholder="e.g. London, Malmö"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs font-semibold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Country
              </Label>
              <Input
                id="country"
                placeholder="e.g. Sweden, USA, UK"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="jobType" className="text-xs font-semibold flex items-center gap-1">
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
                  id="jobType"
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
                  <SelectTrigger id="jobType" className="h-9 text-xs">
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

            <div className="space-y-1.5">
              <Label htmlFor="visaSponsorship" className="text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                Visa Sponsorship
              </Label>
              <Select
                value={visaSponsorship}
                onValueChange={(val) => setVisaSponsorship(val as VisaSponsorship)}
              >
                <SelectTrigger id="visaSponsorship" className="h-9 text-xs">
                  <SelectValue placeholder="Visa Sponsorship" />
                </SelectTrigger>
                <SelectContent>
                  {VISA_SPONSORSHIP_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${opt.dotClass}`} />
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Compensation Range & ATS Match Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Estimated Compensation Range
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Min (120000)"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="h-9"
                />
                <Input
                  type="number"
                  placeholder="Max (160000)"
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

            {/* ATS Score */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="atsScore" className="text-xs font-semibold flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  ATS Score
                </Label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAtsModalOpen(true)}
                    className="h-6 px-2 text-[11px] font-medium gap-1 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                  >
                    <Calculator className="w-3 h-3" />
                    ATS
                  </Button>
                  {atsScore.trim() !== '' && !isNaN(Number(atsScore)) && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      Number(atsScore) >= 80
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : Number(atsScore) >= 60
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {Number(atsScore)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input
                  id="atsScore"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g. 85"
                  value={atsScore}
                  onChange={(e) => setAtsScore(e.target.value)}
                  className="h-9 pr-7 font-mono text-xs"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Documents Upload (Resume & Optional Cover Letter) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Tailored Resume */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Tailored Resume
                </span>
                <span className="text-[10px] text-muted-foreground">PDF/Word ≤10MB</span>
              </Label>

              {selectedFile ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5 min-h-[72px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground truncate block">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="border border-dashed border-border/80 hover:border-primary/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-card/40 hover:bg-card/70 transition-colors min-h-[72px]">
                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground text-center">
                    Upload Tailored Resume
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center">
                    Stored securely in private cloud
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Optional Cover Letter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ScrollText className="w-3.5 h-3.5 text-emerald-400" />
                  Cover Letter <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
                </span>
                <span className="text-[10px] text-muted-foreground">PDF/Word ≤10MB</span>
              </Label>

              {selectedCoverLetter ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 min-h-[72px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <ScrollText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground truncate block">
                        {selectedCoverLetter.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {(selectedCoverLetter.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setSelectedCoverLetter(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="border border-dashed border-border/80 hover:border-emerald-500/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-card/40 hover:bg-card/70 transition-colors min-h-[72px]">
                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground text-center">
                    Upload Cover Letter
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center">
                    Optional • Stored securely
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCoverLetterChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Application Link */}
          <div className="space-y-1.5">
            <Label htmlFor="applicationLink" className="text-xs font-semibold flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
              Application / Job Posting Link
            </Label>
            <Input
              id="applicationLink"
              type="url"
              placeholder="https://company.com/careers/job-id"
              value={applicationLink}
              onChange={(e) => setApplicationLink(e.target.value)}
              className="h-9"
            />
          </div>

          {/* ChatGPT Thread Link (for Resume Tailoring) */}
          <div className="space-y-1.5">
            <Label htmlFor="chatgptThreadLink" className="text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                ChatGPT Thread Link
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Resume tailoring conversation</span>
            </Label>
            <Input
              id="chatgptThreadLink"
              type="url"
              placeholder="https://chatgpt.com/c/... (used for customizing resume)"
              value={chatgptThreadLink}
              onChange={(e) => setChatgptThreadLink(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Recruiter Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="recruiterEmail" className="text-xs font-semibold flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Recruiter Email
              </Label>
              <Input
                id="recruiterEmail"
                type="email"
                placeholder="recruiter@company.com"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recruiterPhone" className="text-xs font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Recruiter Phone
              </Label>
              <Input
                id="recruiterPhone"
                type="tel"
                placeholder="+1 555-0192"
                value={recruiterPhone}
                onChange={(e) => setRecruiterPhone(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-1.5">
            <Label htmlFor="jobDescription" className="text-xs font-semibold">
              Job Description / Key Requirements
            </Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste job overview, required tech stack, responsibilities..."
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="resize-y text-xs"
            />
          </div>

          {/* Follow-up Notes & Multiple Follow-up Log */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Follow-ups & Outreach Logs
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setIsAddingFollowUp(!isAddingFollowUp)}
              >
                <Plus className="w-3 h-3" />
                {isAddingFollowUp ? 'Cancel' : 'Add Follow-up'}
              </Button>
            </div>

            {/* List of added follow-ups */}
            {followUps.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-border/70 bg-muted/20 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{fu.type}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{fu.date}</span>
                      </div>
                      <p className="text-foreground/90 text-xs whitespace-pre-wrap">{fu.notes}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setFollowUps(prev => prev.filter(item => item.id !== fu.id))}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline add follow-up card */}
            {isAddingFollowUp && (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Date</Label>
                    <Input
                      type="date"
                      value={newFollowUpDate}
                      onChange={(e) => setNewFollowUpDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Type</Label>
                    <Select value={newFollowUpType} onValueChange={(val) => setNewFollowUpType(val as FollowUpType)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Phone Call">Phone Call</SelectItem>
                        <SelectItem value="Message">Message</SelectItem>
                        <SelectItem value="In-Person">In-Person</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Notes</Label>
                  <Textarea
                    placeholder="e.g. Sent email follow-up regarding interview schedule..."
                    rows={2}
                    value={newFollowUpNotes}
                    onChange={(e) => setNewFollowUpNotes(e.target.value)}
                    className="text-xs resize-y"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setIsAddingFollowUp(false);
                      setNewFollowUpNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    disabled={!newFollowUpNotes.trim()}
                    onClick={() => {
                      if (!newFollowUpNotes.trim()) return;
                      const newItem: JobFollowUp = {
                        id: crypto.randomUUID ? crypto.randomUUID() : `fu_${Date.now()}`,
                        date: newFollowUpDate,
                        type: newFollowUpType,
                        notes: newFollowUpNotes.trim(),
                        status: 'completed',
                        created_at: new Date().toISOString(),
                      };
                      setFollowUps(prev => [newItem, ...prev]);
                      setNewFollowUpNotes('');
                      setIsAddingFollowUp(false);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    Save Follow-up
                  </Button>
                </div>
              </div>
            )}

            {/* General Notes */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="followUpNotes" className="text-xs font-semibold text-muted-foreground">
                General Notes & Next Steps (Optional)
              </Label>
              <Textarea
                id="followUpNotes"
                placeholder="e.g. Sent connection request on LinkedIn, interview scheduled for Tuesday..."
                rows={2}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                className="resize-y text-xs"
              />
            </div>
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
                'Save Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AtsCalculatorModal
      isOpen={isAtsModalOpen}
      onClose={() => setIsAtsModalOpen(false)}
      initialScore={atsScore.trim() !== '' && !isNaN(Number(atsScore)) ? Number(atsScore) : null}
      savedSources={atsSources}
      onApply={(avg, sources) => {
        setAtsScore(String(avg));
        if (sources) setAtsSources(sources);
      }}
    />
  </>
  );
};

export default CreateJobModal;

