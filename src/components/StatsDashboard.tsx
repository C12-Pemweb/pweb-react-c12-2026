import type { PipelineStats } from '../utils/stats';

interface StatsDashboardProps {
  stats: PipelineStats;
}

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  return (
    <section className="kpi-bento" aria-label="Statistik lamaran magang">
      <div className="kpi-tile is-olive">
        <div className="kpi-tile-top">
          <span className="kpi-label">Total Lamaran</span>
          <span className="dot-anchor is-gold" aria-hidden="true" />
        </div>
        <div>
          <p className="kpi-value tabular-nums">{stats.total}</p>
          <p className="kpi-meta tabular-nums" style={{ marginTop: 4 }}>
            {stats.activeCount} aktif di pipeline
          </p>
        </div>
      </div>

      <div className="kpi-tile is-obsidian">
        <div className="kpi-tile-top">
          <span className="kpi-label">Response Rate</span>
          <span className="dot-anchor" aria-hidden="true" />
        </div>
        <div>
          <p className="kpi-value tabular-nums">{stats.responseRate}%</p>
          <p className="kpi-meta tabular-nums" style={{ marginTop: 4 }}>
            {stats.respondedCount} dari {stats.total} diproses
          </p>
        </div>
      </div>

      <div className="kpi-tile is-warm">
        <div className="kpi-tile-top">
          <span className="kpi-label">Interview Rate</span>
          <span className="dot-anchor is-teal" aria-hidden="true" />
        </div>
        <div>
          <p className="kpi-value tabular-nums">{stats.interviewRate}%</p>
          <p className="kpi-meta tabular-nums" style={{ marginTop: 4 }}>
            {stats.interviewCount} masuk wawancara
          </p>
        </div>
      </div>

      <div
        className={`kpi-tile ${stats.ghostingRiskCount > 0 ? 'is-danger-tint' : ''}`}
      >
        <div className="kpi-tile-top">
          <span className="kpi-label">Rawan Ghosting</span>
          <span
            className={`dot-anchor ${stats.ghostingRiskCount > 0 ? 'is-red' : 'is-neutral'}`}
            aria-hidden="true"
          />
        </div>
        <div>
          <p
            className={`kpi-value tabular-nums ${stats.ghostingRiskCount > 0 ? 'is-danger' : ''}`}
          >
            {stats.ghostingRiskCount}
          </p>
          <p className="kpi-meta" style={{ marginTop: 4 }}>
            &gt; 14 hari tanpa kabar
          </p>
        </div>
      </div>

      <div
        className={`kpi-tile ${stats.offerCount >= 2 ? 'is-success-tint' : ''}`}
      >
        <div className="kpi-tile-top">
          <span className="kpi-label">Offer Diterima</span>
          <span
            className={`dot-anchor ${stats.offerCount > 0 ? '' : 'is-neutral'}`}
            aria-hidden="true"
          />
        </div>
        <div>
          <p
            className={`kpi-value tabular-nums ${stats.offerCount > 0 ? 'is-success' : ''}`}
          >
            {stats.offerCount}
          </p>
          <p className="kpi-meta" style={{ marginTop: 4 }}>
            {stats.offerCount >= 2 ? 'Siap dibandingkan' : 'Butuh min. 2 offer'}
          </p>
        </div>
      </div>
    </section>
  );
}
