import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Target,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import PageLoader from '@/components/common/PageLoader';
import RefreshButton from '@/components/common/RefreshButton';
import JobStats from './jobs/JobStats';
import JobCard from './jobs/JobCard';
import JobTable from './jobs/JobTable';
import GoalCardModal from './jobs/GoalCardModal';
import CreateJobModal from './jobs/CreateJobModal';
import EditJobModal from './jobs/EditJobModal';
import JobDetailModal from './jobs/JobDetailModal';
import {
  JobApplication,
  JobStatus,
  NewJobApplication,
  STATUS_CONFIG,
} from './jobs/types';
import {
  fetchJobApplications,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  calculateJobStats,
  calculateCountryStats,
} from '@/integrations/supabase/jobClient';
import { useToast } from '@/hooks/use-toast';

const JobTrackerApp: React.FC = () => {
  const { toast } = useToast();

  // Data State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [countryFilter, setCountryFilter] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Modals State
  const [isGoalCardOpen, setIsGoalCardOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [viewingJob, setViewingJob] = useState<JobApplication | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJobApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
      toast({
        variant: 'destructive',
        title: 'Loading error',
        description: 'Failed to load job applications.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute overall stats & country stats
  const overallStats = useMemo(() => calculateJobStats(applications), [applications]);
  const countryStats = useMemo(() => calculateCountryStats(applications), [applications]);

  // Unique list of countries for dropdown filter
  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((app) => {
      if (app.country?.trim()) set.add(app.country.trim());
    });
    return Array.from(set).sort();
  }, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCompany = app.company_name.toLowerCase().includes(q);
        const matchesRole = app.role_name.toLowerCase().includes(q);
        const matchesCity = app.city?.toLowerCase().includes(q);
        const matchesCountry = app.country?.toLowerCase().includes(q);
        const matchesNotes = app.follow_up_notes?.toLowerCase().includes(q);
        const matchesRecruiter = app.recruiter_email?.toLowerCase().includes(q);

        if (
          !matchesCompany &&
          !matchesRole &&
          !matchesCity &&
          !matchesCountry &&
          !matchesNotes &&
          !matchesRecruiter
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // Country filter
      if (countryFilter !== 'all') {
        const country = (app.country || 'Unspecified').trim().toLowerCase();
        if (country !== countryFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [applications, searchQuery, statusFilter, countryFilter]);

  // CRUD Handlers
  const handleCreate = async (newJob: NewJobApplication) => {
    const created = await createJobApplication(newJob);
    setApplications((prev) => [created, ...prev]);
  };

  const handleUpdate = async (id: string, updates: Partial<JobApplication>) => {
    const updated = await updateJobApplication(id, updates);
    setApplications((prev) => prev.map((app) => (app.id === id ? updated : app)));
    if (viewingJob && viewingJob.id === id) {
      setViewingJob(updated);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteJobApplication(id);
    setApplications((prev) => prev.filter((app) => app.id !== id));
    toast({
      title: 'Application removed',
      description: 'The job application was deleted.',
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCountryFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'all' || countryFilter !== 'all';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-5">
        {/* ======================================================== */}
        {/* Header Bar with Goal Card Button & Add Application       */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Job Tracker
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track your sent applications, customized resumes & global interview stages.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
            <RefreshButton onRefresh={loadData} isLoading={isLoading} />

            {/* Goal Card Button (Highlighted) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGoalCardOpen(true)}
              className="gap-2 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-amber-500/40 text-amber-300 hover:text-amber-200 hover:border-amber-400 hover:bg-amber-500/20 font-semibold shadow-sm"
            >
              <Target className="w-4 h-4 text-amber-400" />
              <span>Goal Card</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </Button>

            {/* Add Application Button */}
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 shadow-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Application</span>
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Statistics & Country Breakdown Overview                  */}
        {/* ======================================================== */}
        <JobStats
          stats={overallStats}
          countryStats={countryStats}
          selectedStatus={statusFilter}
          onSelectStatus={(status) => setStatusFilter(status)}
          selectedCountry={countryFilter}
          onSelectCountry={(country) => setCountryFilter(country)}
        />

        {/* ======================================================== */}
        {/* Search, Filter & View Mode Controls                      */}
        {/* ======================================================== */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-card/60 border border-border/70">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, role, country, city, recruiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm bg-background/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters: Status & Country */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Dropdown */}
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as JobStatus | 'all')}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.keys(STATUS_CONFIG) as JobStatus[]).map((st) => (
                  <SelectItem key={st} value={st}>
                    {STATUS_CONFIG[st].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Country Dropdown */}
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Reset filters"
              >
                Reset
              </Button>
            )}

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 ml-auto">
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('cards')}
                title="Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Summary Banner */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <span>
              Showing {filteredApplications.length} of {applications.length} applications
            </span>
            {statusFilter !== 'all' && (
              <span className="bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
                Status: {STATUS_CONFIG[statusFilter].label}
              </span>
            )}
            {countryFilter !== 'all' && (
              <span className="bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
                Country: {countryFilter}
              </span>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* Applications List / Table Content Area                   */}
        {/* ======================================================== */}
        {isLoading ? (
          <PageLoader fullScreen={false} message="Loading applications..." />
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/80 bg-card/30 space-y-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-foreground">
                {hasActiveFilters
                  ? 'No applications match your filters'
                  : 'No job applications recorded yet'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your search keywords or clearing active filters.'
                  : 'Start logging the roles you apply to along with your tailored resume and recruiter contacts.'}
              </p>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-xs">
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Your First Application
              </Button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="space-y-2.5">
            {filteredApplications.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onViewDetails={(j) => setViewingJob(j)}
                onEdit={(j) => setEditingJob(j)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <JobTable
            jobs={filteredApplications}
            onViewDetails={(j) => setViewingJob(j)}
            onEdit={(j) => setEditingJob(j)}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* ======================================================== */}
      {/* Modals & Dialogs                                         */}
      {/* ======================================================== */}
      <GoalCardModal isOpen={isGoalCardOpen} onClose={() => setIsGoalCardOpen(false)} />

      <CreateJobModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreate}
      />

      <EditJobModal
        job={editingJob}
        isOpen={Boolean(editingJob)}
        onClose={() => setEditingJob(null)}
        onSuccess={handleUpdate}
      />

      <JobDetailModal
        job={viewingJob}
        isOpen={Boolean(viewingJob)}
        onClose={() => setViewingJob(null)}
        onEdit={(j) => {
          setViewingJob(null);
          setEditingJob(j);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default JobTrackerApp;

