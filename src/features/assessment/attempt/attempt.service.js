import apiClient from "@/shared/api/api-client";
import { parseAssessmentDetail } from "../shared/assessment-response";
import { parseLearningJourney, parseStartedAttempt, parseAssessmentAttempt } from "./attempt-response";

export async function getLearningJourney() {
  return parseLearningJourney(await apiClient.get("/me/learning-journey"));
}

export async function startAssessment(assessmentId) {
  const result = await apiClient.post(`/me/assessments/${encodeURIComponent(assessmentId)}/attempts`);
  return parseStartedAttempt(result, assessmentId);
}

export async function getAssessmentAttempt(assessmentAttemptId) {
  const result = await apiClient.get(`/me/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}`);
  return parseAssessmentAttempt(result, assessmentAttemptId);
}

export async function getAttemptDefinition(assessmentAttemptId) {
  return parseAssessmentDetail(await apiClient.get(
    `/me/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}/assessment`,
  ));
}
