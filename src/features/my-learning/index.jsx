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
    <main className={cx("page")}>
      <header className={cx("header")}>
        <h1 className={cx("title")}>My Learning</h1>

        <p className={cx("description")}>Continue your German learning journey.</p>
      </header>

      <LearningGuidance />

      <section aria-labelledby="assessment-entry-title">
        <h2 id="assessment-entry-title">Assessments</h2>
        <AppLink to="/my-learning/assessments" variant="outline">
          Explore available assessments
        </AppLink>
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
            <section aria-label="Current German level">
              <h2>Current German level</h2>
              <p>{journey.currentLevel === "UNKNOWN" ? "Not established yet" : journey.currentLevel}</p>
            </section>
            <ActiveAssessments assessmentAttempts={journey.assessmentAttempts} />
            <ResourceState
              empty={journey.courses.length === 0}
              emptyProps={{ title: "No courses yet", description: "Start learning your first course." }}
            >
              <section className={cx("courses")} aria-label="Your courses">
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
