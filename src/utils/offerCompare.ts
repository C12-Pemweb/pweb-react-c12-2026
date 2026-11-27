import type { Application, WorkMode } from '../types/application';
import { calculateSkillMatch } from './skillMatch';

export const WORK_MODE_SCORE: Record<WorkMode, number> = {
  Remote: 100,
  Hybrid: 75,
  Onsite: 50,
};

export interface OfferScoreBreakdown {
  salaryNormalized: number;
  salaryWeighted: number;
  modeScore: number;
  modeWeighted: number;
  skillMatch: number;
  matchedCount: number;
  totalRequired: number;
  skillWeighted: number;
  total: number;
}

export function scoreOffer(
  app: Application,
  maxSalary: number,
  kaptenSkills: readonly string[],
): OfferScoreBreakdown {
  const salaryNormalized = maxSalary > 0 ? ((app.salaryOffer ?? 0) / maxSalary) * 100 : 0;
  const salaryWeighted = salaryNormalized * 0.5;
  const modeScore = WORK_MODE_SCORE[app.workMode];
  const modeWeighted = modeScore * 0.25;

  const { score: skillMatch, matchedSkills } = calculateSkillMatch(
    app.requiredSkills,
    kaptenSkills,
  );
  const skillWeighted = skillMatch * 0.25;
  const total = salaryWeighted + modeWeighted + skillWeighted;

  return {
    salaryNormalized,
    salaryWeighted,
    modeScore,
    modeWeighted,
    skillMatch,
    matchedCount: matchedSkills.length,
    totalRequired: app.requiredSkills.length,
    skillWeighted,
    total,
  };
}
