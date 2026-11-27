import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface ResetDbModalProps {
  applicationsCount: number;
  cvCount: number;
  skillsCount: number;
  onConfirmReset: () => void;
  onClose: () => void;
}

export default function ResetDbModal({
  applicationsCount,
  cvCount,
  skillsCount,
  onConfirmReset,
  onClose,
}: ResetDbModalProps) {
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
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-db-title"
      >
        <div className="dialog-header">
          <div className="company-row">
            <div className="state-box-icon is-error" aria-hidden="true">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 id="reset-db-title" className="panel-heading">
                Reset Database Lokal?
              </h2>
              <p className="panel-desc">
                Semua data lokal akan dikembalikan ke state awal yang bersih.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Tutup dialog reset"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="dialog-body">
          <p className="panel-desc tabular-nums">
            Tindakan ini akan menghapus <strong>{applicationsCount} lamaran</strong> dan{' '}
            <strong>{cvCount} dokumen CV</strong>, serta mengembalikan{' '}
            <strong>{skillsCount} skill</strong> ke daftar bawaan (React, TypeScript, CSS)
            dan tema ke Light Mode.
          </p>
          <p className="field-hint">
            Tip: gunakan tombol Ekspor JSON di bilah atas terlebih dahulu jika ingin
            menyimpan salinan cadangan sebelum reset.
          </p>
        </div>

        <div className="dialog-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-danger-solid"
            onClick={onConfirmReset}
          >
            <RotateCcw size={15} aria-hidden="true" />
            Ya, Reset ke State Awal
          </button>
        </div>
      </div>
    </div>
  );
}
