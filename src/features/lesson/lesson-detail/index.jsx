import { useEffect, useState } from "react";
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

  const [lessonData, setLessonData] = useState(null);

  useEffect(() => {
    setLessonData(lesson);
  }, [lesson]);

  const handleLessonCompleted = () => {
    setLessonData((prev) => ({
      ...prev,
      completed: true,
    }));
  };

  return (
    <ResourceState
      loading={loading}
      error={error}
      errorProps={{
        onRetry: refetch,
      }}
    >
      {lessonData && (
        <main className={cx("page")}>
          <LessonHeader lesson={lessonData} />

          <section className={cx("content")}>
            <LessonItemRenderer
              courseId={courseId}
              lessonId={lessonData.id}
              items={lessonData.items}
            />
          </section>

          <section className={cx("actions")}>
            <CompleteLessonButton
              courseId={courseId}
              lessonId={lessonData.id}
              lesson={lessonData}
              onCompleted={handleLessonCompleted}
            />

            <LessonNavigation
              courseId={courseId}
              previousLessonId={lessonData.previousLessonId}
              nextLessonId={lessonData.nextLessonId}
            />
          </section>
        </main>
      )}
    </ResourceState>
  );
}

export default LessonDetail;
