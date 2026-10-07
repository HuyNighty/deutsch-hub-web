import apiClient from "@/shared/api/api-client";
import { parseAssessmentPage, parseAssessmentDetail } from "./assessment-response";

export async function listLearnerAssessments({ page = 0, size = 20 } = {}) {
  const result = await apiClient.get("/me/assessments", { params: { page, size } });
  return parseAssessmentPage(result);
}

export async function getLearnerAssessment(assessmentId) {
  const result = await apiClient.get(`/me/assessments/${encodeURIComponent(assessmentId)}`);
  return parseAssessmentDetail(result);
}
