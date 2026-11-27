import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Compass, Plus, Scale } from 'lucide-react';
import type { Application } from './types/application';
import type { JobListing } from './types/job';
import { useLocalStorage } from './hooks/useLocalStorage';
import { findInterviewConflicts, simulateBackdateDays } from './utils/ghosting';
import { computePipelineStats } from './utils/stats';
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
import OfferComparator from './components/OfferComparator';
import ApplicationForm from './components/ApplicationForm';

type ActiveTab = 'explore' | 'pipeline' | 'compare';

const DEFAULT_SKILLS = ['React', 'TypeScript', 'CSS'];

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
    </div>
  );
}
