import classNames from "classnames/bind";
import styles from "./MyLearning.module.scss";

import ResourceState from "@/shared/ui/state/ResourceState";
import MyCourseCard from "./components/MyCourseCard/MyCourseCard";
import useMyLearning from "./hooks/useMyLearning";

const cx = classNames.bind(styles);

function MyLearning() {
  const { courses, loading, error, refetch } = useMyLearning();

  return (
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
      <main className={cx("page")}>
        <header className={cx("header")}>
          <h1 className={cx("title")}>My Learning</h1>

          <p className={cx("description")}>Continue your enrolled courses.</p>
        </header>

        <section className={cx("courses")}>
          {courses.map((course) => (
            <MyCourseCard key={course.id} course={course} />
          ))}
        </section>
      </main>
    </ResourceState>
  );
}

export default MyLearning;
