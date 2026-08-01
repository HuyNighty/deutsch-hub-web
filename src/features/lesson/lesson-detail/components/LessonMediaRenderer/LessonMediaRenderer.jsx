import classNames from "classnames/bind";
import styles from "./LessonMediaRenderer.module.scss";

import useLessonItemMedia from "@/features/media/hooks/useLessonItemMedia";

const cx = classNames.bind(styles);

function LessonMediaRenderer({ courseId, lessonId, itemId, title }) {
  const { media, isPending, isError } = useLessonItemMedia(
    courseId,
    lessonId,
    itemId,
  );

  if (isPending) {
    return <div className={cx("loading")}>Loading media...</div>;
  }

  if (isError || !media) {
    return <div className={cx("error")}>Unable to load media.</div>;
  }

  const { objectUrl, mimeType } = media;

  if (mimeType.startsWith("image/")) {
    return <img className={cx("image")} src={objectUrl} alt={title} />;
  }

  if (mimeType.startsWith("video/")) {
    return (
      <video className={cx("video")} controls preload="metadata">
        <source src={objectUrl} type={mimeType} />
      </video>
    );
  }

  if (mimeType.startsWith("audio/")) {
    return (
      <audio className={cx("audio")} controls>
        <source src={objectUrl} type={mimeType} />
      </audio>
    );
  }

  if (mimeType === "application/pdf") {
    return <iframe className={cx("pdf")} src={objectUrl} title={title} />;
  }

  return <div className={cx("unsupported")}>Unsupported media type.</div>;
}

export default LessonMediaRenderer;
