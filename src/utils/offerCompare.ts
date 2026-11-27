import type { Application, WorkMode } from '../types/application';
import { skillMatchPercent } from './validation';

export const WORK_MODE_SCORE: Record<WorkMode, number> = { Remote: 100, Hybrid: 75, Onsite: 50 };

export interface OfferScore { salary: number; mode: number; skill: number; total: number }

export function scoreOffer(app: Application, maxSalary: number, ownedSkills: string[]): OfferScore {
  const salary = maxSalary > 0 ? ((app.salaryOffer ?? 0) / maxSalary) * 100 : 0;
  const mode = WORK_MODE_SCORE[app.workMode];
  const skill = skillMatchPercent(app.requiredSkills, ownedSkills);
  return { salary, mode, skill, total: salary * 0.5 + mode * 0.25 + skill * 0.25 };
}
