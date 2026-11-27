import type { Application, ApplicationStatus } from '../types/application';

// SESUAIKAN dengan diagram di modul jika berbeda
export const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ['APPLIED'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED'],
  INTERVIEW: ['OFFER', 'REJECTED'],
  GHOSTED: ['SCREENING'],
  OFFER: [],     // final
  REJECTED: [],  // final
};

export function getValidTargets(from: ApplicationStatus): ApplicationStatus[] {
  return TRANSITIONS[from];
}

/** Return pesan error, atau null jika valid. `patch` = data tambahan yg diisi user. */
export function validateTransition(
  app: Application, to: ApplicationStatus, patch: Partial<Application>
): string | null {
  if (!TRANSITIONS[app.status].includes(to)) return `Perpindahan ${app.status} → ${to} tidak diizinkan`;
  const m = { ...app, ...patch };
  if (to === 'APPLIED' && (!m.cvVersion?.trim() || !m.appliedDate)) return 'APPLIED butuh cvVersion dan appliedDate';
  if (to === 'INTERVIEW' && !m.interviewDateTime) return 'INTERVIEW butuh interviewDateTime';
  if (to === 'OFFER' && (!m.salaryOffer || m.salaryOffer <= 0 || !m.workMode)) return 'OFFER butuh salaryOffer > 0 dan workMode';
  return null;
}
