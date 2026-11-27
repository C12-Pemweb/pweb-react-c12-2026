import { RotateCcw } from 'lucide-react';

interface UndoToastProps {
  company: string;
  role: string;
  secondsLeft: number;
  onUndo: () => void;
}

export default function UndoToast({
  company,
  role,
  secondsLeft,
  onUndo,
}: UndoToastProps) {
  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className="undo-toast">
        <span>
          Lamaran <strong>{company}</strong> ({role}) telah dihapus.
        </span>
        <button type="button" className="undo-btn tabular-nums" onClick={onUndo}>
          <RotateCcw
            size={13}
            aria-hidden="true"
            style={{ verticalAlign: '-2px', marginRight: 5 }}
          />
          Undo ({secondsLeft}d)
        </button>
      </div>
    </div>
  );
}
