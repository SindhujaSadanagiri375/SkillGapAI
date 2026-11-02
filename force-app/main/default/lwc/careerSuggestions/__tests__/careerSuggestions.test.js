import { createElement } from "@lwc/engine-dom";
import CareerSuggestions from "c/careerSuggestions";

describe("c-career-suggestions", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders role matches and skills to develop from recommendations", () => {
    const element = createElement("c-career-suggestions", {
      is: CareerSuggestions
    });
    element.recommendations = [
      {
        skillName: " Apex Programming ",
        currentLevel: 2,
        requiredLevel: 4
      },
      { skillName: "SOQL", currentLevel: 1, requiredLevel: 4 },
      {
        skillName: "Lightning Web Components",
        currentLevel: 1,
        requiredLevel: 4
      },
      { skillName: null, currentLevel: 5, requiredLevel: 5 }
    ];
    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      const root = element.shadowRoot;

      expect(root.querySelectorAll(".career-card")).toHaveLength(4);
      expect(root.querySelector(".career-card h3").textContent).toBe(
        "Salesforce Developer"
      );
      expect(root.querySelector(".career-card").textContent).toContain("33%");
      expect(
        root.querySelector(".career-card .missing-skills").textContent
      ).toContain("Apex Programming");
      expect(root.querySelector("c-career-suggestions")).toBeNull();
    });
  });

  it("shows career suggestions with safe zero matches for missing data", () => {
    const element = createElement("c-career-suggestions", {
      is: CareerSuggestions
    });
    element.recommendations = null;
    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      const root = element.shadowRoot;

      expect(root.querySelectorAll(".career-card")).toHaveLength(4);
      expect(root.querySelector(".career-grid").textContent).toContain("0%");
      expect(root.querySelector(".empty-message")).toBeNull();
    });
  });
});
