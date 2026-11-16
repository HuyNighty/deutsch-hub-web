import { useState } from "react";
import { AppLink } from "@/shared/ui/components/app-link";
import { getCourseCover } from "../../courseCovers";
import classNames from "classnames/bind";
import styles from "./CourseCard.module.scss";

const cx = classNames.bind(styles);

// F4: stable art composition derives from the immutable course ID, never array position or theme.
// This is a temporary decorative fallback until licensed per-course media has a real data contract.
const FALLBACK_COVER = "/images/learn-german/castle-day.webp";

function stableCoverPosition(courseId) {
  let hash = 2166136261;
  for (const character of String(courseId ?? "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${12 + ((hash >>> 0) % 77)}% center`;
}

function formatPrice(price, currency) {
  if (price === undefined || price === null || !currency) return null;
  if (currency === "VND") return new Intl.NumberFormat("vi-VN").format(price) + " ₫";
  return `${price} ${currency}`;
}

export default function CourseCard({ course }) {
  const cover = getCourseCover(course.id);
  const [failedImage, setFailedImage] = useState(null);
  const imageSrc = cover.image && failedImage !== cover.image ? cover.image : FALLBACK_COVER;
  const price = formatPrice(course.price, course.currency);
  const hours = Number(course.estimatedHours);
  return (
    <article className={cx("card")}>
      <div className={cx("image")} aria-hidden="true">
        <img className={cx("cover")} src={imageSrc}
          style={{ objectPosition: stableCoverPosition(course.id) }}
          alt="" loading="lazy" decoding="async"
          onError={() => {
            if (cover.image && failedImage !== cover.image) setFailedImage(cover.image);
          }} />
        <span className={cx("imageLabel")}>{course.level}</span>
      </div>
      <div className={cx("body")}>
        <h3 className={cx("title")}>{course.title}</h3>
        <p className={cx("description")}>{course.description}</p>
        <div className={cx("details")}>
          <span>{course.level}</span>
          {Number.isFinite(hours) && hours > 0 && <span>{hours} giờ</span>}
          {price && <span>{price}</span>}
        </div>
        <AppLink to={`/learn-german/courses/${course.id}`} className={cx("link")}>
          Xem khóa học <span aria-hidden="true">→</span>
        </AppLink>
      </div>
    </article>
  );
}
