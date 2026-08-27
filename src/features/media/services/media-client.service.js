import apiClient from "@/shared/api/api-client";

export function getLessonItemMedia(courseId, lessonId, itemId) {
  return apiClient.get(
    `/me/courses/${courseId}/lessons/${lessonId}/items/${itemId}/media`,
    {
      responseType: "blob",
    },
  );
}

export function getMediaContent(mediaId) {
  return apiClient.get(`/media/${mediaId}/content`, {
    responseType: "blob",
  });
}
