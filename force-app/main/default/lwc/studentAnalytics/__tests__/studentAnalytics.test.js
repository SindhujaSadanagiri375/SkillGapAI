import { createElement } from "@lwc/engine-dom";
import StudentAnalytics from "c/studentAnalytics";

describe("c-student-analytics", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("shows readiness and skill analytics for the supplied student records", () => {
    const element = createElement("c-student-analytics", {
      is: StudentAnalytics
    });
    element.skills = [
      {
        Id: "skill-1",
        Current_Level__c: 5,
        Target_Level__c: 5,
        Skill__r: { Name: "Apex" }
      },
      {
        Id: "skill-2",
        Current_Level__c: 2,
        Target_Level__c: 4,
        Skill__r: { Name: "SOQL" }
      },
      {
        Id: "skill-3",
        Current_Level__c: 1,
        Target_Level__c: 4,
        Skill__r: { Name: "LWC" }
      },
      {
        Id: "skill-4",
        Current_Level__c: 3,
        Target_Level__c: 0,
        Skill__r: { Name: "Unspecified target" }
      }
    ];
    element.readinessScore = 72;

    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      const root = element.shadowRoot;

      expect(root.querySelector(".readiness-score").textContent).toContain(
        "72"
      );
      expect(root.querySelector(".readiness-heading h2").textContent).toBe(
        "Almost Ready"
      );
      expect(
        [...root.querySelectorAll(".summary-value")].map((node) =>
          node.textContent.trim()
        )
      ).toEqual(["4", "1", "2", "58%"]);
      expect(root.querySelector(".highlights").textContent).toContain("Apex");
      expect(root.querySelector(".highlights").textContent).toContain("LWC");
      expect(root.querySelectorAll(".skill-row")).toHaveLength(4);
      expect(
        root.querySelectorAll(".skill-details")[1].textContent.trim()
      ).toBe("Current: 2 / Target: 4 | 2 levels remaining.");
      expect(
        root.querySelectorAll(".skill-details")[0].textContent.trim()
      ).toBe("Current: 5 / Target: 5 | Target achieved.");
      expect(
        root
          .querySelector('[aria-label="Skill completion"]')
          .getAttribute("aria-valuenow")
      ).toBe("33");
      expect(
        root.querySelector(".readiness-track").getAttribute("aria-valuenow")
      ).toBe("72");
    });
  });

  it("shows an empty state and safe values when skill data is missing", () => {
    const element = createElement("c-student-analytics", {
      is: StudentAnalytics
    });
    element.skills = null;
    element.readinessScore = 140;

    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      const root = element.shadowRoot;

      expect(root.querySelector(".empty-state").textContent).toContain(
        "No skill data"
      );
      expect(root.querySelectorAll(".skill-row")).toHaveLength(0);
      expect(root.querySelector(".readiness-score").textContent).toContain(
        "100"
      );
      expect(root.querySelector(".readiness-heading h2").textContent).toBe(
        "Job Ready"
      );
      expect(root.querySelector(".highlights").textContent).toContain(
        "Not available"
      );
      expect(
        [...root.querySelectorAll(".summary-value")].map((node) =>
          node.textContent.trim()
        )
      ).toEqual(["0", "0", "0", "0%"]);
    });
  });

  it("shows duplicate skill names once using the highest observed levels", () => {
    const element = createElement("c-student-analytics", {
      is: StudentAnalytics
    });
    element.skills = [
      {
        Id: "student-skill-1",
        Current_Level__c: 2,
        Target_Level__c: 4,
        Skill__r: { Name: "Apex Programming" }
      },
      {
        Id: "student-skill-2",
        Current_Level__c: 1,
        Target_Level__c: 5,
        Skill__r: { Name: " apex programming " }
      }
    ];

    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      const root = element.shadowRoot;

      expect(root.querySelectorAll(".skill-row")).toHaveLength(1);
      expect(root.querySelector(".skill-heading h3").textContent).toBe(
        "Apex Programming"
      );
      expect(root.querySelector(".skill-details").textContent.trim()).toBe(
        "Current: 2 / Target: 5 | 3 levels remaining."
      );
      expect(
        [...root.querySelectorAll(".summary-value")].map((node) =>
          node.textContent.trim()
        )[0]
      ).toBe("1");
    });
  });

  it("uses a visible fallback name instead of rendering a blank skill row", () => {
    const element = createElement("c-student-analytics", {
      is: StudentAnalytics
    });
    element.skills = [
      {
        Id: "student-skill-blank-name",
        Current_Level__c: 2,
        Target_Level__c: 4,
        Skill__r: { Name: "   " }
      }
    ];

    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      const root = element.shadowRoot;

      expect(root.querySelectorAll(".skill-row")).toHaveLength(1);
      expect(root.querySelector(".skill-heading h3").textContent).toBe(
        "Unknown Skill"
      );
    });
  });
});
