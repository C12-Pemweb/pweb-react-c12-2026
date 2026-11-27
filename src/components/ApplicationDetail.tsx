import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Clock,
  Download,
  ListChecks,
  Lock,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  Application,
  ApplicationStatus,
  WorkMode,
} from '../types/application';
import {
  PIPELINE_STEPS,
  STATUS_LABELS,
  WORK_MODES,
} from '../types/application';
import type { CvDocument } from '../types/cv';
import {
  getValidTargets,
  isFinalStatus,
  validateTransition,
} from '../utils/stateMachine';
import { isGhostingRisk } from '../utils/ghosting';
import {
  formatCompactDateTime,
  formatDateTime,
  formatRupiah,
  getCompanyInitials,
  getTodayYmd,
} from '../utils/format';
import InterviewPrepTimer from './InterviewPrepTimer';

interface ApplicationDetailProps {
  application: Application;
  nowMs: number;
  cvDocuments?: CvDocument[];
  onUploadCvFiles?: (files: FileList) => Promise<CvDocument[]>;
  onTransitionStatus: (
    id: string,
    nextStatus: ApplicationStatus,
    patch: Partial<Application>,
  ) => void;
  onAddChecklistItem: (id: string, text: string) => void;
  onApplyChecklistTemplate?: (id: string) => void;
  onToggleChecklistItem: (id: string, itemId: string) => void;
  onRemoveChecklistItem: (id: string, itemId: string) => void;
  onAddManualLog: (id: string, message: string) => void;
  onSimulateGhosting: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function ApplicationDetail({
  application,
  nowMs,
  cvDocuments = [],
  onUploadCvFiles,
  onTransitionStatus,
  onAddChecklistItem,
  onApplyChecklistTemplate,
  onToggleChecklistItem,
  onRemoveChecklistItem,
  onAddManualLog,
  onSimulateGhosting,
  onDelete,
  onClose,
}: ApplicationDetailProps) {
  const validTargets = getValidTargets(application.status);
  const defaultCvName =
    cvDocuments.find((c) => c.isDefault)?.name ?? cvDocuments[0]?.name ?? '';

  const [selectedTarget, setSelectedTarget] = useState<ApplicationStatus | null>(
    validTargets[0] ?? null,
  );
  const [cvVersion, setCvVersion] = useState(
    application.cvVersion ?? defaultCvName,
  );
  const [appliedDate, setAppliedDate] = useState(
    application.appliedDate ?? getTodayYmd(),
  );
  const [interviewDateTime, setInterviewDateTime] = useState(
    application.interviewDateTime ?? '',
  );
  const [salaryInput, setSalaryInput] = useState(
    application.salaryOffer ? String(application.salaryOffer) : '',
  );
  const [offerWorkMode, setOfferWorkMode] = useState<WorkMode>(application.workMode);
  const [transitionError, setTransitionError] = useState('');

  const [newTaskText, setNewTaskText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const inlineCvUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const activeTarget =
    selectedTarget && validTargets.includes(selectedTarget)
      ? selectedTarget
      : (validTargets[0] ?? null);

  function handleSelectTarget(target: ApplicationStatus) {
    setSelectedTarget(target);
    setTransitionError('');
  }

  async function handleInlineCvUpload(files: FileList | null) {
    if (!files || files.length === 0 || !onUploadCvFiles) return;
    const added = await onUploadCvFiles(files);
    if (added.length > 0) {
      setCvVersion(added[0].name);
      if (transitionError) setTransitionError('');
    }
  }

  function handleConfirmTransition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTarget) return;

    const patch: Partial<Application> = {};
    if (activeTarget === 'APPLIED') {
      patch.cvVersion = cvVersion.trim();
      patch.appliedDate = appliedDate.trim();
    } else if (activeTarget === 'INTERVIEW') {
      patch.interviewDateTime = interviewDateTime.trim();
    } else if (activeTarget === 'OFFER') {
      patch.salaryOffer = Number(salaryInput);
      patch.workMode = offerWorkMode;
    }

    const validationError = validateTransition(application, activeTarget, patch);
    if (validationError) {
      setTransitionError(validationError);
      return;
    }

    onTransitionStatus(application.id, activeTarget, patch);
    setTransitionError('');
    const nextValid = getValidTargets(activeTarget);
    setSelectedTarget(nextValid[0] ?? null);
  }

