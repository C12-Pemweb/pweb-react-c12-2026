import { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import {
  AlertCircle,
  BookmarkPlus,
  Check,
  Database,
  Globe,
  RefreshCw,
  Search,
  SearchX,
} from 'lucide-react';
import type { Application } from '../../types/application';
import type { JobListing } from '../../types/job';
import { fetchFallbackJobs, fetchRemoteJobs } from '../../services/jobService';
import { useDebounce } from '../../hooks/useDebounce';
import { calculateSkillMatch, getMatchTier } from '../../utils/skillMatch';
import { isDuplicateApplication } from '../../utils/validation';
import { getCompanyInitials } from '../../utils/format';
import SkillProfile from './SkillProfile';

interface JobExplorerProps {
  kaptenSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  applications: Application[];
  onSaveToWishlist: (job: JobListing) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

export default function JobExplorer({
  kaptenSkills,
  onSkillsChange,
  applications,
  onSaveToWishlist,
  searchInputRef,
}: JobExplorerProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('Semua');
  const [useFallback, setUseFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const debouncedKeyword = useDebounce(keyword, 400);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);
      setError('');

      try {
        const data = useFallback
          ? await fetchFallbackJobs(controller.signal)
          : await fetchRemoteJobs(controller.signal);

        if (!controller.signal.aborted) {
          setJobs(data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat mengambil daftar lowongan.',
        );
        setJobs([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      controller.abort();
    };
  }, [useFallback, retryCount]);

  const categories = useMemo(
    () => ['Semua', ...new Set(jobs.map((job) => job.category))],
    [jobs],
  );

  const activeCategory = categories.includes(category) ? category : 'Semua';

  const filteredJobs = useMemo(() => {
    const term = debouncedKeyword.trim().toLowerCase();

    return jobs
      .filter((job) => {
        const matchesCategory =
          activeCategory === 'Semua' || job.category === activeCategory;
        if (!matchesCategory) return false;
        if (!term) return true;

        const haystack =
          `${job.title} ${job.company_name} ${job.tags.join(' ')}`.toLowerCase();
        return haystack.includes(term);
      })
      .map((job) => ({
        job,
        match: calculateSkillMatch(job.tags, kaptenSkills),
      }))
      .sort((a, b) => {
        if (b.match.score !== a.match.score) {
          return b.match.score - a.match.score;
        }
        return a.job.title.localeCompare(b.job.title);
      });
  }, [jobs, debouncedKeyword, activeCategory, kaptenSkills]);

  function handleSourceChange(nextFallback: boolean) {
    if (nextFallback === useFallback) return;
    setCategory('Semua');
    setUseFallback(nextFallback);
  }

  return (
    <div className="explorer-stack">
      <div className="explorer-bento-top">
        <SkillProfile skills={kaptenSkills} onSkillsChange={onSkillsChange} />

        <section className="surface bento-panel" aria-labelledby="source-heading">
          <div>
            <h2 id="source-heading" className="panel-heading">
              Sumber Data Lowongan
            </h2>
            <p className="panel-desc">
              Pilih live API atau dataset magang Indonesia lokal.
            </p>
          </div>

          <div
            className="source-options"
            role="radiogroup"
            aria-label="Sumber data lowongan"
          >
            <label className={`source-radio ${!useFallback ? 'is-selected' : ''}`}>
              <span className="source-radio-left">
                <input
                  type="radio"
                  name="job-source"
                  checked={!useFallback}
                  onChange={() => handleSourceChange(false)}
                />
                <Globe size={15} aria-hidden="true" />
                <span>Remotive API (Live)</span>
              </span>
              <span
                className={`dot-anchor ${!useFallback ? '' : 'is-neutral'}`}
                aria-hidden="true"
              />
            </label>

            <label className={`source-radio ${useFallback ? 'is-selected' : ''}`}>
              <span className="source-radio-left">
                <input
                  type="radio"
                  name="job-source"
                  checked={useFallback}
                  onChange={() => handleSourceChange(true)}
                />
                <Database size={15} aria-hidden="true" />
                <span>Dataset Magang ID (Lokal)</span>
              </span>
              <span
                className={`dot-anchor ${useFallback ? 'is-gold' : 'is-neutral'}`}
                aria-hidden="true"
              />
            </label>
          </div>
        </section>
      </div>

      <section className="board-section" aria-labelledby="recommended-jobs-heading">
        <div className="board-head">
          <div>
            <h2 id="recommended-jobs-heading" className="section-heading">
              Lowongan Tersedia{' '}
              {!loading && !error && (
                <span className="section-count tabular-nums">
                  ({filteredJobs.length})
                </span>
              )}
            </h2>
          </div>

          <span className="badge badge-neutral">
            <span className="badge-dot" aria-hidden="true" />
            Urut: Match Tertinggi
          </span>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <label htmlFor="job-search-input" className="sr-only">
              Cari posisi, perusahaan, atau skill
            </label>
            <input
              ref={searchInputRef}
              id="job-search-input"
              className="input search-input"
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari posisi, perusahaan, atau skill..."
            />
            <span className="kbd-hint" aria-hidden="true">/</span>
          </div>
        </div>

        {!loading && !error && categories.length > 1 && (
          <div
            className="category-pills"
            role="group"
            aria-label="Filter kategori lowongan"
          >
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`pill-toggle ${isSelected ? 'is-selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => setCategory(cat)}
                >
                  {cat === 'Semua' ? 'Semua Kategori' : cat}
                </button>
              );
            })}
          </div>
        )}

        {!loading && !error && (
          <div className="toolbar-meta">
            <span className="tabular-nums">
              Menampilkan {filteredJobs.length} dari {jobs.length} lowongan ·{' '}
              {useFallback ? 'Dataset Magang ID Lokal' : 'Remotive Live API'}
            </span>
            {keyword !== debouncedKeyword && <span>Mencari...</span>}
          </div>
        )}

        {loading && (
          <div className="job-grid" role="status" aria-label="Memuat daftar lowongan">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="surface skeleton-card">
                <div className="skeleton-line is-short" />
                <div className="skeleton-line is-title" />
                <div className="skeleton-line" />
                <div className="skeleton-line is-short" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="surface state-box" role="alert">
            <div className="state-box-icon is-error">
              <AlertCircle size={20} aria-hidden="true" />
            </div>
            <h3>Gagal memuat lowongan</h3>
            <p>{error}</p>
            <div className="state-box-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setRetryCount((c) => c + 1)}
              >
                <RefreshCw size={14} aria-hidden="true" />
                Coba Lagi
              </button>
              {!useFallback ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSourceChange(true)}
                >
                  <Database size={14} aria-hidden="true" />
                  Gunakan Fallback Lokal
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleSourceChange(false)}
                >
                  <Globe size={14} aria-hidden="true" />
                  Coba Remotive API
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && filteredJobs.length === 0 && (
          <div className="surface state-box">
            <div className="state-box-icon">
              <SearchX size={20} aria-hidden="true" />
            </div>
            <h3>Tidak ada lowongan yang cocok</h3>
            <p>
              Coba ubah kata kunci pencarian, pilih kategori lain, atau beralih sumber
              data lowongan.
            </p>
            {(keyword || activeCategory !== 'Semua') && (
              <div className="state-box-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setKeyword('');
                    setCategory('Semua');
                  }}
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="job-grid">
            {filteredJobs.map(({ job, match }) => {
              const tier = getMatchTier(match.score);
              const alreadyApplied = isDuplicateApplication(
                applications,
                job.company_name,
                job.title,
              );

              return (
                <article key={job.id} className="surface job-card">
                  <div className="job-card-top">
                    <span className="category-tag">{job.category}</span>
                    <span className={`badge badge-${tier} tabular-nums`}>
                      <span className="badge-dot" aria-hidden="true" />
                      {match.score}% Match
                    </span>
                  </div>

                  <div>
                    <h3 className="job-title">{job.title}</h3>
                  </div>

                  <div className="company-row">
                    <div className="company-monogram" aria-hidden="true">
                      {getCompanyInitials(job.company_name)}
                    </div>
                    <div className="company-info">
                      <p className="company-name">{job.company_name}</p>
                      <p className="company-loc">{job.candidate_required_location}</p>
                    </div>
                  </div>

                  {job.tags.length > 0 ? (
                    <div className="skill-tag-group" aria-label="Skill yang dibutuhkan">
                      {match.matchedSkills.map((skill) => (
                        <span
                          key={`m-${skill}`}
                          className="skill-tag is-matched"
                          title="Skill cocok"
                        >
                          <Check size={12} aria-hidden="true" />
                          {skill}
                        </span>
                      ))}
                      {match.missingSkills.map((skill) => (
                        <span
                          key={`x-${skill}`}
                          className="skill-tag is-missing"
                          title="Missing skill"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="field-hint">
                      Tidak ada tag skill spesifik pada lowongan ini.
                    </p>
                  )}

                  <div className="job-card-footer">
                    <span className="job-salary tabular-nums">{job.salary}</span>
                    <button
                      type="button"
                      className={`btn btn-sm ${alreadyApplied ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={alreadyApplied}
                      onClick={() => onSaveToWishlist(job)}
                    >
                      {alreadyApplied ? (
                        <>
                          <Check size={14} aria-hidden="true" />
                          Sudah Dilamar
                        </>
                      ) : (
                        <>
                          <BookmarkPlus size={14} aria-hidden="true" />
                          Simpan ke Wishlist
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
