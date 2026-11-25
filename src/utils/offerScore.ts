    export interface OfferData {
        id: string;
        company: string;
        role: string;
        salaryOffer: number;
        workMode: "Remote" | "Hybrid" | "Onsite";
        requiredSkills: string[];
    }

    export interface OfferScoreResult {
        salaryScore: number;
        workModeScore: number;
        skillMatchScore: number;
        totalScore: number;
    }

    export function calculateOfferScore(
        offer: OfferData,
        highestSalary:  number,
        captainSkills: string[]
    ): OfferScoreResult {
        const salaryScore = highestSalary > 0 ? (offer.salaryOffer / highestSalary) * 100 : 0;
        const workModeScore = {
            Remote: 100, Hybrid: 75, Onsite: 50,
        }[offer.workMode];
        const normalizedCaptainSkills = captainSkills.map((skill) => skill.trim().toLowerCase());
        const matchedSkills = offer.requiredSkills.filter((skill) => normalizedCaptainSkills.includes(skill.trim().toLowerCase()));
        const skillMatchScore = offer.requiredSkills.length === 0 ? 0 : Math.round((matchedSkills.length / offer.requiredSkills.length) * 100 );
        const totalScore = (salaryScore * 0.5) + (workModeScore * 0.25) + (skillMatchScore * 0.25);

        return{
            salaryScore,
            workModeScore,
            skillMatchScore,
            totalScore: Math.round(totalScore * 100) / 100,
        };
    }