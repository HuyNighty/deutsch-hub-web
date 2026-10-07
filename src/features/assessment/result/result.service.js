import apiClient from "@/shared/api/api-client";
import { parseAssessmentResult, parseCompetency } from "./result-response";

export async function getAssessmentResult(assessmentAttemptId, definition) {
  const result = await apiClient.get(`/me/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}/result`);
  return parseAssessmentResult(result, assessmentAttemptId, definition);
}

export async function getCompetency() {
  return parseCompetency(await apiClient.get("/me/competency"));
}
