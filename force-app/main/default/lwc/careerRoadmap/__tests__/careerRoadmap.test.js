import { createElement } from "@lwc/engine-dom";
import { createApexTestWireAdapter as mockCreateApexTestWireAdapter } from "@salesforce/sfdx-lwc-jest";
import CareerRoadmap from "c/careerRoadmap";
import getStudentLearningTasks from "@salesforce/apex/SkillGapAnalysisService.getStudentLearningTasks";

jest.mock(
  "@salesforce/apex/SkillGapAnalysisService.getStudentLearningTasks",
  () => ({
    default: mockCreateApexTestWireAdapter(jest.fn())
  }),
  { virtual: true }
);

describe("c-career-roadmap", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders saved learning tasks and ordered recommendations", () => {
    const element = createElement("c-career-roadmap", {
      is: CareerRoadmap
    });
    element.studentId = "student-1";
    element.targetRole = "Salesforce Developer";
    element.recommendations = [
      {
        skillName: "SOQL",
        currentLevel: 1,
        requiredLevel: 4,
        gap: 3,
        priority: "High",
        resourceTitle: "SOQL Guide",
        resourceUrl: "https://example.com/soql"
      },
      {
        skillName: "Lightning Web Components",
        currentLevel: 2,
        requiredLevel: 4,
        gap: 2,
        priority: "Medium"
      }
    ];
    document.body.appendChild(element);

    getStudentLearningTasks.emit([
      {
        Id: "task-1",
        Name: "Learn Apex Basics",
        Description__c: "Practice Apex fundamentals.",
        Due_Date__c: "2000-01-01",
        Status__c: "In Progress",
        Skill__r: { Name: "Apex Programming" }
      }
    ]);

    return Promise.resolve().then(() => {
      const root = element.shadowRoot;

      expect(root.querySelector(".roadmap-subtitle").textContent).toContain(
        "Salesforce Developer"
      );
      expect(root.querySelectorAll(".learning-task")).toHaveLength(1);
      expect(root.querySelector(".learning-task").textContent).toContain(
        "Learn Apex Basics"
      );
      expect(root.querySelector(".learning-task").textContent).toContain(
        "Apex Programming"
      );
      expect(root.querySelector(".task-due").textContent).toContain("Overdue");
      expect(root.querySelectorAll(".roadmap-step")).toHaveLength(2);
      expect(root.querySelector(".roadmap-step h4").textContent).toBe("SOQL");
      expect(root.querySelector(".step-details").textContent.trim()).toBe(
        "Stage: Beginner | 3 levels to improve"
      );
      expect(root.querySelector(".step-action").getAttribute("href")).toBe(
        "https://example.com/soql"
      );
    });
  });

  it("shows an empty task state and handles unavailable recommendations", () => {
    const element = createElement("c-career-roadmap", {
      is: CareerRoadmap
    });
    element.studentId = "student-2";
    element.recommendations = null;
    document.body.appendChild(element);

    getStudentLearningTasks.emit([]);

    return Promise.resolve().then(() => {
      const root = element.shadowRoot;

      expect(root.querySelector(".empty-roadmap").textContent).toContain(
        "No learning tasks"
      );
      expect(root.querySelectorAll(".roadmap-step")).toHaveLength(0);
      expect(root.querySelectorAll(".empty-roadmap")[1].textContent).toContain(
        "Select a student"
      );
    });
  });
});
