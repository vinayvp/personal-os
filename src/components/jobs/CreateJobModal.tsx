import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  JobStatus,
  NewJobApplication,
  STATUS_CONFIG,
  COMMON_CURRENCIES,
  FOUND_IN_OPTIONS,
} from './types';
import { uploadResume, validateResumeFile, convertSalaryToInr } from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newJob: NewJobApplication) => Promise<void>;
}

const CreateJobModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
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

  // Resume file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const resetForm = () => {
    setAppliedDate(new Date().toISOString().split('T')[0]);
    setCompanyName('');
    setRoleName('');
    setCity('');
    setCountry('');
    setStatus('applied');
    setSalaryMin('');
    setSalaryMax('');
    setSalaryCurrency('USD');
    setApplicationLink('');
    setIsCustomFoundIn(false);
    setFoundInPreset('LinkedIn');
    setCustomFoundIn('');
    setJobDescription('');
    setRecruiterEmail('');
    setRecruiterPhone('');
    setFollowUpNotes('');
    setSelectedFile(null);
  };

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

    setIsSubmitting(true);

    try {
      let resumeStoragePath: string | null = null;
      let resumeFilename: string | null = null;

      // Upload tailored resume to private bucket if selected
      if (selectedFile) {
        setIsUploadingResume(true);
        const uploadResult = await uploadResume(selectedFile);
        resumeStoragePath = uploadResult.storagePath;
        resumeFilename = uploadResult.filename;
        setIsUploadingResume(false);
      }

      const numMin = salaryMin ? parseFloat(salaryMin) : null;
      const numMax = salaryMax ? parseFloat(salaryMax) : null;
      const salaryConversion = await convertSalaryToInr(numMin, numMax, salaryCurrency);

      const newJob: NewJobApplication = {
        applied_date: appliedDate,
        company_name: companyName.trim(),
        role_name: roleName.trim(),
        city: city.trim() || null,
        country: country.trim() || null,
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
        application_link: cleanLink,
        found_in: (isCustomFoundIn ? customFoundIn.trim() : foundInPreset) || null,
        job_description: jobDescription.trim() || null,
        recruiter_email: recruiterEmail.trim() || null,
        recruiter_phone: recruiterPhone.trim() || null,
        follow_up_notes: followUpNotes.trim() || null,
      };

      await onSuccess(newJob);
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
    }
  };

  return (
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
                  id="foundIn"
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
                  <SelectTrigger id="foundIn" className="h-9 text-xs">
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

          {/* Location: City & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                City / Region
              </Label>
              <Input
                id="city"
                placeholder="e.g. London, San Francisco, Remote"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs font-semibold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Country (for Country Analytics)
              </Label>
              <Input
                id="country"
                placeholder="e.g. United Kingdom, Germany, USA"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-9"
              />
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
                placeholder="Min (e.g. 120000)"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="h-9"
              />
              <Input
                type="number"
                placeholder="Max (e.g. 160000)"
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

          {/* Tailored Resume Upload (Private Storage) */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Tailored Resume Used (Stored Privately)
              </span>
              <span className="text-[10px] text-muted-foreground">PDF, DOC, DOCX up to 10MB</span>
            </Label>

            {selectedFile ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <label className="border border-dashed border-border/80 hover:border-primary/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-card/40 hover:bg-card/70 transition-colors">
                <UploadCloud className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  Click to upload the customized resume used for this application
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Stored securely so you can retrieve or download it anytime
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

          {/* Follow-up Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="followUpNotes" className="text-xs font-semibold">
              Follow-Up Notes & Next Steps
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

          <DialogFooter className="pt-3 border-t border-border/60 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isUploadingResume ? 'Uploading Resume...' : 'Saving...'}
                </>
              ) : (
                'Save Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobModal;

