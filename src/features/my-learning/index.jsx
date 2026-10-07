import classNames from "classnames/bind";
import styles from "./MyLearning.module.scss";

import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import MyCourseCard from "./components/MyCourseCard/MyCourseCard";
import useMyLearning from "./hooks/useMyLearning";
import ActiveAssessments from "@/features/assessment/attempt/ActiveAssessments";

const cx = classNames.bind(styles);

function MyLearning() {
  const { courses, loading, error, refetch } = useMyLearning();

  return (
    <main className={cx("page")}>
      <header className={cx("header")}>
        <h1 className={cx("title")}>My Learning</h1>

        <p className={cx("description")}>Continue your enrolled courses.</p>
      </header>

      <section aria-labelledby="assessment-entry-title">
        <h2 id="assessment-entry-title">Assessments</h2>
        <AppLink to="/my-learning/assessments" variant="outline">
          Explore available assessments
        </AppLink>
      </section>

      <ActiveAssessments />

      <ResourceState
        loading={loading}
        error={error}
        empty={courses.length === 0}
        emptyProps={{
          title: "No courses yet",
          description: "Start learning your first course.",
        }}
        errorProps={{
          onRetry: refetch,
        }}
      >
        <section className={cx("courses")}>
          {courses.map((course) => (
            <MyCourseCard key={course.id} course={course} />
          ))}
        </section>
      </ResourceState>
    </main>
  );
}

export default MyLearning;
