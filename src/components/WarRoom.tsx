import { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import {
  AlertTriangle,
  Banknote,
  Briefcase,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  FolderOpen,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import type { Application, ApplicationStatus } from '../types/application';
import { ALL_STATUSES, STATUS_LABELS } from '../types/application';
import {
  findInterviewConflicts,
  getDaysSinceUpdate,
  isGhostingRisk,
} from '../utils/ghosting';
import { calculateSkillMatch, getMatchTier } from '../utils/skillMatch';
import {
  formatCompactDateTime,
  formatRupiah,
  getCompanyInitials,
} from '../utils/format';

type SortKey = 'newest' | 'interview' | 'offer';

interface WarRoomProps {
  applications: Application[];
  kaptenSkills: string[];
  nowMs: number;
  onSelectApplication: (id: string) => void;
  onSimulateGhosting: (id: string) => void;
  onDeleteApplication: (id: string) => void;
  onOpenManualForm: () => void;
  onGoToExplorer: () => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

export default function WarRoom({
  applications,
  kaptenSkills,
  nowMs,
  onSelectApplication,
  onSimulateGhosting,
  onDeleteApplication,
  onOpenManualForm,
  onGoToExplorer,
  searchInputRef,
}: WarRoomProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [ghostOnly, setGhostOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  const conflictingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const conflict of findInterviewConflicts(applications)) {
      ids.add(conflict.a.id);
      ids.add(conflict.b.id);
    }
    return ids;
  }, [applications]);

  const scheduledInterviews = useMemo(() => {
    return applications
      .filter((app) => app.status === 'INTERVIEW' && Boolean(app.interviewDateTime))
      .sort((a, b) =>
        new Date(a.interviewDateTime!).getTime() -
        new Date(b.interviewDateTime!).getTime(),
      );
  }, [applications]);

  const visibleApplications = useMemo(() => {
    const term = query.trim().toLowerCase();

    const filtered = applications.filter((app) => {
      if (term) {
        const text = `${app.company} ${app.role} ${app.cvVersion ?? ''}`.toLowerCase();
        if (!text.includes(term)) return false;
      }
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
      if (ghostOnly && !isGhostingRisk(app, nowMs)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        return b.createdAt.localeCompare(a.createdAt);
      }

      if (sortBy === 'interview') {
        const timeA = a.interviewDateTime ? new Date(a.interviewDateTime).getTime() : NaN;
        const timeB = b.interviewDateTime ? new Date(b.interviewDateTime).getTime() : NaN;
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);
        if (validA && validB) return timeA - timeB;
        if (validA) return -1;
        if (validB) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      }

      const offerDiff = (b.salaryOffer ?? -1) - (a.salaryOffer ?? -1);
      if (offerDiff !== 0) return offerDiff;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [applications, query, statusFilter, ghostOnly, sortBy, nowMs]);

  const hasActiveFilter = Boolean(query.trim()) || statusFilter !== 'ALL' || ghostOnly;

  return (
    <section className="warroom-section" aria-labelledby="warroom-heading">
      {scheduledInterviews.length > 0 && (
        <div className="agenda-strip" aria-label="Agenda interview terjadwal">
          <div className="block-header">
            <span className="block-title">
              Agenda Interview Terjadwal ({scheduledInterviews.length})
            </span>
            <span className="field-hint">Klik jadwal untuk buka detail &amp; prep timer</span>
          </div>
          <div className="agenda-items">
            {scheduledInterviews.map((app) => {
              const isConflict = conflictingIds.has(app.id);
              return (
                <button
                  key={app.id}
                  type="button"
                  className={`agenda-item ${isConflict ? 'is-conflict' : ''}`}
                  onClick={() => onSelectApplication(app.id)}
                >
                  <Calendar size={14} aria-hidden="true" />
                  <span className="mono tabular-nums">
                    {formatCompactDateTime(app.interviewDateTime ?? '')}
                  </span>
                  <strong>{app.company}</strong>
                  {isConflict && (
                    <span className="field-error">Bentrok</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="board-head">
        <h2 id="warroom-heading" className="section-heading">
          Lamaran Saya{' '}
          <span className="section-count tabular-nums">
            ({visibleApplications.length} / {applications.length})
          </span>
        </h2>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <label htmlFor="warroom-search" className="sr-only">
            Cari perusahaan, role, atau versi CV
          </label>
          <input
            ref={searchInputRef}
            id="warroom-search"
            type="search"
            className="input search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari perusahaan, posisi, atau versi CV..."
          />
          <span className="kbd-hint" aria-hidden="true">/</span>
        </div>

        <label htmlFor="warroom-sort" className="sr-only">
          Urutkan lamaran
        </label>
        <select
          id="warroom-sort"
          className="select toolbar-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          <option value="newest">Urut: Terbaru</option>
          <option value="interview">Urut: Jadwal Interview Terdekat</option>
          <option value="offer">Urut: Offer Tertinggi</option>
        </select>

        <label className={`toggle-check ${ghostOnly ? 'is-active' : ''}`}>
          <input
            type="checkbox"
            checked={ghostOnly}
            onChange={(e) => setGhostOnly(e.target.checked)}
          />
          <span>Hanya Rawan Ghosting</span>
        </label>
      </div>

      <div
        className="filter-tabs"
        role="group"
        aria-label="Filter status lamaran"
      >
        <button
          type="button"
          className={`filter-tab ${statusFilter === 'ALL' ? 'is-selected' : ''}`}
          aria-pressed={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        >
          Semua Status
        </button>
        {ALL_STATUSES.map((st) => {
          const isSelected = statusFilter === st;
          return (
            <button
              key={st}
              type="button"
              className={`filter-tab ${isSelected ? 'is-selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => setStatusFilter(st)}
            >
              {STATUS_LABELS[st]}
            </button>
          );
        })}
      </div>

      {applications.length === 0 ? (
        <div className="surface state-box">
          <div className="state-box-icon">
            <FolderOpen size={20} aria-hidden="true" />
          </div>
          <h3>Pipeline lamaran masih kosong</h3>
          <p>
            Simpan lowongan dari Eksplorasi atau catat lamaran manual untuk mulai melacak
            proses magang Kapten.
          </p>
          <div className="state-box-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenManualForm}
            >
              <Plus size={14} aria-hidden="true" />
              Catat Lamaran Manual
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onGoToExplorer}
            >
              Lihat Eksplorasi Lowongan
            </button>
          </div>
        </div>
      ) : visibleApplications.length === 0 ? (
        <div className="surface state-box">
          <div className="state-box-icon">
            <SlidersHorizontal size={20} aria-hidden="true" />
          </div>
          <h3>Tidak ada lamaran sesuai filter</h3>
          <p>Coba ubah filter status, pencarian teks, atau matikan filter Rawan Ghosting.</p>
          {hasActiveFilter && (
            <div className="state-box-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('ALL');
                  setGhostOnly(false);
                }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="pipeline-grid">
          {visibleApplications.map((app) => {
            const match = calculateSkillMatch(app.requiredSkills, kaptenSkills);
            const matchTier = getMatchTier(match.score);
            const ghostRisk = isGhostingRisk(app, nowMs);
            const daysSince = getDaysSinceUpdate(app, nowMs);
            const canSimulateGhost = app.status === 'APPLIED' || app.status === 'SCREENING';
            const doneCount = app.checklist.filter((item) => item.done).length;
            const totalChecklist = app.checklist.length;
            const checklistPct =
              totalChecklist === 0 ? 0 : Math.round((doneCount / totalChecklist) * 100);

            return (
              <article key={app.id} className="surface app-card">
                <div className="app-card-head">
                  <div className="company-row">
                    <div className="company-monogram" aria-hidden="true">
                      {getCompanyInitials(app.company)}
                    </div>
                    <div className="company-info">
                      <p className="company-name">{app.company}</p>
                      <p className="company-loc">{app.workMode}</p>
                    </div>
                  </div>

                  <div className="app-card-right-meta">
                    <span className={`status-stamp status-${app.status.toLowerCase()}`}>
                      {STATUS_LABELS[app.status]}
                    </span>

                    <div
                      className="match-readout"
                      aria-label={`Kecocokan skill ${match.score} persen`}
                    >
                      <div className="match-number-line">
                        <span className={`match-score-num is-${matchTier} tabular-nums`}>
                          {match.score}%
                        </span>
                        <span className="match-score-unit">Match</span>
                      </div>
                      <div className="match-bar-track" aria-hidden="true">
                        <div
                          className={`match-bar-fill is-${matchTier}`}
                          style={{ width: `${match.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="job-title">{app.role}</h3>

                {ghostRisk && (
                  <p className="ghost-flag tabular-nums">
                    <AlertTriangle size={14} aria-hidden="true" />
                    Rawan Ghosting · {daysSince} hari tanpa update
                  </p>
                )}

                <div className="app-meta-grid">
                  <span className="app-meta-item">
                    <FileText size={14} aria-hidden="true" />
                    <span className={app.cvVersion ? 'mono' : ''}>
                      CV: {app.cvVersion ?? '-'}
                    </span>
                  </span>

                  <span className="app-meta-item">
                    <Briefcase size={14} aria-hidden="true" />
                    <span>{app.workMode}</span>
                  </span>

                  {app.interviewDateTime && (
                    <span className="app-meta-item tabular-nums">
                      <Calendar size={14} aria-hidden="true" />
                      <span>{formatCompactDateTime(app.interviewDateTime)}</span>
                    </span>
                  )}

                  {typeof app.salaryOffer === 'number' && app.salaryOffer > 0 && (
                    <span className="app-meta-item tabular-nums">
                      <Banknote size={14} aria-hidden="true" />
                      <strong>{formatRupiah(app.salaryOffer)}</strong>
                    </span>
                  )}
                </div>

                <div>
                  <div className="progress-row">
                    <span className="app-meta-item">
                      <CheckSquare size={13} aria-hidden="true" />
                      <span>Checklist Persiapan</span>
                    </span>
                    <span className="tabular-nums">
                      {doneCount}/{totalChecklist} selesai
                    </span>
                  </div>
                  <div
                    className="progress-track"
                    style={{ marginTop: 6 }}
                    role="progressbar"
                    aria-valuenow={checklistPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progress checklist ${doneCount} dari ${totalChecklist}`}
                  >
                    <div className="progress-fill" style={{ width: `${checklistPct}%` }} />
                  </div>
                </div>

                <div className="app-card-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectApplication(app.id)}
                  >
                    Kelola Detail
                  </button>

                  <div className="app-card-actions-right">
                    {canSimulateGhost && (
                      <button
                        type="button"
                        className="btn btn-warning-outline btn-sm"
                        onClick={() => onSimulateGhosting(app.id)}
                        title="Mundurkan lastUpdatedAt 15 hari untuk uji Rawan Ghosting"
                      >
                        <Clock size={13} aria-hidden="true" />
                        Simulasi +15 Hari
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => onDeleteApplication(app.id)}
                      aria-label={`Hapus lamaran ${app.company} - ${app.role}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
