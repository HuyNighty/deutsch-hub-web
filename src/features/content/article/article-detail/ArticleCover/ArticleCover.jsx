import classNames from "classnames/bind";
import styles from "./ArticleCover.module.scss";
import useMedia from "@/features/media/hooks/useMedia";

const cx = classNames.bind(styles);

export default function ArticleCover({ mediaId, title }) {
  const { media, isPending, isError } = useMedia(mediaId);

  if (isPending) {
    return <div className={cx("loading")} />;
  }

  if (isError || !media) {
    return null;
  }

  return (
    <figure className={cx("cover")}>
      <img className={cx("image")} src={media.objectUrl} alt={title} />
    </figure>
  );
}
