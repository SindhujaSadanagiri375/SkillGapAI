import { LightningElement, api } from "lwc";

function normalizeSkillName(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export default class CareerSuggestions extends LightningElement {
  @api recommendations = [];

  careerRoles = [
    {
      role: "Salesforce Developer",
      skills: ["Apex Programming", "SOQL", "Lightning Web Components"],
      description:
        "Build Salesforce applications, automation and custom user interfaces."
    },
    {
      role: "Java Developer",
      skills: ["Java", "SQL", "JavaScript"],
      description: "Develop backend applications and enterprise software."
    },
    {
      role: "Web Developer",
      skills: ["JavaScript", "HTML", "CSS"],
      description:
        "Create responsive websites and interactive web applications."
    },
    {
      role: "Python Developer",
      skills: ["Python", "SQL", "JavaScript"],
      description: "Build applications, automation tools and data solutions."
    }
  ];

  get suggestedCareers() {
    const studentSkills = Array.isArray(this.recommendations)
      ? this.recommendations.filter((item) => item && typeof item === "object")
      : [];

    return this.careerRoles
      .map((career) => {
        const skillProgress = career.skills.map((requiredSkill) => {
          const normalizedRequiredSkill = normalizeSkillName(requiredSkill);
          const matchingSkills = studentSkills.filter(
            (item) =>
              normalizeSkillName(item.skillName) === normalizedRequiredSkill
          );

          if (matchingSkills.length === 0) {
            return { percentage: 0, missing: requiredSkill };
          }

          const bestMatch = matchingSkills.reduce(
            (best, item) => {
              const required = toFiniteNumber(item.requiredLevel);
              const current = Math.max(toFiniteNumber(item.currentLevel), 0);
              const percentage =
                required > 0 ? Math.min((current / required) * 100, 100) : 0;

              return percentage > best.percentage
                ? {
                    percentage,
                    missing: current < required ? requiredSkill : null
                  }
                : best;
            },
            { percentage: 0, missing: requiredSkill }
          );

          return bestMatch;
        });

        const matchPercentage = Math.round(
          skillProgress.reduce((total, skill) => total + skill.percentage, 0) /
            career.skills.length
        );

        const missingSkills = skillProgress
          .filter((skill) => skill.missing)
          .map((skill) => skill.missing);

        return {
          ...career,
          matchPercentage,
          matchStyle: `width: ${matchPercentage}%;`,
          matchLabel:
            matchPercentage >= 70
              ? "Strong Match"
              : matchPercentage >= 40
                ? "Moderate Match"
                : "Skills to Develop",
          missingSkills,
          hasMissingSkills: missingSkills.length > 0
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  get hasCareers() {
    return this.suggestedCareers.length > 0;
  }
}
