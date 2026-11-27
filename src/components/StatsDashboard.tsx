import type { PipelineStats } from '../utils/stats';

interface StatsDashboardProps {
  stats: PipelineStats;
}

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  return (
    <section className="kpi-strip" aria-label="Statistik lamaran magang">
      <div className="kpi-cell is-obsidian">
        <span className="kpi-label">Total Lamaran</span>
        <div>
          <p className="kpi-value tabular-nums">{stats.total}</p>
          <p className="kpi-meta tabular-nums">{stats.activeCount} aktif di pipeline</p>
        </div>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Response Rate</span>
        <div>
          <p className="kpi-value tabular-nums">{stats.responseRate}%</p>
          <p className="kpi-meta tabular-nums">
            {stats.respondedCount} dari {stats.total} diproses
          </p>
        </div>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Interview Rate</span>
        <div>
          <p className="kpi-value tabular-nums">{stats.interviewRate}%</p>
          <p className="kpi-meta tabular-nums">{stats.interviewCount} masuk wawancara</p>
        </div>
      </div>

      <div className={`kpi-cell ${stats.ghostingRiskCount > 0 ? 'is-danger-cell' : ''}`}>
        <span className="kpi-label">Rawan Ghosting</span>
        <div>
          <p
            className={`kpi-value tabular-nums ${stats.ghostingRiskCount > 0 ? 'is-danger' : ''}`}
          >
            {stats.ghostingRiskCount}
          </p>
          <p className="kpi-meta">&gt; 14 hari tanpa kabar</p>
        </div>
      </div>

      <div className="kpi-cell is-cream">
        <span className="kpi-label">Offer Diterima</span>
        <div>
          <p
            className={`kpi-value tabular-nums ${stats.offerCount > 0 ? 'is-success' : ''}`}
          >
            {stats.offerCount}
          </p>
          <p className="kpi-meta">
            {stats.offerCount >= 2 ? 'Siap dibandingkan' : 'Butuh min. 2 offer'}
          </p>
        </div>
      </div>
    </section>
  );
}
