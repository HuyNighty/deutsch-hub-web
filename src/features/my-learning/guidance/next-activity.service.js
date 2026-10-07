import apiClient from "@/shared/api/api-client";
import { parseNextActivity } from "./next-activity-response";

export async function getNextActivity() {
  return parseNextActivity(await apiClient.get("/me/next-activity"));
}
