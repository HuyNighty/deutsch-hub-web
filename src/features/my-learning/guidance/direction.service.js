import apiClient from "@/shared/api/api-client";
import { parseLearningDirection } from "./direction-response";

export async function getLearningDirection() {
  return parseLearningDirection(await apiClient.get("/me/learning-direction"));
}
