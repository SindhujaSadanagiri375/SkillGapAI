import { LightningElement, api, wire } from "lwc";
import getStudentLearningTasks from "@salesforce/apex/SkillGapAnalysisService.getStudentLearningTasks";

export default class CareerRoadmap extends LightningElement {
  @api targetRole = "your target role";
  @api studentId;
  @api recommendations = [];

  learningTasks = [];
  taskError;

  @wire(getStudentLearningTasks, { studentId: "$studentId" })
  wiredLearningTasks({ data, error }) {
    if (data) {
      const today = new Date().toISOString().slice(0, 10);
      this.learningTasks = Array.isArray(data)
        ? data
            .filter((task) => task && typeof task === "object")
            .map((task) => {
              const dueDate = task.Due_Date__c || "";
              const status = task.Status__c || "Not Started";
              const isOverdue =
                Boolean(dueDate) && dueDate < today && status !== "Completed";
              const statusClass =
                status === "Completed"
                  ? "task-status status-completed"
                  : status === "In Progress"
                    ? "task-status status-in-progress"
                    : "task-status status-not-started";

              return {
                id: task.Id,
                name: task.Name || "Untitled learning task",
                description: task.Description__c || "",
                skillName:
                  task.Skill__r && task.Skill__r.Name ? task.Skill__r.Name : "",
                status,
                statusClass,
                dueDate,
                isOverdue,
                dueDateClass: isOverdue ? "task-due overdue" : "task-due"
              };
            })
        : [];
      this.taskError = undefined;
    } else if (error) {
      this.learningTasks = [];
      this.taskError = this.getErrorMessage(error);
    }
  }

  get roadmapSteps() {
    if (!Array.isArray(this.recommendations)) {
      return [];
    }

    return this.recommendations
      .filter(
        (item) => item && typeof item === "object" && Number(item.gap) > 0
      )
      .sort((a, b) => {
        const priorityOrder = {
          High: 1,
          Medium: 2,
          Low: 3
        };

        return (
          (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
        );
      })
      .map((item, index) => ({
        id: `${item.skillName || "skill"}-${index}`,
        skillName: item.skillName || "Unknown skill",
        currentLevel: item.currentLevel,
        requiredLevel: item.requiredLevel,
        gap: item.gap,
        gapLabel: `${item.gap} ${Number(item.gap) === 1 ? "level" : "levels"} to improve`,
        priority: item.priority,
        stepNumber: index + 1,
        stage:
          Number(item.currentLevel) <= 1
            ? "Beginner"
            : Number(item.currentLevel) < Number(item.requiredLevel)
              ? "Intermediate"
              : "Advanced",
        description: `Improve ${item.skillName} from level ${item.currentLevel} to level ${item.requiredLevel}.`,
        resourceTitle: item.resourceTitle,
        resourceUrl: item.resourceUrl
      }));
  }

  get hasRoadmap() {
    return this.roadmapSteps.length > 0;
  }

  get hasLearningTasks() {
    return this.learningTasks.length > 0;
  }

  get hasTaskError() {
    return Boolean(this.taskError);
  }

  get noRoadmapMessage() {
    return Array.isArray(this.recommendations) &&
      this.recommendations.length > 0
      ? "Great job! You have achieved all your required skill levels."
      : "Select a student to generate a career roadmap.";
  }

  getErrorMessage(error) {
    if (error && error.body) {
      if (Array.isArray(error.body)) {
        return error.body.map((item) => item.message).join(", ");
      }

      return error.body.message || "Unable to load learning tasks.";
    }

    return "Unable to load learning tasks.";
  }
}
