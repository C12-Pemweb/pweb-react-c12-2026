import type { Application } from '../types/application';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ApplicationForm from '../components/ApplicationForm';
import WarRoom from '../components/WarRoom';
import OfferComparator from '../components/OfferComparator';
import '../styles/orang2.css';

export default function Orang2Page() {
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  // Key skill profil Kapten dari Orang 1 — sesuaikan jika namanya beda
  const [ownedSkills] = useLocalStorage<string[]>('captainSkills', []);
  return (
    <div className="orang2-page">
      <ApplicationForm applications={applications} onAdd={a => setApplications(p => [a, ...p])} />
      <WarRoom applications={applications} setApplications={setApplications} ownedSkills={ownedSkills} />
      <OfferComparator applications={applications} ownedSkills={ownedSkills} />
    </div>
  );
}
