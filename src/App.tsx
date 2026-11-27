import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Compass,
  Download,
  Moon,
  Plus,
  Scale,
  Sun,
  Upload,
} from 'lucide-react';
import type { Application, ApplicationStatus } from './types/application';
import { STATUS_LABELS } from './types/application';
import type { JobListing } from './types/job';
import { useLocalStorage } from './hooks/useLocalStorage';
import { findInterviewConflicts, simulateBackdateDays } from './utils/ghosting';
import { computePipelineStats } from './utils/stats';
import { formatCompactDateTime, formatRupiah, getTodayYmd } from './utils/format';
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
import UndoToast from './components/UndoToast';

type ActiveTab = 'explore' | 'pipeline' | 'compare';
type ThemeMode = 'light' | 'dark';

interface PendingUndo {
  application: Application;
  index: number;
}

const DEFAULT_SKILLS = ['React', 'TypeScript', 'CSS'];
const UNDO_DURATION_SECONDS = 5;

const TAB_HEADER_COPY: Record<ActiveTab, { title: string; subtitle: string }> = {
  explore: {
    title: 'Halo, Kapten!',
    subtitle:
      'Jelajahi lowongan magang, pantau skor kecocokan skill secara langsung, dan simpan target ke pipeline.',
  },
  pipeline: {
    title: 'War Room Pipeline',
    subtitle:
      'Kelola tahap seleksi ketat, checklist persiapan, deteksi rawan ghosting, dan latihan interview berwaktu.',
  },
  compare: {
    title: 'Offer Comparator',
    subtitle:
      'Bandingkan dua tawaran magang secara objektif berdasarkan uang saku, mode kerja, dan kecocokan skill.',
  },
};

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
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    'theme',
    'light',
    (raw) => (raw === 'dark' ? 'dark' : 'light'),
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);

  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(UNDO_DURATION_SECONDS);

  const undoTimeoutRef = useRef<number | null>(null);
  const undoIntervalRef = useRef<number | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current !== null) {
        window.clearTimeout(undoTimeoutRef.current);
      }
      if (undoIntervalRef.current !== null) {
        window.clearInterval(undoIntervalRef.current);
      }
      if (noticeTimeoutRef.current !== null) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcut `/` untuk fokus search bar via useRef
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (isFormOpen || selectedAppId !== null) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen, selectedAppId]);

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

  function showNotice(message: string) {
    if (noticeTimeoutRef.current !== null) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    setNotice(message);
    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimeoutRef.current = null;
    }, 3500);
  }

  function clearUndoTimers() {
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    if (undoIntervalRef.current !== null) {
      window.clearInterval(undoIntervalRef.current);
      undoIntervalRef.current = null;
    }
  }

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
    showNotice(`"${job.company_name}" disimpan ke Wishlist.`);
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
                  message:
                    'Simulasi +15 hari dijalankan (lastUpdatedAt dimundurkan 15 hari)',
                },
                ...app.activityLogs,
              ],
            },
      ),
    );
    setNowMs(Date.now());
  }

  function handleDeleteApplication(id: string) {
    const targetIndex = applications.findIndex((app) => app.id === id);
    if (targetIndex === -1) return;

    const deletedApp = applications[targetIndex];
    setApplications((prev) => prev.filter((app) => app.id !== id));
    if (selectedAppId === id) {
      setSelectedAppId(null);
    }

    // Bersihkan timer lama memakai useRef saat hapus berturut-turut < 5 detik
    clearUndoTimers();
    setPendingUndo({ application: deletedApp, index: targetIndex });
    setUndoSecondsLeft(UNDO_DURATION_SECONDS);

    undoIntervalRef.current = window.setInterval(() => {
      setUndoSecondsLeft((prev) => Math.max(1, prev - 1));
    }, 1000);

    undoTimeoutRef.current = window.setTimeout(() => {
      clearUndoTimers();
      setPendingUndo(null);
    }, UNDO_DURATION_SECONDS * 1000);
  }

  function handleUndoDelete() {
    if (!pendingUndo) return;
    const { application, index } = pendingUndo;
    clearUndoTimers();
    setPendingUndo(null);

    setApplications((prev) => {
      if (prev.some((app) => app.id === application.id)) return prev;
      const clampedIndex = Math.min(index, prev.length);
      return [
        ...prev.slice(0, clampedIndex),
        application,
        ...prev.slice(clampedIndex),
      ];
    });
  }

  function handleExportBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      kaptenSkills,
      applications,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aku-mw-magang-backup-${getTodayYmd()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice('Backup JSON berhasil diekspor.');
  }

  async function handleImportBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Struktur JSON tidak dikenali.');
      }

      const data = parsed as Record<string, unknown>;
      if (!Array.isArray(data.applications)) {
        throw new Error('Field "applications" wajib berupa array.');
      }

      const importedApps = normalizeStoredApplications(data.applications);
      const importedSkills = Array.isArray(data.kaptenSkills)
        ? normalizeStoredSkills(data.kaptenSkills, kaptenSkills)
        : kaptenSkills;

      setApplications(importedApps);
      setKaptenSkills(importedSkills);
      setSelectedAppId(null);
      setNowMs(Date.now());
      showNotice(`Backup berhasil diimpor (${importedApps.length} lamaran).`);
    } catch (err) {
      showNotice(
        err instanceof Error
          ? `Gagal impor backup: ${err.message}`
          : 'Gagal membaca file backup JSON.',
      );
    }
  }

  const headerCopy = TAB_HEADER_COPY[activeTab];

  return (
    <div className="app-shell">
      <aside className="side-rail" aria-label="Navigasi aplikasi">
        <div className="rail-top">
          <div className="brand-link">
            <span className="brand-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M5 7h9.5L10 16l4.5 9H5l4.5-9L5 7z" fill="#FAF0E1" />
                <path d="M17.5 7H27v18h-9.5l4.5-9-4.5-9z" fill="#197A39" />
                <circle cx="24" cy="10" r="2.3" fill="#EAB308" />
              </svg>
            </span>
            <span className="brand-label-mobile">Aku Mw Magang</span>
          </div>

          <nav className="rail-nav" aria-label="Navigasi utama">
            <button
              type="button"
              className={`rail-btn ${activeTab === 'explore' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('explore')}
              aria-current={activeTab === 'explore' ? 'page' : undefined}
            >
              <Compass size={19} aria-hidden="true" />
              <span>Eksplorasi</span>
            </button>

            <button
              type="button"
              className={`rail-btn ${activeTab === 'pipeline' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
              aria-current={activeTab === 'pipeline' ? 'page' : undefined}
            >
              <Briefcase size={19} aria-hidden="true" />
              <span>Pipeline</span>
              <span className="rail-badge tabular-nums">{applications.length}</span>
            </button>

            <button
              type="button"
              className={`rail-btn ${activeTab === 'compare' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('compare')}
              aria-current={activeTab === 'compare' ? 'page' : undefined}
            >
              <Scale size={19} aria-hidden="true" />
              <span>Offer</span>
              <span className="rail-badge tabular-nums">{stats.offerCount}</span>
            </button>
          </nav>
        </div>

        <div className="rail-bottom">
          <button
            type="button"
            className="circle-icon-btn"
            onClick={handleExportBackup}
            title="Ekspor backup data (JSON)"
            aria-label="Ekspor backup JSON"
          >
            <Download size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="circle-icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Impor backup data (JSON)"
            aria-label="Impor backup JSON"
          >
            <Upload size={16} aria-hidden="true" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              void handleImportBackup(e);
            }}
            aria-label="Pilih file backup JSON"
          />

          <button
            type="button"
            className="circle-icon-btn"
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
            aria-label={
              theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'
            }
          >
            {theme === 'light' ? (
              <Moon size={16} aria-hidden="true" />
            ) : (
              <Sun size={16} aria-hidden="true" />
            )}
          </button>

          <span className="avatar-pill" title="Profil Kapten">
            KP
          </span>
        </div>
      </aside>

      <div className="workspace-canvas">
        <main className="app-main">
          <header className="workspace-header">
            <div>
              <h1 className="workspace-title">{headerCopy.title}</h1>
              <p className="workspace-subtitle">{headerCopy.subtitle}</p>
            </div>

            <div className="workspace-header-actions">
              <span className="live-dot-pill tabular-nums">
                <span
                  className={`dot-anchor ${conflicts.length > 0 ? 'is-red' : stats.offerCount > 0 ? '' : 'is-gold'}`}
                  aria-hidden="true"
                />
                {kaptenSkills.length} skill · {stats.activeCount} aktif
              </span>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                Catat Lamaran
              </button>
            </div>
          </header>

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
              searchInputRef={searchInputRef}
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
              searchInputRef={searchInputRef}
            />
          )}

          {activeTab === 'compare' && (
            <OfferComparator
              applications={applications}
              kaptenSkills={kaptenSkills}
              onGoToPipeline={() => setActiveTab('pipeline')}
            />
          )}
        </main>
      </div>

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

      {pendingUndo && (
        <UndoToast
          company={pendingUndo.application.company}
          role={pendingUndo.application.role}
          secondsLeft={undoSecondsLeft}
          onUndo={handleUndoDelete}
        />
      )}

      {notice && (
        <div className="status-toast" role="status" aria-live="polite">
          {notice}
        </div>
      )}
    </div>
  );
}
