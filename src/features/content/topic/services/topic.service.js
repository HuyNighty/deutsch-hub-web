import apiClientV2 from "@/shared/api/api-client-v2";

export async function getActiveTopicsByCategoryId(categoryId) {
  return apiClientV2.get(`/topics/categories/${categoryId}`);
}
