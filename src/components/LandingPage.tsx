import { ArrowRight, Play, Plus } from 'lucide-react';
import type { PipelineStats } from '../utils/stats';

export type AppView = 'landing' | 'explore' | 'pipeline' | 'compare' | 'cv';

interface LandingPageProps {
  stats: PipelineStats;
  skillsCount: number;
  cvCount: number;
  onNavigate: (view: AppView) => void;
  onOpenManualForm: () => void;
  onLoadDemo: () => void;
}

export default function LandingPage({
  stats,
  skillsCount,
  cvCount,
  onNavigate,
  onOpenManualForm,
  onLoadDemo,
}: LandingPageProps) {
  return (
    <div className="landing-page">
      <section
        className="landing-hero"
        style={{ backgroundImage: "url('/images/hero-horizon.jpg')" }}
        aria-labelledby="landing-hero-title"
      >
        <div className="hero-grid-shell">
          {/* Upper Left Column */}
          <div className="hero-col hero-left-upper">
            <div>
              <p className="hero-metric-big tabular-nums">15+</p>
              <p className="hero-metric-caption">Lowongan Magang Tech</p>
            </div>
            <div className="avatar-stack" aria-hidden="true">
              <img src="/images/kapten-avatar.jpg" alt="" />
              <img src="/images/kapten-feature.jpg" alt="" />
            </div>
          </div>

          {/* Upper Center Column */}
          <div className="hero-col hero-center-upper">
            <h1 id="landing-hero-title" className="hero-headline">
              Raih Magang
              <br />
              Impian Kapten.
            </h1>

            <p className="hero-lead">
              Eksplorasi lowongan tech, ukur kecocokan skill secara langsung, kelola
              war room lamaran dengan state machine ketat, dan bandingkan offer secara
              objektif.
            </p>

            <div className="hero-cta-row">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => onNavigate('explore')}
              >
                Mulai Eksplorasi
              </button>

              <button
                type="button"
                className="hero-cta-link"
                onClick={onOpenManualForm}
              >
                <Plus size={16} aria-hidden="true" />
                Catat Lamaran
              </button>
            </div>
          </div>

          {/* Upper Right Column (Open architectural sky & pavilion view) */}
          <div className="hero-col hero-right-upper" aria-hidden="true" />

          {/* Lower Left Pitch-Black Metric Block */}
          <div className="hero-col hero-black-block">
            <span className="hero-black-num tabular-nums">
              {stats.total > 0 ? `${stats.responseRate}%` : '7'}
            </span>
            <span className="hero-black-label">
              {stats.total > 0
                ? 'Response Rate Pipeline Aktif'
                : 'Tahap Seleksi State Machine Ketat'}
            </span>
          </div>

          {/* Lower Center Warm Cream Feature Block */}
          <div className="hero-col hero-cream-block">
            <div className="hero-cream-copy">
              <h2 className="hero-cream-title">
                Kelola CV, jadwal interview, dan skor offer dalam satu tempat.
              </h2>
              <span className="hero-cream-meta tabular-nums">
                <span className="hero-cream-dot" aria-hidden="true" />
                {skillsCount} skill · {cvCount} CV tersimpan · {stats.activeCount} aktif
              </span>
            </div>

            <div className="hero-cream-portrait">
              <img
                src="/images/kapten-feature.jpg"
                alt="Mahasiswa teknik informatika siap melamar magang"
              />
            </div>

            <div className="hero-cream-action">
              <button
                type="button"
                className="hero-play-btn"
                onClick={onLoadDemo}
                aria-label="Muat data demo dan buka War Room Pipeline"
                title="Muat contoh 5 lamaran & buka War Room"
              >
                <Play size={19} fill="currentColor" aria-hidden="true" />
              </button>
              <span className="hero-play-label">Coba Demo</span>
            </div>
          </div>

          {/* Lower Right Architectural Overlay */}
          <div className="hero-col hero-right-lower">
            <p className="hero-right-caption">
              Bangun Karir Tech Pertama Bersama Aku Mw Magang
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Pillars & Workspace Photography */}
      <section className="landing-section" aria-labelledby="pillars-heading">
        <div className="landing-split">
          <div className="editorial-photo-frame">
            <img
              src="/images/workspace-editorial.jpg"
              alt="Meja kerja minimalis dengan laptop, buku catatan, dan cahaya matahari pagi"
            />
          </div>

          <div>
            <h2
              id="pillars-heading"
              className="workspace-title"
              style={{ marginBottom: '0.6rem' }}
            >
              Satu ruang kerja untuk seluruh perjalanan magang.
            </h2>
            <p className="workspace-subtitle" style={{ marginBottom: '1.75rem' }}>
              Dibangun murni dengan React 19, TypeScript strict, dan custom hooks lokal —
              tanpa drama lupa versi CV, jadwal bentrok, atau kena ghosting.
            </p>

            <div className="pillar-list">
              <button
                type="button"
                className="pillar-row"
                onClick={() => onNavigate('explore')}
              >
                <span className="pillar-num">01</span>
                <div>
                  <p className="pillar-title">Eksplorasi Lowongan &amp; Skill Match</p>
                  <p className="pillar-desc">
                    Remotive API + 15 lowongan tech lokal, debounced search 400ms, dan
                    simpan atau batalkan lamaran dalam satu klik.
                  </p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="pillar-row"
                onClick={() => onNavigate('pipeline')}
              >
                <span className="pillar-num">02</span>
                <div>
                  <p className="pillar-title">War Room, Ghosting &amp; Latihan Interview</p>
                  <p className="pillar-desc">
                    State machine ketat, deteksi ghosting &gt; 14 hari, peringatan bentrok
                    &lt; 60 menit, checklist template, dan timer 02:00.
                  </p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="pillar-row"
                onClick={() => onNavigate('cv')}
              >
                <span className="pillar-num">03</span>
                <div>
                  <p className="pillar-title">Multi-CV Vault &amp; Offer Comparator</p>
                  <p className="pillar-desc">
                    Unggah banyak versi CV, pilih CV spesifik saat melamar, dan bandingkan
                    dua offer dengan skor berbobot 50 / 25 / 25.
                  </p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Local DB Snapshot Footer Strip */}
      <section className="landing-snapshot" aria-label="Ringkasan data lokal Kapten">
        <div className="landing-snapshot-inner">
          <div>
            <p className="panel-heading">Data tersimpan lokal di browser Kapten</p>
            <p className="panel-desc tabular-nums">
              {stats.total} lamaran tercatat · {stats.offerCount} offer diterima ·{' '}
              {cvCount} dokumen CV · {skillsCount} skill aktif
            </p>
          </div>

          <div className="workspace-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('cv')}
            >
              Kelola CV Vault
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onLoadDemo}
            >
              Muat Data Demo
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('pipeline')}
            >
              Buka War Room
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
