import { useQuery } from "@tanstack/react-query";
import { getLessonItemMedia } from "../services/media-client.service";
import useObjectUrl from "./useObjectUrl";

function useLessonItemMedia(courseId, lessonId, itemId) {
  const query = useQuery({
    queryKey: ["lesson-item-media", courseId, lessonId, itemId],

    queryFn: () => getLessonItemMedia(courseId, lessonId, itemId),

    enabled: !!courseId && !!lessonId && !!itemId,
  });

  const objectUrl = useObjectUrl(query.data);

  return {
    ...query,

    media:
      objectUrl && query.data
        ? {
            objectUrl,
            mimeType: query.data.type,
            size: query.data.size,
          }
        : null,
  };
}

export default useLessonItemMedia;
