import { useQuery } from "@tanstack/react-query";

import { getMediaContent } from "../services/media-client.service";
import useObjectUrl from "./useObjectUrl";

export default function useMedia(mediaId) {
  const query = useQuery({
    queryKey: ["media", mediaId],

    queryFn: () => getMediaContent(mediaId),

    enabled: !!mediaId,
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
