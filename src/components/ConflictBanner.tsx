import { AlertTriangle, CalendarClock } from 'lucide-react';
import type { InterviewConflict } from '../utils/ghosting';
import { formatCompactDateTime } from '../utils/format';

interface ConflictBannerProps {
  conflicts: InterviewConflict[];
  onInspectPipeline?: () => void;
}

export default function ConflictBanner({
  conflicts,
  onInspectPipeline,
}: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="conflict-banner" role="alert">
      <div className="conflict-banner-body">
        <AlertTriangle size={18} aria-hidden="true" />
        <div className="conflict-list">
          <strong>Jadwal Interview Bentrok ({conflicts.length})</strong>
          {conflicts.map(({ a, b, diffMinutes }) => (
            <span key={`${a.id}-${b.id}`}>
              {a.company} ({formatCompactDateTime(a.interviewDateTime ?? '')}) dan{' '}
              {b.company} ({formatCompactDateTime(b.interviewDateTime ?? '')}) berselisih{' '}
              <strong className="tabular-nums">{diffMinutes} menit</strong> (kurang dari 60 menit).
            </span>
          ))}
        </div>
      </div>

      {onInspectPipeline && (
        <button
          type="button"
          className="btn btn-danger-outline btn-sm"
          onClick={onInspectPipeline}
        >
          <CalendarClock size={14} aria-hidden="true" />
          Cek Pipeline
        </button>
      )}
    </div>
  );
}
