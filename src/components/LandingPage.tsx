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
              <p className="hero-metric-caption">Lowongan Tech</p>
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
              Lacak lamaran, cocokkan skill, dan bandingkan offer dalam satu ruang kerja.
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

          {/* Upper Right Column */}
          <div className="hero-col hero-right-upper" aria-hidden="true" />

          {/* Lower Left Staggered Pitch-Black Stat Block */}
          <div className="hero-col hero-black-col">
            <div className="hero-black-block">
              <span className="hero-black-num tabular-nums">
                {stats.total > 0 ? `${stats.responseRate}%` : '7'}
              </span>
              <span className="hero-black-label">
                {stats.total > 0 ? 'Response Rate Aktif' : 'Tahap Seleksi Ketat'}
              </span>
            </div>
          </div>

          {/* Lower Center Feature Block with Pop-Out Portrait */}
          <div className="hero-col hero-cream-col">
            <div className="hero-cream-block">
              <div className="hero-cream-copy">
                <h2 className="hero-cream-title">
                  Kelola CV,
                  <br />
                  interview, &amp; offer.
                </h2>
                <span className="hero-cream-meta tabular-nums">
                  <span className="hero-cream-dot" aria-hidden="true" />
                  {skillsCount} skill · {cvCount} CV · {stats.activeCount} aktif
                </span>
              </div>

              <div className="hero-cream-portrait">
                <img
                  src="/images/kapten-cutout.png"
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
                  <Play size={18} fill="currentColor" aria-hidden="true" />
                </button>
                <span className="hero-play-label">Coba Demo</span>
              </div>
            </div>
          </div>

          {/* Lower Right Architectural Caption */}
          <div className="hero-col hero-right-lower">
            <p className="hero-right-caption">Karir Tech Pertama Kapten</p>
          </div>
        </div>
      </section>

      {/* Minimalist Workspace Index */}
      <section className="landing-section" aria-labelledby="pillars-heading">
        <div className="landing-split">
          <div className="editorial-photo-frame">
            <img
              src="/images/workspace-editorial.jpg"
              alt="Meja kerja minimalis dengan laptop dan catatan"
            />
          </div>

          <div>
            <h2
              id="pillars-heading"
              className="workspace-title"
              style={{ marginBottom: '1.5rem' }}
            >
              Satu ruang kerja.
            </h2>

            <div className="pillar-list">
              <button
                type="button"
                className="pillar-row"
                onClick={() => onNavigate('explore')}
              >
                <span className="pillar-num">01</span>
                <div>
                  <p className="pillar-title">Eksplorasi &amp; Skill Match</p>
                  <p className="pillar-desc">Remotive API, dataset lokal, &amp; toggle simpan/batal.</p>
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
                  <p className="pillar-title">War Room &amp; Interview Prep</p>
                  <p className="pillar-desc">State machine ketat, deteksi ghosting, &amp; timer 02:00.</p>
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
                  <p className="pillar-title">CV Vault &amp; Offer Comparator</p>
                  <p className="pillar-desc">Preview multi-CV &amp; perbandingan skor berbobot.</p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
