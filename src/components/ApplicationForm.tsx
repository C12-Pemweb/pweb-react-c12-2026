import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import type { Application, WorkMode } from '../types/application';
import { WORK_MODES } from '../types/application';
import { isDuplicateApplication, parseSkillsInput } from '../utils/validation';
import { getTodayYmd } from '../utils/format';

type InitialStatus = 'WISHLIST' | 'APPLIED';
type ErrorField = 'company' | 'role' | 'cvVersion' | 'appliedDate';

interface ApplicationFormProps {
  applications: Application[];
  onAdd: (app: Application) => void;
  onClose: () => void;
}

export default function ApplicationForm({
  applications,
  onAdd,
  onClose,
}: ApplicationFormProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Remote');
  const [status, setStatus] = useState<InitialStatus>('WISHLIST');
  const [skillsInput, setSkillsInput] = useState('');
  const [cvVersion, setCvVersion] = useState('');
  const [appliedDate, setAppliedDate] = useState(getTodayYmd);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorField, setErrorField] = useState<ErrorField | null>(null);

  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const cvVersionRef = useRef<HTMLInputElement>(null);
  const appliedDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    companyRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function clearError() {
    if (errorMessage) {
      setErrorMessage('');
      setErrorField(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company.trim()) {
      setErrorMessage('Nama perusahaan wajib diisi.');
      setErrorField('company');
      companyRef.current?.focus();
      return;
    }

    if (!role.trim()) {
      setErrorMessage('Posisi / role wajib diisi.');
      setErrorField('role');
      roleRef.current?.focus();
      return;
    }

    if (isDuplicateApplication(applications, company, role)) {
      setErrorMessage(
        `Lamaran untuk "${company.trim()} — ${role.trim()}" sudah tercatat. Tidak boleh duplikat.`,
      );
      setErrorField('company');
      companyRef.current?.focus();
      return;
    }

    if (status === 'APPLIED') {
      if (!cvVersion.trim()) {
        setErrorMessage('Versi CV wajib diisi jika status awal APPLIED.');
        setErrorField('cvVersion');
        cvVersionRef.current?.focus();
        return;
      }

      if (!appliedDate.trim()) {
        setErrorMessage('Tanggal melamar wajib diisi jika status awal APPLIED.');
        setErrorField('appliedDate');
        appliedDateRef.current?.focus();
        return;
      }
    }

    const now = new Date().toISOString();
    const newApplication: Application = {
      id: crypto.randomUUID(),
      company: company.trim(),
      role: role.trim(),
      workMode,
      status,
      requiredSkills: parseSkillsInput(skillsInput),
      cvVersion: status === 'APPLIED' ? cvVersion.trim() : undefined,
      appliedDate: status === 'APPLIED' ? appliedDate : undefined,
      createdAt: now,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message:
            status === 'APPLIED'
              ? `Lamaran dicatat sebagai APPLIED (CV: ${cvVersion.trim()}, tanggal ${appliedDate})`
              : 'Lamaran dicatat secara manual ke Wishlist',
        },
      ],
    };

    onAdd(newApplication);
    onClose();
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-form-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="manual-form-title" className="panel-heading">
              Catat Lamaran Baru
            </h2>
            <p className="panel-desc">
              Tambahkan lamaran magang secara manual ke War Room Pipeline.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Tutup form"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="dialog-body">
            {errorMessage && (
              <div className="alert-inline" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="app-company" className="field-label">
                  Perusahaan
                </label>
                <input
                  ref={companyRef}
                  id="app-company"
                  className={`input ${errorField === 'company' ? 'is-invalid' : ''}`}
                  aria-invalid={errorField === 'company'}
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    clearError();
                  }}
                  placeholder="Misal: Nusantara Cloud Tech"
                />
              </div>

              <div className="field">
                <label htmlFor="app-role" className="field-label">
                  Posisi / Role
                </label>
                <input
                  ref={roleRef}
                  id="app-role"
                  className={`input ${errorField === 'role' ? 'is-invalid' : ''}`}
                  aria-invalid={errorField === 'role'}
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    clearError();
                  }}
                  placeholder="Misal: Frontend Intern"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="app-work-mode" className="field-label">
                  Mode Kerja
                </label>
                <select
                  id="app-work-mode"
                  className="select"
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                >
                  {WORK_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="app-status" className="field-label">
                  Status Awal
                </label>
                <select
                  id="app-status"
                  className="select"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as InitialStatus);
                    clearError();
                  }}
                >
                  <option value="WISHLIST">WISHLIST</option>
                  <option value="APPLIED">APPLIED</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="app-skills" className="field-label">
                Required Skills
              </label>
              <input
                id="app-skills"
                className="input"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Pisahkan dengan koma, misal: React, TypeScript, CSS, Docker"
              />
              <span className="field-hint">
                Dipakai untuk menghitung Skill Match % dan bobot Offer Comparator.
              </span>
            </div>

            {status === 'APPLIED' && (
              <div className="form-grid-2">
                <div className="field">
                  <label htmlFor="app-cv-version" className="field-label">
                    Versi CV (Wajib)
                  </label>
                  <input
                    ref={cvVersionRef}
                    id="app-cv-version"
                    className={`input ${errorField === 'cvVersion' ? 'is-invalid' : ''}`}
                    aria-invalid={errorField === 'cvVersion'}
                    value={cvVersion}
                    onChange={(e) => {
                      setCvVersion(e.target.value);
                      clearError();
                    }}
                    placeholder="Misal: Kapten-CV-v2.pdf"
                  />
                </div>

                <div className="field">
                  <label htmlFor="app-applied-date" className="field-label">
                    Tanggal Melamar (Wajib)
                  </label>
                  <input
                    ref={appliedDateRef}
                    id="app-applied-date"
                    type="date"
                    className={`input ${errorField === 'appliedDate' ? 'is-invalid' : ''}`}
                    aria-invalid={errorField === 'appliedDate'}
                    value={appliedDate}
                    onChange={(e) => {
                      setAppliedDate(e.target.value);
                      clearError();
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="dialog-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} aria-hidden="true" />
              Simpan Lamaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
