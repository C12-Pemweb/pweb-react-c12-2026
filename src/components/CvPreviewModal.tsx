import { useEffect, useMemo } from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import type { Application } from '../types/application';
import type { CvDocument } from '../types/cv';
import { dataUrlToBlobUrl, formatFileSize } from '../utils/cvStorage';
import { formatDate } from '../utils/format';

interface CvPreviewModalProps {
  cv: CvDocument;
  linkedApplications: Application[];
  onClose: () => void;
}

export default function CvPreviewModal({
  cv,
  linkedApplications,
  onClose,
}: CvPreviewModalProps) {
  const isPdf =
    cv.mimeType === 'application/pdf' ||
    cv.name.toLowerCase().endsWith('.pdf');
  const isImage = cv.mimeType.startsWith('image/');

  const blobUrl = useMemo(
    () => (cv.dataUrl && isPdf ? dataUrlToBlobUrl(cv.dataUrl) : null),
    [cv.dataUrl, isPdf],
  );

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog-panel is-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-preview-title"
      >
        <div className="dialog-header">
          <div className="company-row">
            <div className="company-monogram" aria-hidden="true">
              <FileText size={16} />
            </div>
            <div className="company-info">
              <h2 id="cv-preview-title" className="panel-heading mono">
                {cv.name}
              </h2>
              <p className="panel-desc tabular-nums">
                {cv.label} · {formatFileSize(cv.fileSize)} · {formatDate(cv.uploadedAt)}
              </p>
            </div>
          </div>

          <div className="workspace-actions">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={13} aria-hidden="true" />
                Tab Baru
              </a>
            )}

            {cv.dataUrl && (
              <a
                href={cv.dataUrl}
                download={cv.name}
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <Download size={13} aria-hidden="true" />
                Unduh
              </a>
            )}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Tutup preview CV"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="dialog-body">
          {isPdf && blobUrl ? (
            <iframe
              className="cv-preview-frame"
              src={blobUrl}
              title={`Preview ${cv.name}`}
            />
          ) : isImage && cv.dataUrl ? (
            <div className="editorial-photo-frame">
              <img src={cv.dataUrl} alt={cv.name} />
            </div>
          ) : (
            <div className="cv-preview-sheet">
              <div className="block-header">
                <span className="block-title">Ringkasan Dokumen</span>
                {cv.isDefault && (
                  <span className="status-stamp status-offer">CV UTAMA</span>
                )}
              </div>

              <div className="cv-preview-grid">
                <div>
                  <p className="field-hint">Nama File</p>
                  <p className="mono">{cv.name}</p>
                </div>
                <div>
                  <p className="field-hint">Fokus Posisi</p>
                  <p>{cv.label}</p>
                </div>
                <div>
                  <p className="field-hint">Ukuran &amp; Format</p>
                  <p className="tabular-nums">
                    {formatFileSize(cv.fileSize)} · {cv.mimeType}
                  </p>
                </div>
                <div>
                  <p className="field-hint">Tanggal Unggah</p>
                  <p className="tabular-nums">{formatDate(cv.uploadedAt)}</p>
                </div>
              </div>

              <p className="panel-desc">
                {cv.dataUrl
                  ? 'Format DOC/DOCX tidak dirender langsung di browser. Klik Unduh untuk membuka dokumen.'
                  : 'Ukuran file melebihi batas pratinjau lokal (1.5 MB), hanya metadata yang disimpan.'}
              </p>
            </div>
          )}

          {linkedApplications.length > 0 && (
            <div>
              <p className="block-title" style={{ marginBottom: '0.45rem' }}>
                Dipakai di {linkedApplications.length} Lamaran
              </p>
              <div className="skill-token-list">
                {linkedApplications.map((app) => (
                  <span key={app.id} className="skill-token is-matched">
                    {app.company} — {app.role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
