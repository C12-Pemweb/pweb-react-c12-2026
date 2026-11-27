import type {
  ActivityLog,
  Application,
  ApplicationStatus,
  ChecklistItem,
  WorkMode,
} from '../types/application';
import { ALL_STATUSES, WORK_MODES } from '../types/application';

export function isDuplicateApplication(
  apps: readonly Application[],
  company: string,
  role: string,
): boolean {
  const normalizedCompany = company.trim().toLowerCase();
  const normalizedRole = role.trim().toLowerCase();
  return apps.some(
    (app) =>
      app.company.trim().toLowerCase() === normalizedCompany &&
      app.role.trim().toLowerCase() === normalizedRole,
  );
}

export function parseSkillsInput(raw: string): string[] {
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    skills.push(trimmed);
  }
  return skills;
}

export function inferWorkMode(location: string): WorkMode {
  const lower = location.toLowerCase();
  if (lower.includes('onsite') || lower.includes('on-site')) return 'Onsite';
  if (lower.includes('hybrid')) return 'Hybrid';
  return 'Remote';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStatus(value: unknown): value is ApplicationStatus {
  return typeof value === 'string' && ALL_STATUSES.includes(value as ApplicationStatus);
}

function isWorkMode(value: unknown): value is WorkMode {
  return typeof value === 'string' && WORK_MODES.includes(value as WorkMode);
}

export function normalizeStoredApplication(raw: unknown): Application | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.company !== 'string' || typeof raw.role !== 'string') {
    return null;
  }
  if (!isStatus(raw.status) || !isWorkMode(raw.workMode)) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : now;
  const lastUpdatedAt =
    typeof raw.lastUpdatedAt === 'string'
      ? raw.lastUpdatedAt
      : typeof raw.lastStatusChange === 'string'
        ? raw.lastStatusChange
        : createdAt;

  const requiredSkills = Array.isArray(raw.requiredSkills)
    ? raw.requiredSkills.filter((s): s is string => typeof s === 'string').map((s) => s.trim()).filter(Boolean)
    : [];

  const checklist: ChecklistItem[] = Array.isArray(raw.checklist)
    ? raw.checklist
        .filter(isRecord)
        .filter(
          (item) =>
            typeof item.id === 'string' &&
            typeof item.text === 'string' &&
            typeof item.done === 'boolean',
        )
        .map((item) => ({
          id: item.id as string,
          text: item.text as string,
          done: item.done as boolean,
        }))
    : [];

  const rawLogs = Array.isArray(raw.activityLogs)
    ? raw.activityLogs
    : Array.isArray(raw.activityLog)
      ? raw.activityLog
      : [];

  const activityLogs: ActivityLog[] = rawLogs
    .filter(isRecord)
    .filter(
      (log) =>
        typeof log.id === 'string' &&
        typeof log.timestamp === 'string' &&
        typeof log.message === 'string',
    )
    .map((log) => ({
      id: log.id as string,
      timestamp: log.timestamp as string,
      message: log.message as string,
    }));

  return {
    id: raw.id,
    company: raw.company.trim(),
    role: raw.role.trim(),
    workMode: raw.workMode,
    status: raw.status,
    requiredSkills,
    cvVersion: typeof raw.cvVersion === 'string' ? raw.cvVersion : undefined,
    appliedDate: typeof raw.appliedDate === 'string' ? raw.appliedDate : undefined,
    interviewDateTime: typeof raw.interviewDateTime === 'string' ? raw.interviewDateTime : undefined,
    salaryOffer: typeof raw.salaryOffer === 'number' && Number.isFinite(raw.salaryOffer) ? raw.salaryOffer : undefined,
    createdAt,
    lastUpdatedAt,
    checklist,
    activityLogs,
  };
}

export function normalizeStoredApplications(raw: unknown): Application[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeStoredApplication)
    .filter((app): app is Application => app !== null);
}

export function normalizeStoredSkills(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw)) return fallback;
  const skills = parseSkillsInput(
    raw.filter((item): item is string => typeof item === 'string').join(','),
  );
  return skills;
}
