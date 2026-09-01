import apiClientV2 from "@/shared/api/api-client-v2";

export async function getPublishedArticles(params = {}) {
  return apiClientV2.get("/articles", {
    params,
    requiresAuth: false,
  });
}

export async function getPublishedArticleBySlug(slug) {
  return apiClientV2.get(`/articles/${slug}`, {
    requiresAuth: false,
  });
}
