export interface SkillMatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export type MatchTier = 'high' | 'medium' | 'low';

export function calculateSkillMatch(
  requiredSkills: readonly string[],
  kaptenSkills: readonly string[],
): SkillMatchResult {
  const cleanedRequired = requiredSkills.map((s) => s.trim()).filter(Boolean);
  const ownedSet = new Set(kaptenSkills.map((s) => s.trim().toLowerCase()).filter(Boolean));

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of cleanedRequired) {
    if (ownedSet.has(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const score =
    cleanedRequired.length === 0
      ? 0
      : Math.round((matchedSkills.length / cleanedRequired.length) * 100);

  return { score, matchedSkills, missingSkills };
}

export function getMatchTier(score: number): MatchTier {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
