const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const SKILLS = ["LISTENING", "READING", "WRITING", "SPEAKING"];
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonblank = (value) => typeof value === "string" && value.trim().length > 0;

// The official Result contract is identical for final Submit and historical Result GET.
export function isAssessmentResult(value, assessmentAttemptId, definition) {
  if (!isObject(value) || !isNonblank(value.id) || !isNonblank(value.assessmentAttemptId) ||
      value.assessmentAttemptId !== assessmentAttemptId || !LEVELS.includes(value.targetLevel) ||
      value.targetLevel !== definition.targetLevel || !Array.isArray(value.componentResults) ||
      value.componentResults.length === 0 || typeof value.passed !== "boolean") return false;
  const components = value.componentResults;
  return components.every((component) => isObject(component) && isNonblank(component.componentId) &&
      SKILLS.includes(component.skillDimension) && Number.isFinite(component.performance) &&
      component.performance >= 0 && component.performance <= 100 && typeof component.passed === "boolean") &&
      new Set(components.map((component) => component.componentId)).size === components.length &&
      components.length === definition.components.length &&
      components.every((component) => definition.components.some((expected) =>
        expected.componentId === component.componentId && expected.skillDimension === component.skillDimension)) &&
      value.passed === components.every((component) => component.passed);
}
