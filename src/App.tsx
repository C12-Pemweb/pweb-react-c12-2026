import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Compass, Plus, Scale } from 'lucide-react';
import type { Application, ApplicationStatus } from './types/application';
import { STATUS_LABELS } from './types/application';
import type { JobListing } from './types/job';
import { useLocalStorage } from './hooks/useLocalStorage';
import { findInterviewConflicts, simulateBackdateDays } from './utils/ghosting';
import { computePipelineStats } from './utils/stats';
import { formatCompactDateTime, formatRupiah } from './utils/format';
import {
  inferWorkMode,
  isDuplicateApplication,
  normalizeStoredApplications,
  normalizeStoredSkills,
} from './utils/validation';
import ConflictBanner from './components/ConflictBanner';
import StatsDashboard from './components/StatsDashboard';
import JobExplorer from './components/jobs/JobExplorer';
import WarRoom from './components/WarRoom';
import ApplicationDetail from './components/ApplicationDetail';
import OfferComparator from './components/OfferComparator';
import ApplicationForm from './components/ApplicationForm';

type ActiveTab = 'explore' | 'pipeline' | 'compare';

const DEFAULT_SKILLS = ['React', 'TypeScript', 'CSS'];

function describeTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
  patch: Partial<Application>,
): string {
  if (to === 'APPLIED') {
    return `Status ${STATUS_LABELS[from]} -> Applied (CV: ${patch.cvVersion ?? '-'}, tanggal ${patch.appliedDate ?? '-'})`;
  }
  if (to === 'INTERVIEW') {
    return `Status ${STATUS_LABELS[from]} -> Interview (jadwal ${formatCompactDateTime(patch.interviewDateTime ?? '')})`;
  }
  if (to === 'OFFER') {
    return `Status ${STATUS_LABELS[from]} -> Offer (${formatRupiah(patch.salaryOffer ?? 0)}, ${patch.workMode ?? '-'})`;
  }
  return `Status ${STATUS_LABELS[from]} -> ${STATUS_LABELS[to]}`;
}

