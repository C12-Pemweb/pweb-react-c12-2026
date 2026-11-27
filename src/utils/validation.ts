import type { Application } from '../types/application';

export function isDuplicate(apps: Application[], company: string, role: string): boolean {
  const c = company.trim().toLowerCase();
  const r = role.trim().toLowerCase();
  return apps.some(a => a.company.trim().toLowerCase() === c && a.role.trim().toLowerCase() === r);
}

export function skillMatchPercent(required: string[], owned: string[]): number {
  if (required.length === 0) return 0;
  const own = new Set(owned.map(s => s.trim().toLowerCase()));
  const hit = required.filter(s => own.has(s.trim().toLowerCase())).length;
  return Math.round((hit / required.length) * 100);
}
