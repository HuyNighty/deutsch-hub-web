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

  if (isImage(mimeType)) {
    return (
      <img className={cx("image")} src={objectUrl} alt={title} loading="lazy" />
    );
  }

  if (isVideo(mimeType)) {
    return (
      <video className={cx("video")} controls preload="metadata">
        <source src={objectUrl} type={mimeType} />
      </video>
    );
  }

  if (isAudio(mimeType)) {
    return (
      <audio className={cx("audio")} controls>
        <source src={objectUrl} type={mimeType} />
      </audio>
    );
  }

  if (isPdf(mimeType)) {
    return <iframe className={cx("pdf")} src={objectUrl} title={title} />;
  }

  if (isDocument(mimeType)) {
    return (
      <div className={cx("document")}>
        <p className={cx("documentMessage")}>
          Preview is not available for this document.
        </p>

        <a className={cx("downloadButton")} href={objectUrl} download={title}>
          Download document
        </a>
      </div>
    );
  }

  return <div className={cx("unsupported")}>Unsupported media type.</div>;
}

function isImage(mimeType) {
  return mimeType.startsWith("image/");
}

function isVideo(mimeType) {
  return mimeType.startsWith("video/");
}

function isAudio(mimeType) {
  return mimeType.startsWith("audio/");
}

function isPdf(mimeType) {
  return mimeType === "application/pdf";
}

function isDocument(mimeType) {
  return mimeType === "text/plain" || mimeType.startsWith("application/");
}

export default LessonMediaRenderer;
