import { useParams } from "react-router-dom";
import classNames from "classnames/bind";

import useLessonDetail from "./hooks/useLessonDetail";

import LessonHeader from "./components/LessonHeader/LessonHeader";
import LessonItemRenderer from "./components/LessonItemRenderer/LessonItemRenderer";
import LessonNavigation from "./components/LessonNavigation/LessonNavigation";
import CompleteLessonButton from "../lesson-complete/components/CompleteLessonButton";

import ResourceState from "@/shared/ui/state/ResourceState";

import styles from "./LessonDetail.module.scss";

const cx = classNames.bind(styles);

function LessonDetail() {
  const { courseId, lessonId } = useParams();

  const { lesson, loading, error, refetch } = useLessonDetail(
    courseId,
    lessonId,
  );

  return (
    <ResourceState
      loading={loading}
      error={error}
      errorProps={{
        onRetry: refetch,
      }}
    >
      {lesson && (
        <main className={cx("page")}>
          <LessonHeader lesson={lesson} />

          <section className={cx("content")}>
            <LessonItemRenderer
              courseId={courseId}
              lessonId={lesson.id}
              items={lesson.items}
            />
          </section>

          <section className={cx("actions")}>
            <CompleteLessonButton
              key={`${courseId}:${lessonId}`}
              courseId={courseId}
              lesson={lesson}
            />

            <LessonNavigation
              courseId={courseId}
              previousLessonId={lesson.previousLessonId}
              nextLessonId={lesson.nextLessonId}
            />
          </section>
        </main>
      )}
    </ResourceState>
  );
}

export default LessonDetail;
