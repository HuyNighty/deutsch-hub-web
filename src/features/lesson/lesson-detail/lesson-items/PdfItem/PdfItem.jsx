import classNames from "classnames/bind";

import styles from "./PdfItem.module.scss";
import { Button } from "@/shared/ui/component/button";

const cx = classNames.bind(styles);

export default function PdfItem({ item }) {
  return (
    <article className={cx("pdf")}>
      <div className={cx("content")}>
        <div className={cx("info")}>
          <h2 className={cx("title")}>{item.title}</h2>

          {item.description && (
            <p className={cx("description")}>{item.description}</p>
          )}
        </div>
      </div>

      <Button
        as="a"
        href={item.resourceUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open PDF
      </Button>
    </article>
  );
}
