import classNames from "classnames/bind";

import TextItem from "../../lesson-items/TextItem/TextItem";
import VideoItem from "../../lesson-items/VideoItem/VideoItem";
import PdfItem from "../../lesson-items/PdfItem/PdfItem";

import styles from "./LessonItemRenderer.module.scss";

const cx = classNames.bind(styles);

const renderMap = {
  TEXT: TextItem,
  VIDEO: VideoItem,
  PDF: PdfItem,
};

export default function LessonItemRenderer({ items }) {
  return (
    <section className={cx("renderer")}>
      {items.map((item) => {
        const Component = renderMap[item.type];

        if (!Component) {
          return (
            <div key={item.id} className={cx("unsupported")}>
              Unsupported lesson item: {item.type}
            </div>
          );
        }

        return <Component key={item.id} item={item} />;
      })}
    </section>
  );
}
