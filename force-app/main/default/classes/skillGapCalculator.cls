public with sharing class SkillGapCalculator {
  public static Decimal calculateReadiness(
    Map<Id, Decimal> studentLevels,
    Map<Id, Decimal> requiredLevels,
    Map<Id, Decimal> weights
  ) {
    Decimal totalWeightedScore = 0;
    Decimal totalWeight = 0;

    if (requiredLevels == null || requiredLevels.isEmpty()) {
      return 0;
    }

    for (Id skillId : requiredLevels.keySet()) {
      Decimal requiredLevel = requiredLevels.get(skillId);
      Decimal currentLevel = studentLevels != null &&
        studentLevels.containsKey(skillId)
        ? studentLevels.get(skillId)
        : 0;
      Decimal weight = weights != null && weights.containsKey(skillId)
        ? weights.get(skillId)
        : 1;

      if (currentLevel == null) {
        currentLevel = 0;
      }
      if (weight == null) {
        weight = 1;
      }

      if (
        requiredLevel != null &&
        requiredLevel > 0 &&
        weight != null &&
        weight > 0
      ) {
        Decimal achievement = currentLevel / requiredLevel;

        if (achievement > 1) {
          achievement = 1;
        } else if (achievement < 0) {
          achievement = 0;
        }

        totalWeightedScore += achievement * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight == 0) {
      return 0;
    }

    return (totalWeightedScore / totalWeight * 100).setScale(2);
  }
}
