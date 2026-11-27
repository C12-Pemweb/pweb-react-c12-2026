import type { PipelineStats } from '../utils/stats';

interface StatsDashboardProps {
  stats: PipelineStats;
}

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  return (
    <section className="kpi-strip" aria-label="Statistik lamaran magang">
      <div className="kpi-cell">
        <span className="kpi-label">Total Lamaran</span>
        <span className="kpi-value tabular-nums">{stats.total}</span>
        <span className="kpi-meta tabular-nums">{stats.activeCount} aktif di pipeline</span>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Response Rate</span>
        <span className="kpi-value tabular-nums">{stats.responseRate}%</span>
        <span className="kpi-meta tabular-nums">
          {stats.respondedCount} dari {stats.total} diproses
        </span>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Interview Rate</span>
        <span className="kpi-value tabular-nums">{stats.interviewRate}%</span>
        <span className="kpi-meta tabular-nums">{stats.interviewCount} masuk wawancara</span>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Rawan Ghosting</span>
        <span
          className={`kpi-value tabular-nums ${stats.ghostingRiskCount > 0 ? 'is-danger' : ''}`}
        >
          {stats.ghostingRiskCount}
        </span>
        <span className="kpi-meta">&gt; 14 hari tanpa kabar</span>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Offer Diterima</span>
        <span
          className={`kpi-value tabular-nums ${stats.offerCount > 0 ? 'is-success' : ''}`}
        >
          {stats.offerCount}
        </span>
        <span className="kpi-meta">
          {stats.offerCount >= 2 ? 'Siap dibandingkan' : 'Butuh min. 2 offer'}
        </span>
      </div>
    </section>
  );
}
