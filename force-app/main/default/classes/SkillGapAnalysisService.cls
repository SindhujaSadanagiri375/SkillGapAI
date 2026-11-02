public with sharing class SkillGapAnalysisService {
  // Get all student profiles
  @AuraEnabled(cacheable=true)
  public static List<Student_Profile__c> getStudents() {
    return [
      SELECT Id, Name, Target_Role__c
      FROM Student_Profile__c
      ORDER BY Name
      LIMIT 100
    ];
  }

  // Get skills belonging to a student
  @AuraEnabled(cacheable=true)
  public static List<Student_Skill__c> getStudentSkills(Id studentId) {
    if (studentId == null) {
      return new List<Student_Skill__c>();
    }

    return [
      SELECT Id, Skill__c, Skill__r.Name, Current_Level__c, Target_Level__c
      FROM Student_Skill__c
      WHERE Student_Profile__c = :studentId
      ORDER BY Skill__r.Name, Id
    ];
  }

  // Get learning tasks assigned to a student
  @AuraEnabled(cacheable=true)
  public static List<Learning_Task__c> getStudentLearningTasks(Id studentId) {
    if (studentId == null) {
      return new List<Learning_Task__c>();
    }

    return [
      SELECT
        Id,
        Name,
        Description__c,
        Due_Date__c,
        Status__c,
        Skill__c,
        Skill__r.Name
      FROM Learning_Task__c
      WHERE Student_Profile__c = :studentId
      ORDER BY Due_Date__c ASC NULLS LAST, Name ASC
    ];
  }

  // Calculate overall readiness
  @AuraEnabled(cacheable=true)
  public static Decimal calculateStudentReadiness(Id studentId) {
    AnalysisData analysis = buildAnalysis(studentId);
    return analysis.readinessScore;
  }

  // Get personalized skill recommendations
  @AuraEnabled(cacheable=true)
  public static List<Map<String, Object>> getSkillRecommendations(
    Id studentId
  ) {
    List<Map<String, Object>> recommendations = new List<Map<String, Object>>();

    if (studentId == null) {
      return recommendations;
    }

    AnalysisData analysis = buildAnalysis(studentId);

    if (analysis.jobRoleId == null) {
      return recommendations;
    }

    List<String> skillNames = new List<String>(
      analysis.requirementsBySkillName.keySet()
    );
    skillNames.sort();

    for (String normalizedSkillName : skillNames) {
      RequirementData requirement = analysis.requirementsBySkillName.get(
        normalizedSkillName
      );
      Decimal currentLevel = analysis.currentLevelsBySkillName.containsKey(
          normalizedSkillName
        )
        ? analysis.currentLevelsBySkillName.get(normalizedSkillName)
        : 0;
      Decimal requiredLevel = requirement.requiredLevel;
      Decimal gap = requiredLevel - currentLevel;

      String priority;

      if (gap <= 0) {
        priority = 'Achieved';
        gap = 0;
      } else if (gap >= 3) {
        priority = 'High';
      } else if (gap >= 2) {
        priority = 'Medium';
      } else {
        priority = 'Low';
      }

      Map<String, Object> recommendation = new Map<String, Object>();

      recommendation.put('skillName', requirement.skillName);

      recommendation.put('currentLevel', currentLevel);
      recommendation.put('requiredLevel', requiredLevel);
      recommendation.put('gap', gap);
      recommendation.put('priority', priority);

      recommendations.add(recommendation);
    }

    return recommendations;
  }

  // Save skill-gap analysis
  @AuraEnabled
  public static Id saveStudentAnalysis(Id studentId) {
    if (studentId == null) {
      throw new AuraHandledException('Please select a student.');
    }

    AnalysisData analysis = buildAnalysis(studentId);

    if (analysis.jobRoleId == null) {
      throw new AuraHandledException(
        'No matching job role found. Check the student target role and Job Role record name.'
      );
    }

    if (!analysis.hasRequirements) {
      throw new AuraHandledException(
        'No valid skill requirements found for this job role.'
      );
    }

    Student_Profile__c student = [
      SELECT Name
      FROM Student_Profile__c
      WHERE Id = :studentId
      LIMIT 1
    ];

    Skill_Gap_Result__c result = new Skill_Gap_Result__c();

    result.Name =
      'Analysis - ' +
      student.Name +
      ' - ' +
      DateTime.now().format('yyyy-MM-dd HH:mm');

    result.Student_Profile__c = studentId;
    result.Job_Role__c = analysis.jobRoleId;
    result.Analysis_Date__c = Date.today();
    result.Readiness_Score__c = analysis.readinessScore;
    result.Gap_Details__c = analysis.gapDetails;

    insert result;

    return result.Id;
  }

  // Analysis data container
  private class AnalysisData {
    Decimal readinessScore = 0;
    String gapDetails = 'No skill gaps found.';
    Id jobRoleId;
    Boolean hasRequirements = false;
    List<Id> jobRoleIds = new List<Id>();
    Map<String, RequirementData> requirementsBySkillName = new Map<String, RequirementData>();
    Map<String, Decimal> currentLevelsBySkillName = new Map<String, Decimal>();
  }

  private class RequirementData {
    String skillName;
    Id skillId;
    Decimal requiredLevel;
    Decimal weight;
  }

  private static String normalizeSkillName(String skillName) {
    return String.isBlank(skillName) ? null : skillName.trim().toLowerCase();
  }

  // Build student skill-gap analysis
  private static AnalysisData buildAnalysis(Id studentId) {
    AnalysisData result = new AnalysisData();

    if (studentId == null) {
      return result;
    }

    List<Student_Profile__c> students = [
      SELECT Id, Target_Role__c
      FROM Student_Profile__c
      WHERE Id = :studentId
      LIMIT 1
    ];

    if (students.isEmpty() || String.isBlank(students[0].Target_Role__c)) {
      return result;
    }

    String targetRole = students[0].Target_Role__c;

    List<Job_Role__c> roles = [
      SELECT Id, Name
      FROM Job_Role__c
      WHERE Name = :targetRole
      ORDER BY CreatedDate ASC, Id ASC
    ];

    if (roles.isEmpty()) {
      return result;
    }

    for (Job_Role__c role : roles) {
      result.jobRoleIds.add(role.Id);
    }
    result.jobRoleId = roles[0].Id;

    Map<Id, Decimal> studentLevels = new Map<Id, Decimal>();

    Map<Id, Decimal> requiredLevels = new Map<Id, Decimal>();

    Map<Id, Decimal> weights = new Map<Id, Decimal>();

    List<String> gaps = new List<String>();

    for (Student_Skill__c studentSkill : [
      SELECT Skill__c, Skill__r.Name, Current_Level__c
      FROM Student_Skill__c
      WHERE Student_Profile__c = :studentId
    ]) {
      String normalizedSkillName = normalizeSkillName(
        studentSkill.Skill__r.Name
      );
      if (studentSkill.Skill__c != null && normalizedSkillName != null) {
        Decimal currentLevel = studentSkill.Current_Level__c == null
          ? 0
          : studentSkill.Current_Level__c;
        Decimal existingLevel = result.currentLevelsBySkillName.get(
          normalizedSkillName
        );

        if (existingLevel == null || currentLevel > existingLevel) {
          result.currentLevelsBySkillName.put(
            normalizedSkillName,
            currentLevel
          );
        }

        studentLevels.put(studentSkill.Skill__c, currentLevel);
      }
    }

    for (Role_Skill_Requirement__c requirement : [
      SELECT Skill__c, Required_Level__c, Weight__c, Skill__r.Name
      FROM Role_Skill_Requirement__c
      WHERE Job_Role__c IN :result.jobRoleIds
    ]) {
      if (
        requirement.Skill__c == null ||
        requirement.Required_Level__c == null ||
        requirement.Required_Level__c <= 0
      ) {
        continue;
      }

      String normalizedSkillName = normalizeSkillName(
        requirement.Skill__r.Name
      );
      if (normalizedSkillName == null) {
        continue;
      }
      Decimal weight = requirement.Weight__c == null
        ? 1
        : requirement.Weight__c;

      RequirementData groupedRequirement = result.requirementsBySkillName.get(
        normalizedSkillName
      );
      if (groupedRequirement == null) {
        groupedRequirement = new RequirementData();
        groupedRequirement.skillName = requirement.Skill__r.Name;
        groupedRequirement.skillId = requirement.Skill__c;
        groupedRequirement.requiredLevel = requirement.Required_Level__c;
        groupedRequirement.weight = weight;
        result.requirementsBySkillName.put(
          normalizedSkillName,
          groupedRequirement
        );
      } else {
        if (requirement.Required_Level__c > groupedRequirement.requiredLevel) {
          groupedRequirement.requiredLevel = requirement.Required_Level__c;
          groupedRequirement.skillId = requirement.Skill__c;
          groupedRequirement.skillName = requirement.Skill__r.Name;
        }
        if (weight > groupedRequirement.weight) {
          groupedRequirement.weight = weight;
        }
      }
    }

    result.hasRequirements = !result.requirementsBySkillName.isEmpty();

    if (!result.hasRequirements) {
      result.gapDetails = 'No valid skill requirements are configured for this role.';
      return result;
    }

    List<String> normalizedSkillNames = new List<String>(
      result.requirementsBySkillName.keySet()
    );
    normalizedSkillNames.sort();

    for (String normalizedSkillName : normalizedSkillNames) {
      RequirementData requirement = result.requirementsBySkillName.get(
        normalizedSkillName
      );
      Decimal currentLevel = result.currentLevelsBySkillName.containsKey(
          normalizedSkillName
        )
        ? result.currentLevelsBySkillName.get(normalizedSkillName)
        : 0;

      studentLevels.put(requirement.skillId, currentLevel);
      requiredLevels.put(requirement.skillId, requirement.requiredLevel);
      weights.put(requirement.skillId, requirement.weight);

      if (currentLevel < requirement.requiredLevel) {
        gaps.add(
          requirement.skillName +
            ': Current level ' +
            currentLevel +
            ', required level ' +
            requirement.requiredLevel
        );
      }
    }

    result.readinessScore = SkillGapCalculator.calculateReadiness(
      studentLevels,
      requiredLevels,
      weights
    );

    if (!gaps.isEmpty()) {
      result.gapDetails = String.join(gaps, '\n');
    }

    return result;
  }
}
