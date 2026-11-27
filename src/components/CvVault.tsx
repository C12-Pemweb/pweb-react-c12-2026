import { useRef, useState } from 'react';
import { Download, FileText, Star, Trash2, Upload } from 'lucide-react';
import type { Application } from '../types/application';
import type { CvDocument } from '../types/cv';
import { formatFileSize, MAX_INLINE_CV_BYTES } from '../utils/cvStorage';
import { formatDate } from '../utils/format';

interface CvVaultProps {
  cvDocuments: CvDocument[];
  applications: Application[];
  onUploadFiles: (files: FileList) => Promise<void>;
  onSetDefault: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onDeleteCv: (id: string) => void;
}

export default function CvVault({
  cvDocuments,
  applications,
  onUploadFiles,
  onSetDefault,
  onUpdateLabel,
  onDeleteCv,
}: CvVaultProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await onUploadFiles(files);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="cv-vault-stack" aria-labelledby="cv-vault-heading">
      <div className="board-head">
        <div>
          <h2 id="cv-vault-heading" className="section-heading">
            Koleksi Dokumen CV{' '}
            <span className="section-count tabular-nums">({cvDocuments.length})</span>
          </h2>
          <p className="section-subtitle">
            Unggah beberapa versi CV (PDF/DOC/DOCX) lalu pilih versi yang sesuai saat
            melamar atau memindahkan status ke Applied.
          </p>
        </div>
      </div>

      <div
        className={`cv-dropzone ${isDragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="state-box-icon">
          <Upload size={20} aria-hidden="true" />
        </div>
        <h3 className="panel-heading">
          {uploading ? 'Memproses dokumen CV...' : 'Unggah satu atau beberapa file CV'}
        </h3>
        <p className="panel-desc">
          Tarik file ke area ini atau pilih file PDF/DOC/DOCX. File hingga{' '}
          {formatFileSize(MAX_INLINE_CV_BYTES)} disimpan penuh agar bisa diunduh kembali.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,application/pdf"
          className="sr-only"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
          aria-label="Pilih file CV untuk diunggah"
        />

        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} aria-hidden="true" />
          Pilih File CV (Multi-Upload)
        </button>
      </div>

      {cvDocuments.length === 0 ? (
        <div className="surface state-box">
          <div className="state-box-icon">
            <FileText size={20} aria-hidden="true" />
          </div>
          <h3>Belum ada CV tersimpan</h3>
          <p>
            Unggah beberapa varian CV (misal versi Frontend, Full-Stack, atau Bahasa
            Inggris) supaya Kapten tidak pernah lupa CV mana yang dikirim.
          </p>
        </div>
      ) : (
        <div className="cv-grid">
          {cvDocuments.map((cv) => {
            const usageCount = applications.filter(
              (app) => app.cvVersion?.trim().toLowerCase() === cv.name.toLowerCase(),
            ).length;

            return (
              <article
                key={cv.id}
                className={`surface cv-card ${cv.isDefault ? 'is-default' : ''}`}
              >
                <div className="cv-card-head">
                  <div className="company-row">
                    <div className="company-monogram" aria-hidden="true">
                      <FileText size={16} />
                    </div>
                    <div className="company-info">
                      <p className="company-name mono">{cv.name}</p>
                      <p className="company-loc tabular-nums">
                        {formatFileSize(cv.fileSize)} · Diunggah {formatDate(cv.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  {cv.isDefault && (
                    <span className="status-stamp status-offer">CV UTAMA</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={`cv-label-${cv.id}`} className="field-label">
                    Label Fokus Posisi
                  </label>
                  <input
                    id={`cv-label-${cv.id}`}
                    className="input"
                    value={cv.label}
                    onChange={(e) => onUpdateLabel(cv.id, e.target.value)}
                    placeholder="Misal: Frontend React & TypeScript"
                  />
                </div>

                <p className="field-hint tabular-nums">
                  Dipakai di <strong>{usageCount}</strong> lamaran
                  {!cv.dataUrl && ' · Hanya metadata tersimpan'}
                </p>

                <div className="cv-card-actions">
                  <div className="app-card-actions-right">
                    {!cv.isDefault && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSetDefault(cv.id)}
                      >
                        <Star size={13} aria-hidden="true" />
                        Jadikan Utama
                      </button>
                    )}

                    {cv.dataUrl && (
                      <a
                        href={cv.dataUrl}
                        download={cv.name}
                        className="btn btn-secondary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <Download size={13} aria-hidden="true" />
                        Unduh
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => onDeleteCv(cv.id)}
                    aria-label={`Hapus CV ${cv.name}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
