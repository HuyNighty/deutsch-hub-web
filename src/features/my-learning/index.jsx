import classNames from "classnames/bind";
import styles from "./MyLearning.module.scss";

import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import MyCourseCard from "./components/MyCourseCard/MyCourseCard";
import { useLearningJourney } from "@/features/assessment/attempt/hooks/useLearningJourney";
import ActiveAssessments from "@/features/assessment/attempt/ActiveAssessments";
import LearningGuidance from "./guidance/LearningGuidance";

const cx = classNames.bind(styles);

function MyLearning() {
  const { data: journey, isPending, error, refetch } = useLearningJourney();

  return (
    <main lang="vi" className={cx("page")}>
      <header className={cx("header")}>
        <h1 className={cx("title")}>Học tập của tôi</h1>

        <p className={cx("description")}>Tiếp tục hành trình học tiếng Đức của bạn.</p>
      </header>

      <LearningGuidance />

      <section aria-labelledby="assessment-entry-title">
        <h2 id="assessment-entry-title">Bài đánh giá</h2>
        <div className={cx("assessment-links")}>
          <AppLink to="/my-learning/assessments" variant="outline">
            Khám phá bài đánh giá
          </AppLink>
          <AppLink to="/my-learning/assessment-history" variant="outline">
            Lịch sử đánh giá
          </AppLink>
        </div>
      </section>

      <ResourceState
        loading={isPending}
        error={error}
        errorProps={{
          onRetry: refetch,
        }}
      >
        {journey && (
          <>
            <section aria-label="Trình độ tiếng Đức hiện tại">
              <h2>Trình độ tiếng Đức hiện tại</h2>
              <p>{journey.currentLevel === "UNKNOWN" ? "Chưa xác định" : journey.currentLevel}</p>
            </section>
            <ActiveAssessments assessmentAttempts={journey.assessmentAttempts} />
            <ResourceState
              empty={journey.courses.length === 0}
              emptyProps={{ title: <span lang="vi">Bạn chưa có khóa học nào</span>, description: <span lang="vi">Bắt đầu học khóa học đầu tiên của bạn.</span> }}
            >
              <section className={cx("courses")} aria-label="Khóa học của bạn">
                {journey.courses.map((course) => (
                  <MyCourseCard key={course.courseId} course={course} />
                ))}
              </section>
            </ResourceState>
          </>
        )}
      </ResourceState>
    </main>
  );
}

export default MyLearning;
