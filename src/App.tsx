import { useState } from "react";
import type { JobListing } from "./types/job";
import JobExplorer from "./components/jobs/JobExplorer";
import SkillProfile from "./components/jobs/SkillProfile";

function App(){
  const [captainSkills, setCaptainSkills] = useState<string[]>([
    "HTML", "CSS", "JavaScript"
  ]);
  const [wishlist, setWishlist] = useState<JobListing[]>([]);

  function handleSaveToWishlist(job: JobListing) {
    const alreadySaved = wishlist.some(
      (savedJob) => savedJob.id === job.id
    );

    if (alreadySaved) return;

    setWishlist((current) => [...current, job]);
  }

  return (
    <main>
      <h1>Aku Mw Magang</h1>

      <SkillProfile
        skills={captainSkills}
        onSkillsChange={setCaptainSkills}
      />

      <hr />

      <JobExplorer
        captainSkills={captainSkills}
        savedJobIds={wishlist.map((job) => job.id)}
        onSaveToWishlist={handleSaveToWishlist}
      />

      <hr />

      <section>
        <h2>Wishlist</h2>
        <p>Total lowongan tersimpan: {wishlist.length}</p>

        {wishlist.map((job) => (
          <article key={job.id}>
            <h3>{job.title}</h3>
            <p>{job.company_name}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;