import { LightningElement, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import getStudents from "@salesforce/apex/SkillGapAnalysisService.getStudents";
import getStudentSkills from "@salesforce/apex/SkillGapAnalysisService.getStudentSkills";
import calculateStudentReadiness from "@salesforce/apex/SkillGapAnalysisService.calculateStudentReadiness";
import saveStudentAnalysis from "@salesforce/apex/SkillGapAnalysisService.saveStudentAnalysis";
import getSkillRecommendations from "@salesforce/apex/SkillGapAnalysisService.getSkillRecommendations";

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getSkillDisplayKey(skill) {
  const skillName =
    skill.Skill__r && typeof skill.Skill__r.Name === "string"
      ? skill.Skill__r.Name.trim().toLowerCase()
      : "";

  return skillName || skill.Id || skill.Skill__c;
}

export default class SkillGapDashboard extends LightningElement {
  students = [];
  skills = [];
  recommendations = [];
  selectedStudentId;
  readinessScore;
  error;
  isSaving = false;

  learningResources = {
    "Apex Programming": {
      title: "Salesforce Apex Developer Guide",
      url: "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/"
    },
    SOQL: {
      title: "SOQL and SOSL Reference",
      url: "https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/"
    },
    "Lightning Web Components": {
      title: "Lightning Web Components Guide",
      url: "https://developer.salesforce.com/docs/platform/lwc/guide"
    },
    Java: {
      title: "Java Tutorials",
      url: "https://dev.java/learn/"
    },
    Python: {
      title: "Python Official Tutorial",
      url: "https://docs.python.org/3/tutorial/"
    },
    JavaScript: {
      title: "JavaScript Guide",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    }
  };

  @wire(getStudents)
  wiredStudents({ data, error }) {
    if (data) {
      this.students = Array.isArray(data) ? data : [];

      if (this.students.length > 0 && !this.selectedStudentId) {
        this.selectedStudentId = this.students[0].Id;
      }

      this.error = undefined;
    } else if (error) {
      this.students = [];
      this.error = this.getErrorMessage(error);
    }
  }

  @wire(getStudentSkills, { studentId: "$selectedStudentId" })
  wiredSkills({ data, error }) {
    if (data) {
      const uniqueSkills = new Map();
      (Array.isArray(data) ? data : []).forEach((skill) => {
        if (!skill || typeof skill !== "object") {
          return;
        }

        const currentLevel = toFiniteNumber(skill.Current_Level__c);
        const targetLevel = toFiniteNumber(skill.Target_Level__c);

        const progress =
          targetLevel > 0
            ? Math.min(Math.max((currentLevel / targetLevel) * 100, 0), 100)
            : 0;

        const gap = Math.max(targetLevel - currentLevel, 0);
        const relatedSkillName =
          skill.Skill__r && typeof skill.Skill__r.Name === "string"
            ? skill.Skill__r.Name.trim()
            : "";
        const skillName = relatedSkillName || "Unknown Skill";
        const displayKey = getSkillDisplayKey(skill);
        const existingSkill = uniqueSkills.get(displayKey);

        if (!existingSkill) {
          uniqueSkills.set(displayKey, {
            ...skill,
            skillName,
            progressStyle: `width: ${progress}%;`,
            gapMessage:
              targetLevel <= 0
                ? "No target level defined."
                : gap === 0
                  ? "Target achieved!"
                  : `${gap} ${gap === 1 ? "level" : "levels"} remaining to reach target.`
          });
          return;
        }

        const mergedCurrentLevel = Math.max(
          toFiniteNumber(existingSkill.Current_Level__c),
          currentLevel
        );
        const mergedTargetLevel = Math.max(
          toFiniteNumber(existingSkill.Target_Level__c),
          targetLevel
        );
        const mergedGap = Math.max(mergedTargetLevel - mergedCurrentLevel, 0);
        uniqueSkills.set(displayKey, {
          ...existingSkill,
          Current_Level__c: mergedCurrentLevel,
          Target_Level__c: mergedTargetLevel,
          progressStyle:
            mergedTargetLevel > 0
              ? `width: ${Math.min(Math.max((mergedCurrentLevel / mergedTargetLevel) * 100, 0), 100)}%;`
              : "width: 0%;",
          gapMessage:
            mergedTargetLevel <= 0
              ? "No target level defined."
              : mergedGap === 0
                ? "Target achieved!"
                : `${mergedGap} ${mergedGap === 1 ? "level" : "levels"} remaining to reach target.`
        });
      });
      this.skills = [...uniqueSkills.values()];

      this.error = undefined;
    } else if (error) {
      this.skills = [];
      this.error = this.getErrorMessage(error);
    }
  }

  @wire(calculateStudentReadiness, {
    studentId: "$selectedStudentId"
  })
  wiredReadiness({ data, error }) {
    if (data !== undefined) {
      this.readinessScore = data;
      this.error = undefined;
    } else if (error) {
      this.readinessScore = undefined;
      this.error = this.getErrorMessage(error);
    }
  }

  @wire(getSkillRecommendations, {
    studentId: "$selectedStudentId"
  })
  wiredRecommendations({ data, error }) {
    if (data) {
      this.recommendations = data.map((item) => {
        const resource = this.getLearningResource(item.skillName);

        return {
          ...item,
          priorityClass:
            item.priority === "High"
              ? "priority-high"
              : item.priority === "Medium"
                ? "priority-medium"
                : item.priority === "Low"
                  ? "priority-low"
                  : "priority-achieved",
          resourceTitle: resource.title,
          resourceUrl: resource.url
        };
      });

      this.error = undefined;
    } else if (error) {
      this.recommendations = [];
      this.error = this.getErrorMessage(error);
    }
  }

  getLearningResource(skillName) {
    return (
      this.learningResources[skillName] || {
        title: "Explore Salesforce Trailhead",
        url: "https://trailhead.salesforce.com/"
      }
    );
  }

  // Learning Progress Tracker
  get totalSkills() {
    return this.skills.length;
  }

  get completedSkills() {
    return this.skills.filter(
      (skill) =>
        Number(skill.Target_Level__c) > 0 &&
        Number(skill.Current_Level__c || 0) >= Number(skill.Target_Level__c)
    ).length;
  }

  get pendingSkills() {
    return this.skills.filter(
      (skill) =>
        toFiniteNumber(skill.Target_Level__c) > 0 &&
        toFiniteNumber(skill.Current_Level__c) <
          toFiniteNumber(skill.Target_Level__c)
    ).length;
  }

  get overallProgress() {
    const validSkills = this.skills.filter(
      (skill) => Number(skill.Target_Level__c) > 0
    );

    if (validSkills.length === 0) {
      return 0;
    }

    const totalProgress = validSkills.reduce((total, skill) => {
      const current = toFiniteNumber(skill.Current_Level__c);
      const target = toFiniteNumber(skill.Target_Level__c);

      return total + Math.min(Math.max((current / target) * 100, 0), 100);
    }, 0);

    return Math.round(totalProgress / validSkills.length);
  }

  get overallProgressStyle() {
    return `width: ${this.overallProgress}%;`;
  }

  get hasStudents() {
    return this.students.length > 0;
  }

  get hasSkills() {
    return this.skills.length > 0;
  }

  get hasRecommendations() {
    return this.recommendations.length > 0;
  }

  get hasReadinessScore() {
    return this.readinessScore !== undefined && this.readinessScore !== null;
  }

  get studentOptions() {
    return this.students.map((student) => ({
      label: student.Name,
      value: student.Id
    }));
  }

  get selectedTargetRole() {
    const selectedStudent = this.students.find(
      (student) => student.Id === this.selectedStudentId
    );

    return selectedStudent && selectedStudent.Target_Role__c
      ? selectedStudent.Target_Role__c
      : "your target role";
  }

  getErrorMessage(error) {
    if (error && error.body) {
      if (Array.isArray(error.body)) {
        return error.body.map((item) => item.message).join(", ");
      }

      return error.body.message || "An unexpected error occurred.";
    }

    return "An unexpected error occurred.";
  }

  handleStudentChange(event) {
    this.selectedStudentId = event.detail.value;
    this.skills = [];
    this.recommendations = [];
    this.readinessScore = undefined;
    this.error = undefined;
  }

  handleSaveAnalysis() {
    if (!this.selectedStudentId) {
      this.showToast("Warning", "Please select a student first.", "warning");
      return;
    }

    this.isSaving = true;

    saveStudentAnalysis({
      studentId: this.selectedStudentId
    })
      .then(() => {
        this.showToast(
          "Success",
          "Student analysis saved successfully!",
          "success"
        );
      })
      .catch((error) => {
        this.showToast("Error", this.getErrorMessage(error), "error");
      })
      .finally(() => {
        this.isSaving = false;
      });
  }

  showToast(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title,
        message,
        variant
      })
    );
  }
}
