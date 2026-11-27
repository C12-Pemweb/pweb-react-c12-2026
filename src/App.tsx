import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Application } from './types/application';
import type { JobListing } from './types/job';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  inferWorkMode,
  isDuplicateApplication,
  normalizeStoredApplications,
  normalizeStoredSkills,
} from './utils/validation';
import JobExplorer from './components/jobs/JobExplorer';
import ApplicationForm from './components/ApplicationForm';

const DEFAULT_SKILLS = ['React', 'TypeScript', 'CSS'];

export default function App() {
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    'kaptenSkills',
    DEFAULT_SKILLS,
    (raw) => normalizeStoredSkills(raw, DEFAULT_SKILLS),
  );
  const [applications, setApplications] = useLocalStorage<Application[]>(
    'applications',
    [],
    normalizeStoredApplications,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  function handleAddApplication(newApp: Application) {
    setApplications((prev) => [newApp, ...prev]);
  }

  function handleSaveToWishlist(job: JobListing) {
    if (isDuplicateApplication(applications, job.company_name, job.title)) {
      return;
    }

    const now = new Date().toISOString();
    const nextApp: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: inferWorkMode(job.candidate_required_location),
      status: 'WISHLIST',
      requiredSkills: job.tags,
      createdAt: now,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: 'Disimpan ke Wishlist dari Eksplorasi Lowongan',
        },
      ],
    };

    handleAddApplication(nextApp);
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">AM</span>
            <span>Aku Mw Magang</span>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus size={15} aria-hidden="true" />
              Catat Lamaran
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <JobExplorer
          kaptenSkills={kaptenSkills}
          onSkillsChange={setKaptenSkills}
          applications={applications}
          onSaveToWishlist={handleSaveToWishlist}
        />
      </main>

      {isFormOpen && (
        <ApplicationForm
          applications={applications}
          onAdd={handleAddApplication}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
