import { api } from "@/shared/api/axios";

export async function completeLesson(courseId, lessonId, studyMinutes) {
  const response = await api.post(
    `/me/courses/${courseId}/lessons/${lessonId}/complete`,
    { studyMinutes },
  );

  return response.data.result;
}
