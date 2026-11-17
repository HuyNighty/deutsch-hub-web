import apiClient from "@/shared/api/api-client";

export const COURSE_PAGE_SIZE = 20;

// Public Course API: page, size, keyword; no course mutations or implicit fetch loops.
export function getCoursePage({ page = 0, keyword = "", signal } = {}) {
  return apiClient.get("/courses", {
    signal,
    params: {
      page,
      size: COURSE_PAGE_SIZE,
      ...(keyword ? { keyword } : {}),
    },
  });
}

// Preserve the existing first-page helper for any callers outside the Catalogue.
export async function getCourses() {
  const page = await getCoursePage();
  return page.items;
}
