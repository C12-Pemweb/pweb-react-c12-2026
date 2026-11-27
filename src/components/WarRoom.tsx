import { useMemo, useState } from 'react';
import type { Application, ApplicationStatus } from '../types/application';
import { ALL_STATUSES } from '../types/application';
import { getValidTargets, validateTransition } from '../utils/stateMachine';
import { findConflicts, isGhostingRisk } from '../utils/ghosting';
import { skillMatchPercent } from '../utils/validation';

interface Props {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  ownedSkills: string[];
}
type SortKey = 'newest' | 'interview' | 'offer';

export default function WarRoom({ applications, setApplications, ownedSkills }: Props) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [ghostOnly, setGhostOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');
  const [dayOffset, setDayOffset] = useState(0);
  const now = Date.now() + dayOffset * 86400000;

  // Konflik dihitung dari SEMUA data (tidak terpengaruh filter)
  const conflicts = useMemo(() => findConflicts(applications), [applications]);

  const visible = useMemo(() => {
    let list = applications.filter(a =>
      `${a.company} ${a.role}`.toLowerCase().includes(query.trim().toLowerCase()) &&
      (statusFilter === 'ALL' || a.status === statusFilter) &&
      (!ghostOnly || isGhostingRisk(a, now)));
    if (sort === 'newest') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'interview')
      list = list.filter(a => a.interviewDateTime).sort((a, b) => a.interviewDateTime!.localeCompare(b.interviewDateTime!));
    if (sort === 'offer')
      list = [...list].sort((a, b) => (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0));
    return list;
  }, [applications, query, statusFilter, ghostOnly, sort, now]);

  const changeStatus = (app: Application, to: ApplicationStatus) => {
    const patch: Partial<Application> = {};
    if (to === 'APPLIED') {
      patch.cvVersion = window.prompt('CV Version?') ?? '';
      patch.appliedDate = window.prompt('Applied date (YYYY-MM-DD)?') ?? '';
    }
    if (to === 'INTERVIEW') {
      const v = window.prompt('Jadwal interview (YYYY-MM-DDTHH:mm)?') ?? '';
      patch.interviewDateTime = v ? new Date(v).toISOString() : undefined;
    }
    if (to === 'OFFER') {
      patch.salaryOffer = Number(window.prompt('Gaji offer (angka)?') ?? 0);
    }
    const err = validateTransition(app, to, patch);
    if (err) { alert(err); return; }
    const ts = new Date().toISOString();
    setApplications(prev => prev.map(a => a.id !== app.id ? a : {
      ...a, ...patch, status: to, lastStatusChange: ts,
      activityLog: [...a.activityLog, { id: crypto.randomUUID(), timestamp: ts, message: `Status ${a.status} → ${to}` }],
    }));
  };

  return (
    <section className="warroom">
      <h2>War Room Pipeline</h2>
      {conflicts.length > 0 && (
        <div className="conflict-banner" role="alert">
          ⚠ Bentrok jadwal interview:{' '}
          {conflicts.map(([a, b]) => `${a.company} vs ${b.company}`).join('; ')}
        </div>
      )}
      <div className="toolbar">
        <input placeholder="Cari perusahaan / role…" value={query} onChange={e => setQuery(e.target.value)} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'ALL' | ApplicationStatus)}>
          <option value="ALL">Semua status</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
          <option value="newest">Terbaru</option>
          <option value="interview">Jadwal Interview Terdekat</option>
          <option value="offer">Offer Tertinggi</option>
        </select>
        <label className="toggle"><input type="checkbox" checked={ghostOnly} onChange={e => setGhostOnly(e.target.checked)} /> Hanya Rawan Ghosting</label>
        <button onClick={() => setDayOffset(d => d + 15)}>Simulasi +15 Hari{dayOffset ? ` (${dayOffset})` : ''}</button>
      </div>

      {visible.length === 0 && <p className="empty">Tidak ada lamaran.</p>}
      <div className="pipeline-grid">
        {visible.map(a => {
          const done = a.checklist.filter(c => c.done).length;
          const targets = getValidTargets(a.status);
          return (
            <article key={a.id} className={`card app-card status-${a.status.toLowerCase()}`}>
              <h3>{a.company} — {a.role}</h3>
              <span className="status-badge">{a.status}</span>
              {isGhostingRisk(a, now) && <span className="ghost-badge">👻 Rawan Ghosting</span>}
              <p>CV: {a.cvVersion ?? '-'} · {a.workMode}</p>
              <p>Checklist: {done}/{a.checklist.length}</p>
              <p>Skill Match: {skillMatchPercent(a.requiredSkills, ownedSkills)}%</p>
              {a.interviewDateTime && <p>Interview: {new Date(a.interviewDateTime).toLocaleString()}</p>}
              {a.salaryOffer ? <p>Offer: Rp {a.salaryOffer.toLocaleString('id-ID')}</p> : null}
              {targets.length > 0 ? (
                <select value="" onChange={e => e.target.value && changeStatus(a, e.target.value as ApplicationStatus)}>
                  <option value="">Pindah status…</option>
                  {targets.map(t => <option key={t}>{t}</option>)}
                </select>
              ) : <em>Status final</em>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
