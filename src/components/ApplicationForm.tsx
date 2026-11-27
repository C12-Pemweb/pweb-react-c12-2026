import { useEffect, useRef, useState } from 'react';
import type { Application, ApplicationStatus, WorkMode } from '../types/application';
import { WORK_MODES } from '../types/application';
import { isDuplicateApplication } from '../utils/validation';

interface Props { applications: Application[]; onAdd: (a: Application) => void }

export default function ApplicationForm({ applications, onAdd }: Props) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Remote');
  const [status, setStatus] = useState<ApplicationStatus>('WISHLIST');
  const [skills, setSkills] = useState('');
  const [cvVersion, setCvVersion] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [error, setError] = useState('');
  const companyRef = useRef<HTMLInputElement>(null);

  useEffect(() => { companyRef.current?.focus(); }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return setError('Perusahaan dan posisi wajib diisi');
    if (isDuplicateApplication(applications, company, role)) return setError('Lamaran company + role ini sudah ada');
    if (status === 'APPLIED' && (!cvVersion.trim() || !appliedDate)) return setError('CV Version dan Applied Date wajib untuk status APPLIED');
    const now = new Date().toISOString();
    onAdd({
      id: crypto.randomUUID(),
      company: company.trim(), role: role.trim(), workMode, status,
      requiredSkills: skills.split(',').map(s => s.trim()).filter(Boolean),
      cvVersion: status === 'APPLIED' ? cvVersion.trim() : undefined,
      appliedDate: status === 'APPLIED' ? appliedDate : undefined,
      createdAt: now, lastUpdatedAt: now,
      checklist: [],
      activityLogs: [{ id: crypto.randomUUID(), timestamp: now, message: `Lamaran dibuat dengan status ${status}` }],
    });
    setCompany(''); setRole(''); setSkills(''); setCvVersion(''); setAppliedDate(''); setError('');
    companyRef.current?.focus();
  };

  return (
    <form className="app-form card" onSubmit={submit}>
      <h2>Tambah Lamaran</h2>
      {error && <p className="form-error">{error}</p>}
      <label>Perusahaan<input ref={companyRef} value={company} onChange={e => setCompany(e.target.value)} /></label>
      <label>Posisi / Role<input value={role} onChange={e => setRole(e.target.value)} /></label>
      <label>Mode Kerja
        <select value={workMode} onChange={e => setWorkMode(e.target.value as WorkMode)}>
          {WORK_MODES.map(m => <option key={m}>{m}</option>)}
        </select>
      </label>
      <label>Status Awal
        <select value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)}>
          <option value="WISHLIST">WISHLIST</option>
          <option value="APPLIED">APPLIED</option>
        </select>
      </label>
      <label>Required Skills (pisahkan koma)<input value={skills} onChange={e => setSkills(e.target.value)} /></label>
      {status === 'APPLIED' && (<>
        <label>CV Version<input value={cvVersion} onChange={e => setCvVersion(e.target.value)} /></label>
        <label>Applied Date<input type="date" value={appliedDate} onChange={e => setAppliedDate(e.target.value)} /></label>
      </>)}
      <button type="submit" className="btn-primary">Simpan</button>
    </form>
  );
}
