@IsTest
private class SkillGapCalculatorTest {
  @IsTest
  static void calculatesReadinessScore() {
    Id skillId = UserInfo.getUserId();

    Map<Id, Decimal> studentLevels = new Map<Id, Decimal>{ skillId => 2 };
    Map<Id, Decimal> requiredLevels = new Map<Id, Decimal>{ skillId => 4 };
    Map<Id, Decimal> weights = new Map<Id, Decimal>{ skillId => 1 };

    Test.startTest();
    Decimal score = SkillGapCalculator.calculateReadiness(
      studentLevels,
      requiredLevels,
      weights
    );
    Test.stopTest();

    System.assertEquals(
      Decimal.valueOf('50.00'),
      score,
      'A current level of 2 out of 4 should produce a 50% score.'
    );
  }

  @IsTest
  static void clampsReadinessForLevelsOutsideExpectedRange() {
    Id completedSkillId = UserInfo.getUserId();
    Id negativeSkillId = UserInfo.getOrganizationId();

    Decimal score = SkillGapCalculator.calculateReadiness(
      new Map<Id, Decimal>{ completedSkillId => 8, negativeSkillId => -2 },
      new Map<Id, Decimal>{ completedSkillId => 4, negativeSkillId => 4 },
      new Map<Id, Decimal>{ completedSkillId => 1, negativeSkillId => 1 }
    );

    System.assertEquals(
      Decimal.valueOf('50.00'),
      score,
      'Readiness should be clamped between zero and one hundred percent.'
    );
  }

  @IsTest
  static void returnsZeroWhenNoPositiveWeightedRequirementsExist() {
    Id skillId = UserInfo.getUserId();

    Decimal score = SkillGapCalculator.calculateReadiness(
      new Map<Id, Decimal>{ skillId => 2 },
      new Map<Id, Decimal>{ skillId => 0 },
      new Map<Id, Decimal>{ skillId => 1 }
    );

    System.assertEquals(0, score);
  }
}
