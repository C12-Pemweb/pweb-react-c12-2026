export interface SkillMatchResult{
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
}

export function calculateSkillMatch(
    requiredSkills: string[],
    captainSkills: string[]
): SkillMatchResult{
    const normalizedCaptainSkills = captainSkills.map((skill) => skill.trim().toLowerCase());
    const matchedSkills = requiredSkills.filter((skill) => normalizedCaptainSkills.includes(skill.trim().toLowerCase()));
    const missingSkills = requiredSkills.filter((skill) => !normalizedCaptainSkills.includes(skill.trim().toLowerCase()));
    const score = requiredSkills.length === 0 ? 0 : Math.round((matchedSkills.length / requiredSkills.length) * 100 );
    return{
        score,
        matchedSkills,
        missingSkills
    };
}