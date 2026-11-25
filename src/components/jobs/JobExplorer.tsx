import { useEffect, useMemo, useState } from "react";
import type { JobListing } from "../../types/job";
import { fetchFallbackJobs, fetchRemoteJobs } from "../../services/jobService";
import useDebounce from "../../hooks/useDebounce";
import { calculateSkillMatch } from "../../utils/skillMatch";
import "./jobs.css"

interface JobExplorerProps {
    captainSkills: string[];
    savedJobIds: number[];
    onSaveToWishlist: (job: JobListing) => void;
}

function JobExplorer({
    captainSkills,
    savedJobIds,
    onSaveToWishlist,
}: JobExplorerProps ){
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [keyword,setKeyword] = useState("");
    const [category, setCategory] = useState("Semua");
    const [useFallback, setUseFallback] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const debouncedKeyword = useDebounce(keyword, 400);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const data = useFallback
          ? await fetchFallbackJobs(controller.signal)
          : await fetchRemoteJobs(controller.signal);

        setJobs(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil lowongan."
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
    () => ["Semua", ...new Set(jobs.map((job) => job.category))],
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const searchText =
          `${job.title} ${job.company_name}`.toLowerCase();

        const matchesKeyword = searchText.includes(
          debouncedKeyword.toLowerCase()
        );

        const matchesCategory =
          category === "Semua" || job.category === category;

        return matchesKeyword && matchesCategory;
      })
      .map((job) => ({
        job,
        match: calculateSkillMatch(job.tags, captainSkills),
      }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [jobs, debouncedKeyword, category, captainSkills]);

  if (loading) {
    return <p>Memuat lowongan...</p>;
  }

  if (error) {
    return (
      <section className="job-explorer">
        <p>{error}</p>

        <button className="btn btn-primary" onClick={() => setRetryCount((count) => count + 1)}>
          Coba Lagi
        </button>

        {!useFallback && (
          <button className="btn btn-primary" onClick={() => setUseFallback(true)}>
            Gunakan Fallback Lokal
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="job-explorer">
      <h2 className="section-title">Eksplorasi Lowongan</h2>

      <label>
        Cari lowongan
        <input
          className="job-search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Cari posisi atau perusahaan..."
        />
      </label>

      <label>
        Kategori
        <select
          className="job-filter"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <button onClick={() => setUseFallback((current) => !current)}>
        {useFallback ? "Gunakan Remotive API" : "Gunakan Fallback Lokal"}
      </button>

      {filteredJobs.length === 0 ? (
        <p>Tidak ada lowongan yang ditemukan.</p>
      ) : (
        filteredJobs.map(({ job, match }) => {
          const alreadySaved = savedJobIds.includes(job.id);

          return (
            <article key={job.id}>
              <h3>{job.title}</h3>
              <p>{job.company_name}</p>
              <p>{job.category}</p>
              <p>{job.candidate_required_location}</p>
              <p>{job.salary}</p>

              <h4>Skill Match: {match.score}%</h4>
              <p>Skill cocok: {match.matchedSkills.join(", ") || "-"}</p>
              <p>Missing skill: {match.missingSkills.join(", ") || "-"}</p>

              <button
                disabled={alreadySaved}
                onClick={() => onSaveToWishlist(job)}
              >
                {alreadySaved ? "Sudah Dilamar" : "Simpan ke Wishlist"}
              </button>
            </article>
          );
        })
      )}
    </section>
  );
}

export default JobExplorer;
