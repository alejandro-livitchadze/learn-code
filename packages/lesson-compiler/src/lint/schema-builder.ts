import type { LintIssue, LintRule } from './types';

export const SCHEMA_BUILDER_RULE_IDS = {
  scenarioCount: 'schema-builder-scenario-count',
  scenarioMisconception: 'schema-builder-misconception',
} as const;

export const MIN_SCENARIOS = 3;
export const MAX_SCENARIOS = 7;

/** E06: a `schemaBuilder` step has 3 to 7 scenarios, and each one links to a known misconception. */
export const schemaBuilderScenarios: LintRule = (lesson, registries) => {
  const known = new Set(registries.misconceptions.map((m) => m.id));
  const issues: LintIssue[] = [];
  lesson.steps.forEach((s, i) => {
    if (s.kind !== 'schemaBuilder') return;
    const at = (rule: string, message: string): LintIssue => ({
      rule,
      stepId: s.id,
      stepIndex: i,
      message,
      severity: 'error',
    });
    if (s.scenarios.length < MIN_SCENARIOS || s.scenarios.length > MAX_SCENARIOS) {
      issues.push(
        at(
          SCHEMA_BUILDER_RULE_IDS.scenarioCount,
          `schemaBuilder has ${s.scenarios.length} scenarios; it needs ${MIN_SCENARIOS} to ${MAX_SCENARIOS}`,
        ),
      );
    }
    for (const sc of s.scenarios) {
      if (!known.has(sc.misconception)) {
        issues.push(
          at(
            SCHEMA_BUILDER_RULE_IDS.scenarioMisconception,
            `scenario "${sc.id}" uses unknown misconception "${sc.misconception}"`,
          ),
        );
      }
    }
  });
  return issues;
};
