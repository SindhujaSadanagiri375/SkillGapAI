import { LightningElement, api } from "lwc";

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getProficiencyRatio(skill) {
  const target = toFiniteNumber(skill.Target_Level__c);

  if (target <= 0) {
    return 0;
  }

  return Math.min(
    Math.max(toFiniteNumber(skill.Current_Level__c) / target, 0),
    1
  );
}

function getSkillName(skill) {
  const name =
    skill.Skill__r && typeof skill.Skill__r.Name === "string"
      ? skill.Skill__r.Name.trim()
      : "";

  return name || "Unknown Skill";
}

export default class StudentAnalytics extends LightningElement {
  @api skills = [];
  @api readinessScore = 0;

  get skillRecords() {
    if (!Array.isArray(this.skills)) {
      return [];
    }

    const uniqueSkills = new Map();
    this.skills.forEach((skill, index) => {
      if (!skill || typeof skill !== "object") {
        return;
      }

      const relatedSkillName =
        skill.Skill__r && typeof skill.Skill__r.Name === "string"
          ? skill.Skill__r.Name.trim().toLowerCase()
          : "";
      const key =
        relatedSkillName ||
        skill.Skill__c ||
        skill.Id ||
        `unidentified-${index}`;
      const existingSkill = uniqueSkills.get(key);

      if (!existingSkill) {
        uniqueSkills.set(key, skill);
        return;
      }

      uniqueSkills.set(key, {
        ...existingSkill,
        Current_Level__c: Math.max(
          toFiniteNumber(existingSkill.Current_Level__c),
          toFiniteNumber(skill.Current_Level__c)
        ),
        Target_Level__c: Math.max(
          toFiniteNumber(existingSkill.Target_Level__c),
          toFiniteNumber(skill.Target_Level__c)
        )
      });
    });

    return [...uniqueSkills.values()];
  }

  get totalSkills() {
    return this.skillRecords.length;
  }

  get hasSkills() {
    return this.totalSkills > 0;
  }

  get validSkills() {
    return this.skillRecords.filter(
      (skill) => toFiniteNumber(skill.Target_Level__c) > 0
    );
  }

  get completedSkills() {
    return this.validSkills.filter(
      (skill) =>
        toFiniteNumber(skill.Current_Level__c) >=
        toFiniteNumber(skill.Target_Level__c)
    ).length;
  }

  get pendingSkills() {
    return this.validSkills.filter(
      (skill) =>
        toFiniteNumber(skill.Current_Level__c) <
        toFiniteNumber(skill.Target_Level__c)
    ).length;
  }

  get averageProficiency() {
    if (this.validSkills.length === 0) {
      return 0;
    }

    const total = this.validSkills.reduce((sum, skill) => {
      return sum + getProficiencyRatio(skill) * 100;
    }, 0);

    return Math.round(total / this.validSkills.length);
  }

  get strongestSkill() {
    return this.getRankedSkill(true);
  }

  get weakestSkill() {
    return this.getRankedSkill(false);
  }

  get readinessScoreValue() {
    return Math.round(
      Math.min(Math.max(toFiniteNumber(this.readinessScore), 0), 100)
    );
  }

  get readinessCategory() {
    const score = this.readinessScoreValue;

    if (score >= 80) {
      return "Job Ready";
    }

    if (score >= 60) {
      return "Almost Ready";
    }

    if (score >= 40) {
      return "Developing";
    }

    return "Needs Improvement";
  }

  get readinessStyle() {
    return `width: ${this.readinessScoreValue}%;`;
  }

  get completionPercentage() {
    if (this.validSkills.length === 0) {
      return 0;
    }

    return Math.round((this.completedSkills / this.validSkills.length) * 100);
  }

  get completionStyle() {
    return `width: ${this.completionPercentage}%;`;
  }

  get skillRows() {
    return this.skillRecords.map((skill, index) => {
      const current = toFiniteNumber(skill.Current_Level__c);
      const target = toFiniteNumber(skill.Target_Level__c);
      const percentage = getProficiencyRatio(skill) * 100;
      const remaining = Math.max(target - current, 0);
      const status =
        target <= 0
          ? "Target level not defined."
          : remaining === 0
            ? "Target achieved."
            : `${remaining} ${remaining === 1 ? "level" : "levels"} remaining.`;

      return {
        id: skill.Id || skill.Skill__c || `skill-${index}`,
        name: getSkillName(skill),
        currentLevel: current,
        targetLevel: target,
        summary:
          target > 0
            ? `Current: ${current} / Target: ${target} | ${status}`
            : `Current: ${current} / Target: not set | ${status}`,
        progressPercentage: Math.round(percentage),
        progressStyle: `width: ${percentage}%;`
      };
    });
  }

  getRankedSkill(strongest) {
    if (this.validSkills.length === 0) {
      return "Not available";
    }

    const rankedSkills = [...this.validSkills].sort((a, b) => {
      const aProgress = getProficiencyRatio(a);
      const bProgress = getProficiencyRatio(b);

      return strongest ? bProgress - aProgress : aProgress - bProgress;
    });

    return getSkillName(rankedSkills[0]);
  }
}
