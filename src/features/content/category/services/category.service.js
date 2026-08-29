import apiClientV2 from "@/shared/api/api-client-v2";

export async function getActiveCategories() {
  return apiClientV2.get("/categories");
}