export default function App() {
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    'kaptenSkills',
    DEFAULT_SKILLS,
    (raw) => normalizeStoredSkills(raw, DEFAULT_SKILLS),
  );
  const [applications, setApplications] = useLocalStorage<Application[]>(
    'applications',
    [],
    normalizeStoredApplications,
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const conflicts = useMemo(
    () => findInterviewConflicts(applications),
    [applications],
  );
  const stats = useMemo(
    () => computePipelineStats(applications, nowMs),
    [applications, nowMs],
  );
  const selectedApplication = useMemo(
    () => applications.find((app) => app.id === selectedAppId) ?? null,
    [applications, selectedAppId],
  );

  function handleAddApplication(newApp: Application) {
    setApplications((prev) => [newApp, ...prev]);
    setNowMs(Date.now());
  }

  function handleSaveToWishlist(job: JobListing) {
    if (isDuplicateApplication(applications, job.company_name, job.title)) {
      return;
    }

    const now = new Date().toISOString();
    const nextApp: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: inferWorkMode(job.candidate_required_location),
      status: 'WISHLIST',
      requiredSkills: job.tags,
      createdAt: now,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: 'Disimpan ke Wishlist dari Eksplorasi Lowongan',
        },
      ],
    };

    handleAddApplication(nextApp);
  }

  function handleTransitionStatus(
    id: string,
    nextStatus: ApplicationStatus,
    patch: Partial<Application>,
  ) {
    const now = new Date().toISOString();
    setApplications((prev) =>
      prev.map((app) =>
        app.id !== id
          ? app
          : {
              ...app,
              ...patch,
              status: nextStatus,
              lastUpdatedAt: now,
              activityLogs: [
                {
                  id: crypto.randomUUID(),
                  timestamp: now,
                  message: describeTransition(app.status, nextStatus, patch),
                },
                ...app.activityLogs,
              ],
            },
      ),
    );
    setNowMs(Date.now());
  }

  function handleAddChecklistItem(id: string, text: string) {
    setApplications((prev) =>
      prev.map((app) =>
        app.id !== id
          ? app
          : {
              ...app,
              checklist: [
                ...app.checklist,
                { id: crypto.randomUUID(), text, done: false },
              ],
            },
      ),
    );
  }

  function handleToggleChecklistItem(id: string, itemId: string) {
    setApplications((prev) =>
      prev.map((app) =>
        app.id !== id
          ? app
          : {
              ...app,
              checklist: app.checklist.map((item) =>
                item.id !== itemId ? item : { ...item, done: !item.done },
              ),
            },
      ),
    );
  }

  function handleRemoveChecklistItem(id: string, itemId: string) {
    setApplications((prev) =>
      prev.map((app) =>
        app.id !== id
          ? app
          : {
              ...app,
              checklist: app.checklist.filter((item) => item.id !== itemId),
            },
      ),
    );
  }

  function handleAddManualLog(id: string, message: string) {
    const now = new Date().toISOString();
    setApplications((prev) =>
      prev.map((app) =>
        app.id !== id
          ? app
          : {
              ...app,
              activityLogs: [
                {
                  id: crypto.randomUUID(),
                  timestamp: now,
                  message: `Catatan: ${message}`,
                },
                ...app.activityLogs,
              ],
            },
      ),
    );
  }

  function handleSimulateGhosting(id: string) {
    const logTime = new Date().toISOString();
    setApplications((prev) =>
      prev.map((app) =>
        app.id !== id
          ? app
          : {
              ...app,
              lastUpdatedAt: simulateBackdateDays(app.lastUpdatedAt, 15),
              activityLogs: [
                {
                  id: crypto.randomUUID(),
                  timestamp: logTime,
                  message: 'Simulasi +15 hari dijalankan (lastUpdatedAt dimundurkan 15 hari)',
                },
                ...app.activityLogs,
              ],
            },
      ),
    );
    setNowMs(Date.now());
  }

  function handleDeleteApplication(id: string) {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    if (selectedAppId === id) {
      setSelectedAppId(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">AM</span>
            <span>Aku Mw Magang</span>
          </div>

          <nav className="nav-tabs" aria-label="Navigasi utama">
            <button
              type="button"
              className={`nav-tab ${activeTab === 'explore' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('explore')}
            >
              <Compass size={15} aria-hidden="true" />
              <span>Eksplorasi Lowongan</span>
            </button>

            <button
              type="button"
              className={`nav-tab ${activeTab === 'pipeline' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <Briefcase size={15} aria-hidden="true" />
              <span>Pipeline Lamaran</span>
              <span className="nav-count tabular-nums">{applications.length}</span>
            </button>

            <button
              type="button"
              className={`nav-tab ${activeTab === 'compare' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('compare')}
            >
              <Scale size={15} aria-hidden="true" />
              <span>Bandingkan Offer</span>
              <span className="nav-count tabular-nums">{stats.offerCount}</span>
            </button>
          </nav>

          <div className="nav-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus size={15} aria-hidden="true" />
              Catat Lamaran
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <ConflictBanner
          conflicts={conflicts}
          onInspectPipeline={
            activeTab !== 'pipeline' ? () => setActiveTab('pipeline') : undefined
          }
        />

        <StatsDashboard stats={stats} />

        {activeTab === 'explore' && (
          <JobExplorer
            kaptenSkills={kaptenSkills}
            onSkillsChange={setKaptenSkills}
            applications={applications}
            onSaveToWishlist={handleSaveToWishlist}
          />
        )}

        {activeTab === 'pipeline' && (
          <WarRoom
            applications={applications}
            kaptenSkills={kaptenSkills}
            nowMs={nowMs}
            onSelectApplication={setSelectedAppId}
            onSimulateGhosting={handleSimulateGhosting}
            onDeleteApplication={handleDeleteApplication}
            onOpenManualForm={() => setIsFormOpen(true)}
            onGoToExplorer={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'compare' && (
          <OfferComparator
            applications={applications}
            ownedSkills={kaptenSkills}
          />
        )}
      </main>

      {isFormOpen && (
        <ApplicationForm
          applications={applications}
          onAdd={handleAddApplication}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {selectedApplication && (
        <ApplicationDetail
          key={selectedApplication.id}
          application={selectedApplication}
          nowMs={nowMs}
          onTransitionStatus={handleTransitionStatus}
          onAddChecklistItem={handleAddChecklistItem}
          onToggleChecklistItem={handleToggleChecklistItem}
          onRemoveChecklistItem={handleRemoveChecklistItem}
          onAddManualLog={handleAddManualLog}
          onSimulateGhosting={handleSimulateGhosting}
          onDelete={handleDeleteApplication}
          onClose={() => setSelectedAppId(null)}
        />
      )}
    </div>
  );
}
