
Map<Id, Decimal> studentLevels = new Map<Id, Decimal>();
Map<Id, Decimal> requiredLevels = new Map<Id, Decimal>();
Map<Id, Decimal> weights = new Map<Id, Decimal>();

Id skill1 = '001000000000001AAA';
Id skill2 = '001000000000002AAA';

studentLevels.put(skill1, 8);
studentLevels.put(skill2, 5);

requiredLevels.put(skill1, 10);
requiredLevels.put(skill2, 10);

weights.put(skill1, 2);
weights.put(skill2, 1);

Decimal result = SkillGapCalculator.calculateReadiness(
    studentLevels,
    requiredLevels,
    weights
);

System.debug('SKILLGAP AI READINESS SCORE: ' + result);
