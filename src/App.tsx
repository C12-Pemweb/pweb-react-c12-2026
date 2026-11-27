import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react';
import type { Application, ApplicationStatus } from './types/application';
import { STATUS_LABELS } from './types/application';
import type { CvDocument } from './types/cv';
import type { JobListing } from './types/job';
import { useLocalStorage } from './hooks/useLocalStorage';
import { findInterviewConflicts, simulateBackdateDays } from './utils/ghosting';
import { computePipelineStats } from './utils/stats';
import { formatCompactDateTime, formatRupiah, getTodayYmd } from './utils/format';
import { createCvFromFile, normalizeStoredCvs } from './utils/cvStorage';
import {
  CHECKLIST_TEMPLATES,
  createDemoDataset,
  DEFAULT_KAPTEN_SKILLS,
} from './utils/demoSeed';
import {
  inferWorkMode,
  isDuplicateApplication,
  normalizeStoredApplications,
  normalizeStoredSkills,
} from './utils/validation';
import LandingPage from './components/LandingPage';
import type { AppView } from './components/LandingPage';
import ConflictBanner from './components/ConflictBanner';
import StatsDashboard from './components/StatsDashboard';
import JobExplorer from './components/jobs/JobExplorer';
import WarRoom from './components/WarRoom';
import ApplicationDetail from './components/ApplicationDetail';
import OfferComparator from './components/OfferComparator';
import CvVault from './components/CvVault';
import ApplicationForm from './components/ApplicationForm';
import ResetDbModal from './components/ResetDbModal';
import UndoToast from './components/UndoToast';

type ThemeMode = 'light' | 'dark';

interface PendingUndo {
  application: Application;
  index: number;
}

const UNDO_DURATION_SECONDS = 5;

const WORKSPACE_COPY: Record<
  Exclude<AppView, 'landing'>,
  { title: string; subtitle: string }
