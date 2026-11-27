import { useRef, useState } from 'react';
import { Download, Eye, FileText, Star, Trash2, Upload } from 'lucide-react';
import type { Application } from '../types/application';
import type { CvDocument } from '../types/cv';
import { formatFileSize } from '../utils/cvStorage';
import { formatDate } from '../utils/format';
import CvPreviewModal from './CvPreviewModal';

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
  const [previewCvId, setPreviewCvId] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await onUploadFiles(files);
    } finally {
      setUploading(false);
    }
  }

  const previewCv = cvDocuments.find((c) => c.id === previewCvId) ?? null;

  return (
    <section className="cv-vault-stack" aria-labelledby="cv-vault-heading">
      <div className="board-head">
        <h2 id="cv-vault-heading" className="section-heading">
          Dokumen CV{' '}
          <span className="section-count tabular-nums">({cvDocuments.length})</span>
        </h2>
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
          <Upload size={19} aria-hidden="true" />
        </div>
        <h3 className="panel-heading">
          {uploading ? 'Mengunggah...' : 'Unggah CV (PDF / DOCX)'}
        </h3>
        <p className="field-hint">Tarik file ke sini atau pilih banyak file sekaligus.</p>

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
          Pilih File CV
        </button>
      </div>

      {cvDocuments.length === 0 ? (
        <div className="surface state-box">
          <div className="state-box-icon">
            <FileText size={20} aria-hidden="true" />
          </div>
          <h3>Belum ada CV tersimpan</h3>
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
                        {formatFileSize(cv.fileSize)} · {formatDate(cv.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  {cv.isDefault && (
                    <span className="status-stamp status-offer">CV UTAMA</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={`cv-label-${cv.id}`} className="field-label">
                    Label Posisi
                  </label>
                  <input
                    id={`cv-label-${cv.id}`}
                    className="input"
                    value={cv.label}
                    onChange={(e) => onUpdateLabel(cv.id, e.target.value)}
                    placeholder="Frontend / Full-Stack"
                  />
                </div>

                <p className="field-hint tabular-nums">
                  Dipakai di <strong>{usageCount}</strong> lamaran
                </p>

                <div className="cv-card-actions">
                  <div className="app-card-actions-right">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setPreviewCvId(cv.id)}
                    >
                      <Eye size={13} aria-hidden="true" />
                      Preview
                    </button>

                    {!cv.isDefault && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSetDefault(cv.id)}
                      >
                        <Star size={13} aria-hidden="true" />
                        Utama
                      </button>
                    )}

                    {cv.dataUrl && (
                      <a
                        href={cv.dataUrl}
                        download={cv.name}
                        className="btn btn-secondary btn-sm"
                        style={{ textDecoration: 'none' }}
                        aria-label={`Unduh ${cv.name}`}
                      >
                        <Download size={13} aria-hidden="true" />
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

      {previewCv && (
        <CvPreviewModal
          cv={previewCv}
          linkedApplications={applications.filter(
            (app) => app.cvVersion?.trim().toLowerCase() === previewCv.name.toLowerCase(),
          )}
          onClose={() => setPreviewCvId(null)}
        />
      )}
    </section>
  );
}
