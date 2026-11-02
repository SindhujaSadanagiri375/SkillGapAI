@IsTest
private class SkillGapAnalysisServiceTest {
  private static final String ROLE_NAME = 'Salesforce Developer';

  @TestSetup
  static void createTestData() {
    List<Skill__c> skills = new List<Skill__c>{
      new Skill__c(Name = 'Apex'),
      new Skill__c(Name = 'SOQL'),
      new Skill__c(Name = 'Lightning Web Components'),
      new Skill__c(Name = 'Python'),
      new Skill__c(Name = 'Java'),
      new Skill__c(Name = 'No Target'),
      new Skill__c(Name = 'Apex')
    };
    insert skills;

    Student_Profile__c student = new Student_Profile__c(
      Name = 'Analytics Test Student',
      Target_Role__c = ROLE_NAME
    );
    Student_Profile__c blankTargetStudent = new Student_Profile__c(
      Name = 'Blank Target Student'
    );
    Student_Profile__c missingRoleStudent = new Student_Profile__c(
      Name = 'Missing Role Student',
      Target_Role__c = 'Bussiness Analyst'
    );
    Student_Profile__c noRequirementsStudent = new Student_Profile__c(
      Name = 'No Requirements Student',
      Target_Role__c = 'Data Analyst'
    );
    insert new List<Student_Profile__c>{
      student,
      blankTargetStudent,
      missingRoleStudent,
      noRequirementsStudent
    };

    Job_Role__c role = new Job_Role__c(Name = ROLE_NAME);
    Job_Role__c duplicateRole = new Job_Role__c(Name = ROLE_NAME);
    Job_Role__c roleWithoutRequirements = new Job_Role__c(
      Name = 'Data Analyst'
    );
    insert new List<Job_Role__c>{
      role,
      duplicateRole,
      roleWithoutRequirements
    };

    insert new List<Student_Skill__c>{
      new Student_Skill__c(
        Name = 'Apex Progress',
        Student_Profile__c = student.Id,
        Skill__c = skills[0].Id,
        Current_Level__c = 5,
        Target_Level__c = 4
      ),
      new Student_Skill__c(
        Name = 'SOQL Progress',
        Student_Profile__c = student.Id,
        Skill__c = skills[1].Id,
        Current_Level__c = 1,
        Target_Level__c = 4
      ),
      new Student_Skill__c(
        Name = 'LWC Progress',
        Student_Profile__c = student.Id,
        Skill__c = skills[2].Id,
        Current_Level__c = 2,
        Target_Level__c = 4
      ),
      new Student_Skill__c(
        Name = 'Python Progress',
        Student_Profile__c = student.Id,
        Skill__c = skills[3].Id,
        Current_Level__c = 3,
        Target_Level__c = 4
      ),
      new Student_Skill__c(
        Name = 'Java Progress',
        Student_Profile__c = student.Id,
        Skill__c = skills[4].Id,
        Target_Level__c = 4
      ),
      new Student_Skill__c(
        Name = 'Duplicate Apex Progress',
        Student_Profile__c = student.Id,
        Skill__c = skills[6].Id,
        Current_Level__c = 5,
        Target_Level__c = 4
      )
    };

    insert new Learning_Task__c(
      Name = 'Learn Apex Basics',
      Student_Profile__c = student.Id,
      Skill__c = skills[6].Id,
      Status__c = 'In Progress',
      Due_Date__c = Date.today().addDays(-1),
      Description__c = 'Practice Apex fundamentals.'
    );

    insert new List<Role_Skill_Requirement__c>{
      new Role_Skill_Requirement__c(
        Name = 'Apex Requirement',
        Job_Role__c = role.Id,
        Skill__c = skills[0].Id,
        Required_Level__c = 4,
        Weight__c = 1
      ),
      new Role_Skill_Requirement__c(
        Name = 'SOQL Requirement',
        Job_Role__c = role.Id,
        Skill__c = skills[1].Id,
        Required_Level__c = 4,
        Weight__c = 1
      ),
      new Role_Skill_Requirement__c(
        Name = 'LWC Requirement',
        Job_Role__c = duplicateRole.Id,
        Skill__c = skills[2].Id,
        Required_Level__c = 4,
        Weight__c = 1
      ),
      new Role_Skill_Requirement__c(
        Name = 'Python Requirement',
        Job_Role__c = duplicateRole.Id,
        Skill__c = skills[3].Id,
        Required_Level__c = 4,
        Weight__c = 1
      ),
      new Role_Skill_Requirement__c(
        Name = 'Java Requirement',
        Job_Role__c = duplicateRole.Id,
        Skill__c = skills[4].Id,
        Required_Level__c = 5,
        Weight__c = 1
      ),
      new Role_Skill_Requirement__c(
        Name = 'No Target Requirement',
        Job_Role__c = role.Id,
        Skill__c = skills[5].Id,
        Required_Level__c = 0,
        Weight__c = 1
      ),
      new Role_Skill_Requirement__c(
        Name = 'Duplicate Apex Requirement',
        Job_Role__c = duplicateRole.Id,
        Skill__c = skills[6].Id,
        Required_Level__c = 4,
        Weight__c = 1
      )
    };
  }

