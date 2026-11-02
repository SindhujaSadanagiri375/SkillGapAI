import { createElement } from "@lwc/engine-dom";
import { createApexTestWireAdapter as mockCreateApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import SkillGapDashboard from "c/skillGapDashboard";
import getStudents from "@salesforce/apex/SkillGapAnalysisService.getStudents";
import getStudentSkills from "@salesforce/apex/SkillGapAnalysisService.getStudentSkills";
import calculateStudentReadiness from "@salesforce/apex/SkillGapAnalysisService.calculateStudentReadiness";
import getSkillRecommendations from "@salesforce/apex/SkillGapAnalysisService.getSkillRecommendations";
import getStudentLearningTasks from "@salesforce/apex/SkillGapAnalysisService.getStudentLearningTasks";

jest.mock(
  "@salesforce/apex/SkillGapAnalysisService.getStudents",
  () => ({ default: mockCreateApexTestWireAdapter(jest.fn()) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SkillGapAnalysisService.getStudentSkills",
  () => ({ default: mockCreateApexTestWireAdapter(jest.fn()) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SkillGapAnalysisService.calculateStudentReadiness",
  () => ({ default: mockCreateApexTestWireAdapter(jest.fn()) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SkillGapAnalysisService.getSkillRecommendations",
  () => ({ default: mockCreateApexTestWireAdapter(jest.fn()) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SkillGapAnalysisService.getStudentLearningTasks",
  () => ({ default: mockCreateApexTestWireAdapter(jest.fn()) }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/SkillGapAnalysisService.saveStudentAnalysis",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

function flushPromises() {
  return Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => Promise.resolve());
}

describe("c-skill-gap-dashboard", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("deduplicates identical skill displays and renders career components", async () => {
    const element = createElement("c-skill-gap-dashboard", {
      is: SkillGapDashboard
    });
    document.body.appendChild(element);

    getStudents.emit([
      {
        Id: "student-1",
        Name: "Sindhuja Demo",
        Target_Role__c: "Salesforce Developer"
      }
    ]);
    await flushPromises();

    getStudentSkills.emit([
      {
        Id: "student-skill-1",
        Skill__c: "skill-1",
        Current_Level__c: 2,
        Target_Level__c: 4,
        Skill__r: { Name: "Apex Programming" }
      },
      {
        Id: "student-skill-2",
        Skill__c: "skill-2",
        Current_Level__c: 1,
        Target_Level__c: 5,
        Skill__r: { Name: "Apex Programming" }
      },
      {
        Id: "student-skill-3",
        Skill__c: "skill-3",
        Current_Level__c: 4,
        Target_Level__c: 4,
        Skill__r: { Name: "SOQL" }
      }
    ]);
    calculateStudentReadiness.emit(50);
    getSkillRecommendations.emit([
      {
        skillName: "Apex Programming",
        currentLevel: 2,
        requiredLevel: 4,
        gap: 2,
        priority: "Medium"
      }
    ]);
    getStudentLearningTasks.emit([]);
    await flushPromises();

    const root = element.shadowRoot;
    const analytics = root.querySelector("c-student-analytics");

    expect(root.querySelectorAll(".skill-card")).toHaveLength(2);
    expect(
      [...root.querySelectorAll(".skill-card .skill-name")].filter(
        (node) => node.textContent.trim() === "Apex Programming"
      )
    ).toHaveLength(1);
    expect(analytics.shadowRoot.querySelectorAll(".skill-row")).toHaveLength(2);
    expect(
      [...root.querySelectorAll(".skill-card")].find((card) =>
        card.textContent.includes("Apex Programming")
      ).textContent
    ).toContain("Current: 2 | Target: 5");
    expect(
      [...root.querySelectorAll(".skill-card")]
        .find((card) => card.textContent.includes("Apex Programming"))
        .querySelector(".skill-status").textContent
    ).toBe("3 levels remaining to reach target.");
    expect(root.textContent).toContain("Overall Skill Proficiency");
    expect(root.textContent).not.toContain("Overall Learning Progress");
    expect(root.querySelector("c-career-roadmap")).not.toBeNull();
    expect(root.querySelector("c-career-suggestions")).not.toBeNull();
    expect(
      root
        .querySelector("c-career-suggestions")
        .shadowRoot.querySelectorAll(".career-card")
    ).toHaveLength(4);
  });
});
