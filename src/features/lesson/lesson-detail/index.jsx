import { useParams } from "react-router-dom";
import useLessonDetail from "./hooks/useLessonDetail";
import LessonItemRenderer from "./components/LessonItemRenderer";
import LessonNavigation from "./components/LessonNavigation";
import LessonHeader from "./components/LessonHeader";
import CompleteLessonButton from "../lesson-complete/components/CompleteLessonButton";
import { useEffect, useState } from "react";
import ResourceState from "@/shared/ui/state/ResourceState";

function LessonDetail() {
  const { courseId, lessonId } = useParams();

  const { lesson, loading, error, refetch } = useLessonDetail(
    courseId,
    lessonId,
  );

  const [lessonState, setLessonState] = useState(null);

  useEffect(() => {
    setLessonState(lesson);
  }, [lesson]);

  return (
    <ResourceState loading={loading} error={error}>
      {" "}
      errorProps=
      {{
        onRetry: refetch,
      }}
      {lessonState && (
        <>
          <LessonHeader lesson={lessonState} />

          <LessonItemRenderer items={lessonState.items} />

          <CompleteLessonButton
            courseId={courseId}
            lessonId={lessonState.id}
            estimatedMinutes={lessonState.estimatedMinutes}
            completed={lessonState.completed}
            onCompleted={() =>
              setLessonState({
                ...lessonState,
                completed: true,
              })
            }
          />

          <LessonNavigation
            courseId={courseId}
            previousLessonId={lessonState.previousLessonId}
            nextLessonId={lessonState.nextLessonId}
          />
        </>
      )}
    </ResourceState>
  );
}

export default LessonDetail;
