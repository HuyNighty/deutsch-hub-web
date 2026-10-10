import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { useLearningDirection } from "./hooks/useLearningDirection";
import { useNextActivity } from "./hooks/useNextActivity";
import { taskRoute } from "@/features/assessment/task/task-query";

function Direction({ direction }) {
  switch (direction.type) {
    case "RESUME_ASSESSMENT":
      return (
        <>
          <p>Bạn đang thực hiện một bài đánh giá.</p>
          <AppLink to={`/my-learning/assessment-attempts/${encodeURIComponent(direction.target.assessmentAttemptId)}`} variant="outline">
            Tiếp tục đánh giá
          </AppLink>
        </>
      );
    case "CONTINUE_COURSE":
      return (
        <>
          <p>Tiếp tục khóa học bạn đang học.</p>
          <AppLink to={`/my-learning/courses/${encodeURIComponent(direction.target.courseId)}`} variant="outline">
            Tiếp tục học
          </AppLink>
        </>
      );
    case "DISCOVER_COURSE":
      return (
        <>
          <p>Chọn một khóa học để bắt đầu hoặc tiếp tục học tiếng Đức.</p>
          <AppLink to="/learn-german" variant="outline">Khám phá khóa học</AppLink>
        </>
      );
  }
}

function Activity({ activity }) {
  switch (activity.type) {
    case "OPEN_LESSON":
      return (
        <>
          <p>Tiếp tục với bài học tiếp theo của bạn.</p>
          <AppLink to={`/my-learning/courses/${encodeURIComponent(activity.target.courseId)}/lessons/${encodeURIComponent(activity.target.lessonId)}`} variant="outline">
            Mở bài học tiếp theo
          </AppLink>
        </>
      );
    case "RESUME_ASSESSMENT_TASK":
      return (
        <>
          <p>Tiếp tục bài tập đánh giá đang thực hiện.</p>
          <AppLink to={taskRoute(activity.target.assessmentAttemptId, activity.target.taskId)} variant="outline">
            Tiếp tục bài tập
          </AppLink>
        </>
      );
    case "OPEN_ASSESSMENT":
      return (
        <>
          <p>Quay lại bài đánh giá để tiếp tục.</p>
          <AppLink to={`/my-learning/assessment-attempts/${encodeURIComponent(activity.target.assessmentAttemptId)}`} variant="outline">
            Xem bài đánh giá
          </AppLink>
        </>
      );
  }
}

export default function LearningGuidance() {
  const direction = useLearningDirection();
  const activity = useNextActivity();
  const concrete = !activity.error && activity.data?.type !== "NONE" && activity.data;
  const fallback = !direction.error && direction.data;
  return (
    <section lang="vi" aria-label="Hướng dẫn học tập">
      <h2>Hướng dẫn học tập</h2>
      <ResourceState
        loading={!concrete && !fallback && (direction.isPending || activity.isPending)}
        loadingProps={{ children: <p>Đang tải hướng dẫn học tập...</p> }}
      >
        {concrete ? <Activity activity={concrete} /> : fallback && <Direction direction={fallback} />}
      </ResourceState>
      {!concrete && direction.error && (
        <div role="region" aria-label="Hướng học tập">
          <ResourceState error={direction.error} errorProps={{ onRetry: direction.refetch }} />
        </div>
      )}
      {activity.error && (
        <div role="region" aria-label="Hoạt động tiếp theo">
          <ResourceState error={activity.error} errorProps={{ onRetry: activity.refetch }} />
        </div>
      )}
    </section>
  );
}
