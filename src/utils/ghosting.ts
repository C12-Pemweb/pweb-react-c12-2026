import type { Application } from '../types/application';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const GHOSTING_THRESHOLD_DAYS = 14;
export const CONFLICT_WINDOW_MINUTES = 60;

export interface InterviewConflict {
  a: Application;
  b: Application;
  diffMinutes: number;
}

export function isGhostingRisk(app: Application, nowMs: number): boolean {
  if (app.status !== 'APPLIED' && app.status !== 'SCREENING') return false;
  const updatedMs = new Date(app.lastUpdatedAt).getTime();
  if (Number.isNaN(updatedMs)) return false;
  return (nowMs - updatedMs) / MS_PER_DAY > GHOSTING_THRESHOLD_DAYS;
}

export function getDaysSinceUpdate(app: Application, nowMs: number): number {
  const updatedMs = new Date(app.lastUpdatedAt).getTime();
  if (Number.isNaN(updatedMs)) return 0;
  return Math.max(0, Math.floor((nowMs - updatedMs) / MS_PER_DAY));
}

export function simulateBackdateDays(isoTimestamp: string, days: number): string {
  const baseMs = new Date(isoTimestamp).getTime();
  const safeBase = Number.isNaN(baseMs) ? Date.now() : baseMs;
  return new Date(safeBase - days * MS_PER_DAY).toISOString();
}

export function findInterviewConflicts(apps: readonly Application[]): InterviewConflict[] {
  const scheduled = apps
    .filter((a) => a.status === 'INTERVIEW' && Boolean(a.interviewDateTime))
    .map((app) => ({ app, timeMs: new Date(app.interviewDateTime!).getTime() }))
    .filter((entry) => !Number.isNaN(entry.timeMs))
    .sort((x, y) => x.timeMs - y.timeMs);

  const conflicts: InterviewConflict[] = [];
  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const diffMinutes = Math.round((scheduled[j].timeMs - scheduled[i].timeMs) / 60000);
      if (diffMinutes < CONFLICT_WINDOW_MINUTES) {
        conflicts.push({ a: scheduled[i].app, b: scheduled[j].app, diffMinutes });
      } else {
        break;
      }
    }
  }
  return conflicts;
}
