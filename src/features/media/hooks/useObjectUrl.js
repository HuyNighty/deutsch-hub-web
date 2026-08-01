import { useEffect, useMemo } from "react";

function useObjectUrl(blob) {
  const objectUrl = useMemo(() => {
    if (!(blob instanceof Blob)) {
      return null;
    }

    return URL.createObjectURL(blob);
  }, [blob]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return objectUrl;
}

export default useObjectUrl;
