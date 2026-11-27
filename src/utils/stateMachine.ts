import type { Application, ApplicationStatus } from '../types/application';
import { WORK_MODES } from '../types/application';

export const TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  WISHLIST: ['APPLIED'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED'],
  INTERVIEW: ['OFFER', 'REJECTED', 'GHOSTED'],
  GHOSTED: ['SCREENING'],
  OFFER: [],
  REJECTED: [],
};

export function getValidTargets(from: ApplicationStatus): readonly ApplicationStatus[] {
  return TRANSITIONS[from];
}

export function isFinalStatus(status: ApplicationStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function validateTransition(
  app: Application,
  to: ApplicationStatus,
  patch: Partial<Application>,
): string | null {
  if (!TRANSITIONS[app.status].includes(to)) {
    return `Perpindahan dari ${app.status} ke ${to} tidak diperbolehkan.`;
  }

  const next = { ...app, ...patch };

  if (to === 'APPLIED') {
    if (!next.cvVersion?.trim()) {
      return 'Versi CV wajib diisi sebelum pindah ke APPLIED.';
    }
    if (!next.appliedDate?.trim()) {
      return 'Tanggal melamar wajib diisi sebelum pindah ke APPLIED.';
    }
  }

  if (to === 'INTERVIEW') {
    if (!next.interviewDateTime?.trim()) {
      return 'Jadwal interview wajib diisi sebelum pindah ke INTERVIEW.';
    }
    if (Number.isNaN(new Date(next.interviewDateTime).getTime())) {
      return 'Format jadwal interview tidak valid.';
    }
  }

  if (to === 'OFFER') {
    if (
      typeof next.salaryOffer !== 'number' ||
      !Number.isFinite(next.salaryOffer) ||
      next.salaryOffer <= 0
    ) {
      return 'Nominal uang saku / gaji harus lebih dari 0 untuk status OFFER.';
    }
    if (!WORK_MODES.includes(next.workMode)) {
      return 'Mode kerja wajib dipilih untuk status OFFER.';
    }
  }

  return null;
}