  function handleAddChecklist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    onAddChecklistItem(application.id, trimmed);
    setNewTaskText('');
  }

  function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newNoteText.trim();
    if (!trimmed) return;
    onAddManualLog(application.id, trimmed);
    setNewNoteText('');
  }

  const ghostRisk = isGhostingRisk(application, nowMs);
  const canSimulateGhost =
    application.status === 'APPLIED' || application.status === 'SCREENING';
  const doneCount = application.checklist.filter((c) => c.done).length;
  const totalChecklist = application.checklist.length;
  const checklistPct =
    totalChecklist === 0 ? 0 : Math.round((doneCount / totalChecklist) * 100);
  const currentStepIndex = PIPELINE_STEPS.indexOf(application.status);

  const attachedCvDoc = application.cvVersion
    ? cvDocuments.find(
        (c) => c.name.toLowerCase() === application.cvVersion!.toLowerCase(),
      )
    : undefined;

  const matchingVaultCv = cvDocuments.some((c) => c.name === cvVersion)
    ? cvVersion
    : '';

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog-panel is-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        <div className="dialog-header">
          <div className="company-row">
            <div className="company-monogram" aria-hidden="true">
              {getCompanyInitials(application.company)}
            </div>
            <div className="company-info">
              <h2 id="detail-modal-title" className="panel-heading">
                {application.role} — {application.company}
              </h2>
              <p className="panel-desc">
                {application.workMode}
                {application.cvVersion ? ` · CV: ${application.cvVersion}` : ''}
                {application.interviewDateTime
                  ? ` · Interview: ${formatCompactDateTime(application.interviewDateTime)}`
                  : ''}
                {typeof application.salaryOffer === 'number' &&
                application.salaryOffer > 0
                  ? ` · Offer: ${formatRupiah(application.salaryOffer)}`
                  : ''}
              </p>
            </div>
          </div>

          <div className="workspace-actions">
            <span className={`status-stamp status-${application.status.toLowerCase()}`}>
              {STATUS_LABELS[application.status]}
            </span>

            {attachedCvDoc?.dataUrl && (
              <a
                href={attachedCvDoc.dataUrl}
                download={attachedCvDoc.name}
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <Download size={13} aria-hidden="true" />
                Unduh CV
              </a>
            )}

            {canSimulateGhost && (
              <button
                type="button"
                className="btn btn-warning-outline btn-sm"
                onClick={() => onSimulateGhosting(application.id)}
              >
                <Clock size={13} aria-hidden="true" />
                Simulasi +15 Hari
              </button>
            )}

            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={() => onDelete(application.id)}
            >
              <Trash2 size={13} aria-hidden="true" />
              Hapus
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Tutup detail lamaran"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="dialog-body">
          {ghostRisk && (
            <div className="alert-inline" role="status">
              <AlertTriangle size={15} aria-hidden="true" />
              <span>
                Rawan Ghosting — belum ada perubahan status lebih dari 14 hari. Pertimbangkan
                follow-up HRD atau pindahkan ke Ghosted.
              </span>
            </div>
          )}

          <div className="detail-grid">
            <div className="detail-col">
              {/* Tahap Seleksi & State Machine */}
              <section className="detail-block" aria-labelledby="stage-heading">
                <div className="block-header">
                  <h3 id="stage-heading" className="block-title">
                    Tahap Seleksi
                  </h3>
                  {application.status === 'GHOSTED' && (
                    <span className="field-hint">
                      Khusus status Ghosted hanya boleh kembali ke Screening.
                    </span>
                  )}
                </div>

                <div className="stepper" aria-label="Progres tahapan seleksi">
                  {PIPELINE_STEPS.map((step, index) => {
                    const isCurrent = step === application.status;
                    const isDone = currentStepIndex > index;
                    return (
                      <div
                        key={step}
                        className={`step-item ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''}`}
                      >
                        <div className="step-bar" />
                        <span className="step-label">
                          {index + 1}. {STATUS_LABELS[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {isFinalStatus(application.status) ? (
                  <div className="transition-panel">
                    <div className="app-meta-item">
                      <Lock size={15} aria-hidden="true" />
                      <span>
                        Status <strong>{STATUS_LABELS[application.status]}</strong> bersifat
                        final dan tidak dapat dipindahkan ke tahap lain.
                      </span>
                    </div>
                  </div>
                ) : (
                  <form
                    className="transition-panel"
                    onSubmit={handleConfirmTransition}
                    noValidate
                  >
                    <div className="transition-targets">
                      <span className="field-label">Pindahkan status ke:</span>
                      <div className="transition-btn-group">
                        {validTargets.map((target) => (
                          <button
                            key={target}
                            type="button"
                            className={`target-btn ${activeTarget === target ? 'is-selected' : ''}`}
                            onClick={() => handleSelectTarget(target)}
                          >
                            {STATUS_LABELS[target]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {transitionError && (
                      <div className="alert-inline" role="alert">
                        <AlertCircle size={15} aria-hidden="true" />
                        <span>{transitionError}</span>
                      </div>
                    )}

                    {activeTarget === 'APPLIED' && (
                      <>
                        {(cvDocuments.length > 0 || onUploadCvFiles) && (
                          <div className="form-grid-2" style={{ alignItems: 'end' }}>
                            {cvDocuments.length > 0 && (
                              <div className="field">
                                <label htmlFor="trans-cv-vault" className="field-label">
                                  Pilih dari CV Vault
                                </label>
                                <select
                                  id="trans-cv-vault"
                                  className="select"
                                  value={matchingVaultCv}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      setCvVersion(e.target.value);
                                      if (transitionError) setTransitionError('');
                                    }
                                  }}
                                >
                                  <option value="">-- Pilih CV tersimpan --</option>
                                  {cvDocuments.map((cv) => (
                                    <option key={cv.id} value={cv.name}>
                                      {cv.name} ({cv.label}){cv.isDefault ? ' ★' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {onUploadCvFiles && (
                              <div>
                                <input
                                  ref={inlineCvUploadRef}
                                  type="file"
                                  multiple
                                  accept=".pdf,.doc,.docx,application/pdf"
                                  className="sr-only"
                                  onChange={(e) => {
                                    void handleInlineCvUpload(e.target.files);
                                    e.target.value = '';
                                  }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ height: 40, width: '100%' }}
                                  onClick={() => inlineCvUploadRef.current?.click()}
                                >
                                  <Upload size={14} aria-hidden="true" />
                                  Upload CV Baru
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="form-grid-2">
                          <div className="field">
                            <label htmlFor="trans-cv" className="field-label">
                              Versi CV
                            </label>
                            <input
                              id="trans-cv"
                              className="input"
                              value={cvVersion}
                              onChange={(e) => {
                                setCvVersion(e.target.value);
                                if (transitionError) setTransitionError('');
                              }}
                              placeholder="Misal: Kapten-CV-v2.pdf"
                            />
                          </div>
                          <div className="field">
                            <label htmlFor="trans-date" className="field-label">
                              Tanggal Melamar
                            </label>
                            <input
                              id="trans-date"
                              type="date"
                              className="input"
                              value={appliedDate}
                              onChange={(e) => {
                                setAppliedDate(e.target.value);
                                if (transitionError) setTransitionError('');
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {activeTarget === 'INTERVIEW' && (
                      <div className="field">
                        <label htmlFor="trans-interview" className="field-label">
                          Jadwal Interview (Tanggal &amp; Jam)
                        </label>
                        <input
                          id="trans-interview"
                          type="datetime-local"
                          className="input"
                          value={interviewDateTime}
                          onChange={(e) => {
                            setInterviewDateTime(e.target.value);
                            if (transitionError) setTransitionError('');
                          }}
                        />
                      </div>
                    )}

                    {activeTarget === 'OFFER' && (
                      <div className="form-grid-2">
                        <div className="field">
                          <label htmlFor="trans-salary" className="field-label">
                            Uang Saku / Gaji per Bulan (Rp)
                          </label>
                          <input
                            id="trans-salary"
                            type="number"
                            min={1}
                            step={100000}
                            className="input tabular-nums"
                            value={salaryInput}
                            onChange={(e) => {
                              setSalaryInput(e.target.value);
                              if (transitionError) setTransitionError('');
                            }}
                            placeholder="Misal: 5500000"
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="trans-workmode" className="field-label">
                            Mode Kerja Offer
                          </label>
                          <select
                            id="trans-workmode"
                            className="select"
                            value={offerWorkMode}
                            onChange={(e) => setOfferWorkMode(e.target.value as WorkMode)}
                          >
                            {WORK_MODES.map((mode) => (
                              <option key={mode} value={mode}>
                                {mode}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={!activeTarget}
                      >
                        <Check size={14} aria-hidden="true" />
                        Konfirmasi ke {activeTarget ? STATUS_LABELS[activeTarget] : ''}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* Daftar Persiapan (Nested Checklist + 1-Click Template) */}
              <section className="detail-block" aria-labelledby="checklist-heading">
                <div className="block-header">
                  <h3 id="checklist-heading" className="block-title">
                    Daftar Persiapan
                  </h3>
                  <div className="workspace-actions">
                    {onApplyChecklistTemplate && totalChecklist === 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onApplyChecklistTemplate(application.id)}
                      >
                        <ListChecks size={13} aria-hidden="true" />
                        Isi Template Persiapan
                      </button>
                    )}
                    <span className="field-hint tabular-nums">
                      {doneCount} / {totalChecklist} selesai
                    </span>
                  </div>
                </div>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-valuenow={checklistPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="progress-fill" style={{ width: `${checklistPct}%` }} />
                </div>

                {application.checklist.length === 0 ? (
                  <p className="panel-desc">
                    Belum ada checklist persiapan. Tambah manual atau pakai Template
                    Persiapan standar.
                  </p>
                ) : (
                  <ul className="checklist-items">
                    {application.checklist.map((item) => (
                      <li key={item.id} className="checklist-row">
                        <label
                          className={`checklist-label ${item.done ? 'is-done' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() =>
                              onToggleChecklistItem(application.id, item.id)
                            }
                          />
                          <span>{item.text}</span>
                        </label>
                        <button
                          type="button"
                          className="skill-chip-remove"
                          onClick={() => onRemoveChecklistItem(application.id, item.id)}
                          aria-label={`Hapus tugas ${item.text}`}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form className="inline-add-form" onSubmit={handleAddChecklist}>
                  <label htmlFor="new-checklist-input" className="sr-only">
                    Tambah tugas persiapan baru
                  </label>
                  <input
                    id="new-checklist-input"
                    className="input"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Tambah tugas persiapan baru..."
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ height: 40 }}
                  >
                    <Plus size={14} aria-hidden="true" />
                    Tambah
                  </button>
                </form>
              </section>
            </div>

            <div className="detail-col">
              {/* Latihan Interview Timer */}
              <InterviewPrepTimer />

              {/* Riwayat Aktivitas */}
              <section className="detail-block" aria-labelledby="activity-heading">
                <div className="block-header">
                  <h3 id="activity-heading" className="block-title">
                    Riwayat Aktivitas
                  </h3>
                  <span className="field-hint tabular-nums">
                    {application.activityLogs.length} catatan
                  </span>
                </div>

                <ul className="timeline">
                  {application.activityLogs.map((log) => (
                    <li key={log.id} className="timeline-item">
                      <span className="timeline-mark" aria-hidden="true" />
                      <div>
                        <p className="timeline-time tabular-nums">
                          {formatDateTime(log.timestamp)}
                        </p>
                        <p className="timeline-msg">{log.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <form className="inline-add-form" onSubmit={handleAddNote}>
                  <label htmlFor="manual-note-input" className="sr-only">
                    Tambah catatan manual
                  </label>
                  <input
                    id="manual-note-input"
                    className="input"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Tambah catatan manual Kapten..."
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    style={{ height: 40 }}
                  >
                    <Send size={13} aria-hidden="true" />
                    Catat
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
