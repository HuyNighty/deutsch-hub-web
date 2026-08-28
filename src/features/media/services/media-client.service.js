import apiClient from "@/shared/api/api-client";
import apiClientV2 from "@/shared/api/api-client-v2";

export function getLessonItemMedia(courseId, lessonId, itemId) {
  return apiClient.get(
    `/me/courses/${courseId}/lessons/${lessonId}/items/${itemId}/media`,
    {
      responseType: "blob",
    },
  );
}

export function getMediaContent(mediaId) {
  return apiClientV2.get(`/media/${mediaId}/content`, {
    responseType: "blob",
  });
}
