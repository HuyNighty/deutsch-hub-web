import classNames from "classnames/bind";
import { AppLink } from "@/shared/ui/components/app-link";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

export default function ActiveAssessments({ assessmentAttempts }) {
  if (assessmentAttempts.length === 0) return null;
  return (
    <section lang="vi" aria-label="Bài đánh giá đang thực hiện" className={cx("components")}>
      <h2 className={cx("cardTitle")}>Bài đánh giá đang thực hiện</h2>
      {assessmentAttempts.map((attempt) => (
        <article key={attempt.assessmentAttemptId} className={cx("card")}>
          <h3 className={cx("cardTitle")}>Bài đánh giá đang thực hiện</h3>
          <p className={cx("metadata")}>Trình độ mục tiêu: {attempt.targetLevel}</p>
          <AppLink to={`/my-learning/assessment-attempts/${encodeURIComponent(attempt.assessmentAttemptId)}`}>
            Tiếp tục đánh giá
          </AppLink>
        </article>
      ))}
    </section>
  );
}
