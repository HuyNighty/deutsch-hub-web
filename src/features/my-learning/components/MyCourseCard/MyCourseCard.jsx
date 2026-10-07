import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/components/button";

import classNames from "classnames/bind";
import styles from "./MyCourseCard.module.scss";
import { MyCourseProgressBar } from "../MyCourseProgressBar";

const cx = classNames.bind(styles);

export default function MyCourseCard({ course }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(`/my-learning/courses/${encodeURIComponent(course.courseId)}`);
  };

  return (
    <article className={cx("card")}>
      <header className={cx("header")}>
        <h2 className={cx("title")}>{course.title}</h2>

        <p className={cx("description")}>Course level: {course.level}</p>
      </header>

      <MyCourseProgressBar
        completedLessons={course.progress.completedLessons}
        totalLessons={course.progress.totalLessons}
        completionPercentage={course.progress.completionPercentage}
      />

      <footer className={cx("footer")}>
        <Button variant="outline" onClick={handleContinue}>
          Continue Learning
        </Button>
      </footer>
    </article>
  );
}