> = {
  explore: {
    title: 'Eksplorasi Lowongan',
    subtitle:
      'Filter kategori, ukur kecocokan skill secara real-time, lalu simpan atau batalkan langsung dari kartu lowongan.',
  },
  pipeline: {
    title: 'War Room Pipeline',
    subtitle:
      'Lacak progres lamaran dengan state machine ketat, agenda interview, deteksi ghosting, dan latihan wawancara berwaktu.',
  },
  compare: {
    title: 'Offer Comparator',
    subtitle:
      'Bandingkan dua tawaran magang secara objektif dengan bobot 50% uang saku, 25% mode kerja, dan 25% kecocokan skill.',
  },
  cv: {
    title: 'CV Vault',
    subtitle:
      'Simpan beberapa versi CV dan pilih dokumen spesifik saat melamar atau memindahkan status ke Applied.',
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
    DEFAULT_KAPTEN_SKILLS,
    (raw) => normalizeStoredSkills(raw, DEFAULT_KAPTEN_SKILLS),
  );
  const [applications, setApplications] = useLocalStorage<Application[]>(
    'applications',
    [],
    normalizeStoredApplications,
  );
  const [cvDocuments, setCvDocuments] = useLocalStorage<CvDocument[]>(
    'kaptenCvs',
    [],
    normalizeStoredCvs,
  );
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    'theme',
    'light',
    (raw) => (raw === 'dark' ? 'dark' : 'light'),
  );

  const [activeView, setActiveView] = useState<AppView>('landing');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingFocusSearch, setPendingFocusSearch] = useState(false);

  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(UNDO_DURATION_SECONDS);

  const undoTimeoutRef = useRef<number | null>(null);
  const undoIntervalRef = useRef<number | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const importBackupRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pendingFocusSearch) return;
    if (activeView === 'explore' || activeView === 'pipeline') {
      const id = window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        setPendingFocusSearch(false);
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [pendingFocusSearch, activeView]);

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
      if (isFormOpen || isResetOpen || selectedAppId !== null) return;

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

      event.preventDefault();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      } else {
        setActiveView('explore');
        setPendingFocusSearch(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen, isResetOpen, selectedAppId]);

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

  function handleSearchTrigger() {
    if (activeView === 'explore' || activeView === 'pipeline') {
      searchInputRef.current?.focus();
    } else {
      setActiveView('explore');
      setPendingFocusSearch(true);
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

  function handleApplyChecklistTemplate(id: string) {
    setApplications((prev) =>
      prev.map((app) =>
        app.id !== id
          ? app
          : {
              ...app,
              checklist: [
                ...app.checklist,
                ...CHECKLIST_TEMPLATES.map((text) => ({
                  id: crypto.randomUUID(),
                  text,
                  done: false,
                })),
              ],
            },
      ),
    );
    showNotice('Template 4 tugas persiapan ditambahkan.');
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

  async function handleUploadCvFiles(files: FileList): Promise<CvDocument[]> {
    const existingNames = new Set(cvDocuments.map((c) => c.name.toLowerCase()));
    const created: CvDocument[] = [];
    let skipped = 0;

    for (const file of Array.from(files)) {
      const normalized = file.name.trim().toLowerCase();
      if (existingNames.has(normalized)) {
        skipped++;
        continue;
      }
      const isFirst = cvDocuments.length === 0 && created.length === 0;
      const doc = await createCvFromFile(file, isFirst);
      existingNames.add(normalized);
      created.push(doc);
    }

    if (created.length > 0) {
      setCvDocuments((prev) => [...created, ...prev]);
      showNotice(
        skipped > 0
          ? `${created.length} CV diunggah (${skipped} duplikat dilewati).`
          : `${created.length} CV berhasil disimpan ke CV Vault.`,
      );
    } else if (skipped > 0) {
      showNotice('File CV dengan nama yang sama sudah ada di CV Vault.');
    }

    return created;
  }

  function handleSetDefaultCv(id: string) {
    setCvDocuments((prev) =>
      prev.map((doc) => ({ ...doc, isDefault: doc.id === id })),
    );
  }

  function handleUpdateCvLabel(id: string, label: string) {
    setCvDocuments((prev) =>
      prev.map((doc) => (doc.id !== id ? doc : { ...doc, label })),
    );
  }

  function handleDeleteCv(id: string) {
    setCvDocuments((prev) => {
      const remaining = prev.filter((doc) => doc.id !== id);
      if (remaining.length > 0 && !remaining.some((doc) => doc.isDefault)) {
        return remaining.map((doc, idx) =>
          idx === 0 ? { ...doc, isDefault: true } : doc,
        );
      }
      return remaining;
    });
    showNotice('Dokumen CV dihapus dari CV Vault.');
  }

  function handleLoadDemo() {
    const now = Date.now();
    const demo = createDemoDataset(now);
    clearUndoTimers();
    setPendingUndo(null);
    setSelectedAppId(null);
    setKaptenSkills(demo.skills);
    setCvDocuments(demo.cvs);
    setApplications(demo.applications);
    setNowMs(now);
    setActiveView('pipeline');
    showNotice('Data demo (5 lamaran & 2 CV) dimuat.');
  }

  function handleConfirmResetDb() {
    clearUndoTimers();
    setPendingUndo(null);
    setSelectedAppId(null);
    setIsResetOpen(false);
    setIsFormOpen(false);

    try {
      window.localStorage.removeItem('applications');
      window.localStorage.removeItem('kaptenSkills');
      window.localStorage.removeItem('kaptenCvs');
      window.localStorage.removeItem('theme');
    } catch {
      // Ignore storage access errors
    }

    setApplications([]);
    setKaptenSkills(DEFAULT_KAPTEN_SKILLS);
    setCvDocuments([]);
    setTheme('light');
    setNowMs(Date.now());
    showNotice('Database lokal direset ke state awal.');
  }

  function handleExportBackup() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      kaptenSkills,
      cvDocuments,
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
      const importedCvs = Array.isArray(data.cvDocuments)
        ? normalizeStoredCvs(data.cvDocuments)
        : cvDocuments;

      setApplications(importedApps);
      setKaptenSkills(importedSkills);
      setCvDocuments(importedCvs);
      setSelectedAppId(null);
      setNowMs(Date.now());
      showNotice(`Backup diimpor (${importedApps.length} lamaran, ${importedCvs.length} CV).`);
    } catch (err) {
      showNotice(
        err instanceof Error
          ? `Gagal impor backup: ${err.message}`
          : 'Gagal membaca file backup JSON.',
      );
    }
  }

  const navItems: { id: AppView; label: string; count?: number }[] = [
    { id: 'landing', label: 'Beranda' },
    { id: 'explore', label: 'Eksplorasi' },
    { id: 'pipeline', label: 'Pipeline', count: applications.length },
    { id: 'compare', label: 'Offer', count: stats.offerCount },
    { id: 'cv', label: 'CV Vault', count: cvDocuments.length },
  ];

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-inner">
          <button
            type="button"
            className="brand-btn"
            onClick={() => setActiveView('landing')}
            aria-label="Kembali ke Beranda Aku Mw Magang"
          >
            <svg width="28" height="24" viewBox="0 0 36 28" fill="none" aria-hidden="true">
              <path d="M2 2h12L8.5 14 14 26H2l5.5-12L2 2z" fill="currentColor" />
              <path d="M18 2h16v24H18l6-12-6-12z" fill="var(--accent)" />
            </svg>
            <span className="brand-wordmark">Aku Mw Magang</span>
          </button>

          <nav className="top-nav-links" aria-label="Navigasi utama">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`top-nav-link ${activeView === item.id ? 'is-active' : ''}`}
                onClick={() => setActiveView(item.id)}
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                <span>{item.label}</span>
                {typeof item.count === 'number' && (
                  <span className="nav-sup tabular-nums">{item.count}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="top-bar-actions">
            <button
              type="button"
              className="circle-btn"
              onClick={handleSearchTrigger}
              title="Cari lowongan atau lamaran (/)"
              aria-label="Fokus pencarian"
            >
              <Search size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="circle-btn"
              onClick={handleExportBackup}
              title="Ekspor backup JSON"
              aria-label="Ekspor backup JSON"
            >
              <Download size={15} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="circle-btn"
              onClick={() => importBackupRef.current?.click()}
              title="Impor backup JSON"
              aria-label="Impor backup JSON"
            >
              <Upload size={15} aria-hidden="true" />
            </button>

            <input
              ref={importBackupRef}
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
              className="circle-btn is-danger"
              onClick={() => setIsResetOpen(true)}
              title="Reset Database Lokal ke state awal"
              aria-label="Reset Database Lokal"
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="circle-btn"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              title={theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
              aria-label={
                theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'
              }
            >
              {theme === 'light' ? (
                <Moon size={15} aria-hidden="true" />
              ) : (
                <Sun size={15} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              className="avatar-btn"
              onClick={() => setActiveView('cv')}
              title="Profil & CV Vault Kapten"
              aria-label="Buka CV Vault Kapten"
            >
              <img src="/images/kapten-avatar.jpg" alt="Profil Kapten" />
            </button>
          </div>
        </div>
      </header>

      {activeView === 'landing' ? (
        <LandingPage
          stats={stats}
          skillsCount={kaptenSkills.length}
          cvCount={cvDocuments.length}
          onNavigate={setActiveView}
          onOpenManualForm={() => setIsFormOpen(true)}
          onLoadDemo={handleLoadDemo}
        />
      ) : (
        <main className="app-main">
          <header className="workspace-header">
            <div>
              <h1 className="workspace-title">{WORKSPACE_COPY[activeView].title}</h1>
              <p className="workspace-subtitle">
                {WORKSPACE_COPY[activeView].subtitle}
              </p>
            </div>

            <div className="workspace-actions">
              {applications.length === 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ height: 40 }}
                  onClick={handleLoadDemo}
                >
                  <Sparkles size={14} aria-hidden="true" />
                  Muat Data Demo
                </button>
              )}

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
              activeView !== 'pipeline' ? () => setActiveView('pipeline') : undefined
            }
          />

          <StatsDashboard stats={stats} />

          {activeView === 'explore' && (
            <JobExplorer
              kaptenSkills={kaptenSkills}
              onSkillsChange={setKaptenSkills}
              applications={applications}
              onSaveToWishlist={handleSaveToWishlist}
              onCancelApplication={handleDeleteApplication}
              searchInputRef={searchInputRef}
            />
          )}

          {activeView === 'pipeline' && (
            <WarRoom
              applications={applications}
              kaptenSkills={kaptenSkills}
              nowMs={nowMs}
              onSelectApplication={setSelectedAppId}
              onSimulateGhosting={handleSimulateGhosting}
              onDeleteApplication={handleDeleteApplication}
              onOpenManualForm={() => setIsFormOpen(true)}
              onGoToExplorer={() => setActiveView('explore')}
              searchInputRef={searchInputRef}
            />
          )}

          {activeView === 'compare' && (
            <OfferComparator
              applications={applications}
              kaptenSkills={kaptenSkills}
              onGoToPipeline={() => setActiveView('pipeline')}
            />
          )}

          {activeView === 'cv' && (
            <CvVault
              cvDocuments={cvDocuments}
              applications={applications}
              onUploadFiles={async (files) => {
                await handleUploadCvFiles(files);
              }}
              onSetDefault={handleSetDefaultCv}
              onUpdateLabel={handleUpdateCvLabel}
              onDeleteCv={handleDeleteCv}
            />
          )}
        </main>
      )}

      {isFormOpen && (
        <ApplicationForm
          applications={applications}
          cvDocuments={cvDocuments}
          onUploadCvFiles={handleUploadCvFiles}
          onAdd={handleAddApplication}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {selectedApplication && (
        <ApplicationDetail
          key={selectedApplication.id}
          application={selectedApplication}
          nowMs={nowMs}
          cvDocuments={cvDocuments}
          onUploadCvFiles={handleUploadCvFiles}
          onTransitionStatus={handleTransitionStatus}
          onAddChecklistItem={handleAddChecklistItem}
          onApplyChecklistTemplate={handleApplyChecklistTemplate}
          onToggleChecklistItem={handleToggleChecklistItem}
          onRemoveChecklistItem={handleRemoveChecklistItem}
          onAddManualLog={handleAddManualLog}
          onSimulateGhosting={handleSimulateGhosting}
          onDelete={handleDeleteApplication}
          onClose={() => setSelectedAppId(null)}
        />
      )}

      {isResetOpen && (
        <ResetDbModal
          applicationsCount={applications.length}
          cvCount={cvDocuments.length}
          skillsCount={kaptenSkills.length}
          onConfirmReset={handleConfirmResetDb}
          onClose={() => setIsResetOpen(false)}
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
