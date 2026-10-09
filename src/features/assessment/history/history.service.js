import apiClient from "@/shared/api/api-client";
import { parseAssessmentHistoryPage } from "./history-response";

export async function listAssessmentHistory({ page = 0, size = 20 } = {}, config = {}) {
  const pagination = { page, size };
  const result = await apiClient.get("/me/assessment-attempts/history", { ...config, params: pagination });
  return parseAssessmentHistoryPage(result, pagination);
}
