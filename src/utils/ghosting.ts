import type { Application } from '../types/application';

const DAY = 24 * 60 * 60 * 1000;

export function isGhostingRisk(app: Application, now: number): boolean {
  if (app.status !== 'APPLIED' && app.status !== 'SCREENING') return false;
  return (now - new Date(app.lastStatusChange).getTime()) / DAY > 14;
}

/** Bentrok jika selisih jadwal interview < 60 menit */
export function findConflicts(apps: Application[]): [Application, Application][] {
  const list = apps
    .filter(a => a.status === 'INTERVIEW' && a.interviewDateTime)
    .sort((a, b) => new Date(a.interviewDateTime!).getTime() - new Date(b.interviewDateTime!).getTime());
  const out: [Application, Application][] = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const diff = (new Date(list[j].interviewDateTime!).getTime() - new Date(list[i].interviewDateTime!).getTime()) / 60000;
      if (diff < 60) out.push([list[i], list[j]]); else break;
    }
  return out;
}