  @IsTest
  static void returnsStudentAndSkillRecords() {
    Student_Profile__c student = getStudent('Analytics Test Student');

    Test.startTest();
    List<Student_Profile__c> students = SkillGapAnalysisService.getStudents();
    List<Student_Skill__c> noSkills = SkillGapAnalysisService.getStudentSkills(
      null
    );
    List<Student_Skill__c> skills = SkillGapAnalysisService.getStudentSkills(
      student.Id
    );
    List<Learning_Task__c> noTasks = SkillGapAnalysisService.getStudentLearningTasks(
      null
    );
    List<Learning_Task__c> tasks = SkillGapAnalysisService.getStudentLearningTasks(
      student.Id
    );
    Test.stopTest();

    System.assert(students.size() >= 4, 'Student profiles should be returned.');
    System.assertEquals(
      0,
      noSkills.size(),
      'A null student should return no skills.'
    );
    System.assertEquals(
      6,
      skills.size(),
      'All student skill records should be returned.'
    );
    System.assertEquals('Apex', skills[0].Skill__r.Name);
    System.assertEquals(0, noTasks.size());
    System.assertEquals(1, tasks.size());
    System.assertEquals('Learn Apex Basics', tasks[0].Name);
    System.assertEquals('Apex', tasks[0].Skill__r.Name);
    System.assertEquals('In Progress', tasks[0].Status__c);
  }

  @IsTest
  static void calculatesReadinessForValidAndInvalidStudentData() {
    Student_Profile__c student = getStudent('Analytics Test Student');
    Student_Profile__c blankTarget = getStudent('Blank Target Student');
    Student_Profile__c missingRole = getStudent('Missing Role Student');
    Student_Profile__c noRequirements = getStudent('No Requirements Student');

    Test.startTest();
    Decimal nullStudentScore = SkillGapAnalysisService.calculateStudentReadiness(
      null
    );
    Decimal blankTargetScore = SkillGapAnalysisService.calculateStudentReadiness(
      blankTarget.Id
    );
    Decimal missingRoleScore = SkillGapAnalysisService.calculateStudentReadiness(
      missingRole.Id
    );
    Decimal noRequirementsScore = SkillGapAnalysisService.calculateStudentReadiness(
      noRequirements.Id
    );
    Decimal readiness = SkillGapAnalysisService.calculateStudentReadiness(
      student.Id
    );
    Test.stopTest();

    System.assertEquals(0, nullStudentScore);
    System.assertEquals(0, blankTargetScore);
    System.assertEquals(0, missingRoleScore);
    System.assertEquals(0, noRequirementsScore);
    System.assertEquals(
      Decimal.valueOf('50.00'),
      readiness,
      'Readiness should be the weighted average of all required skills.'
    );
  }

  @IsTest
  static void returnsRecommendationsWithCorrectPriorities() {
    Student_Profile__c student = getStudent('Analytics Test Student');
    Student_Profile__c blankTarget = getStudent('Blank Target Student');

    Test.startTest();
    List<Map<String, Object>> noStudentRecommendations = SkillGapAnalysisService.getSkillRecommendations(
      null
    );
    List<Map<String, Object>> noRoleRecommendations = SkillGapAnalysisService.getSkillRecommendations(
      blankTarget.Id
    );
    List<Map<String, Object>> recommendations = SkillGapAnalysisService.getSkillRecommendations(
      student.Id
    );
    Test.stopTest();

    System.assertEquals(0, noStudentRecommendations.size());
    System.assertEquals(0, noRoleRecommendations.size());
    System.assertEquals(5, recommendations.size());

    Map<String, String> prioritiesBySkill = new Map<String, String>();
    for (Map<String, Object> recommendation : recommendations) {
      prioritiesBySkill.put(
        (String) recommendation.get('skillName'),
        (String) recommendation.get('priority')
      );
    }

    System.assertEquals('Achieved', prioritiesBySkill.get('Apex'));
    System.assertEquals('High', prioritiesBySkill.get('SOQL'));
    System.assertEquals(
      'Medium',
      prioritiesBySkill.get('Lightning Web Components')
    );
    System.assertEquals('Low', prioritiesBySkill.get('Python'));
    System.assertEquals('High', prioritiesBySkill.get('Java'));
  }

  @IsTest
  static void savesAnalysisAndRejectsUnsupportedScenarios() {
    Student_Profile__c student = getStudent('Analytics Test Student');
    Student_Profile__c missingRole = getStudent('Missing Role Student');
    Student_Profile__c noRequirements = getStudent('No Requirements Student');

    Test.startTest();
    Boolean rejectedNullStudent = false;
    try {
      SkillGapAnalysisService.saveStudentAnalysis(null);
    } catch (AuraHandledException exceptionValue) {
      rejectedNullStudent = true;
    }

    Boolean rejectedMissingRole = false;
    try {
      SkillGapAnalysisService.saveStudentAnalysis(missingRole.Id);
    } catch (AuraHandledException exceptionValue) {
      rejectedMissingRole = true;
    }

    Boolean rejectedNoRequirements = false;
    try {
      SkillGapAnalysisService.saveStudentAnalysis(noRequirements.Id);
    } catch (AuraHandledException exceptionValue) {
      rejectedNoRequirements = true;
    }

    Id resultId = SkillGapAnalysisService.saveStudentAnalysis(student.Id);
    Test.stopTest();

    System.assert(rejectedNullStudent, 'A null student must be rejected.');
    System.assert(rejectedMissingRole, 'A missing job role must be rejected.');
    System.assert(
      rejectedNoRequirements,
      'A role without skill requirements must be rejected.'
    );

    Skill_Gap_Result__c savedResult = [
      SELECT Student_Profile__c, Readiness_Score__c, Gap_Details__c
      FROM Skill_Gap_Result__c
      WHERE Id = :resultId
    ];
    System.assertEquals(student.Id, savedResult.Student_Profile__c);
    System.assertEquals(
      Decimal.valueOf('50.00'),
      savedResult.Readiness_Score__c
    );
    System.assert(savedResult.Gap_Details__c.contains('SOQL'));
  }

  private static Student_Profile__c getStudent(String studentName) {
    return [
      SELECT Id, Name
      FROM Student_Profile__c
      WHERE Name = :studentName
      LIMIT 1
    ];
  }
}
