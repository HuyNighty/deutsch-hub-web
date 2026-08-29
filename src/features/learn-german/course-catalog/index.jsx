import { CourseGrid } from "./components/CourseGrid";
import { CourseCatalogHeader } from "./components/CourseCatalogHeader";
import { LearningPathPreview } from "@/features/learn-german/components/LearningPathPreview";

import { useCourses } from "./hooks/useCourses";

import ResourceState from "@/shared/ui/state/ResourceState";

import classNames from "classnames/bind";
import styles from "./CourseCatalog.module.scss";

const cx = classNames.bind(styles);

export default function CourseCatalog() {
  const { courses, loading, error, refetch } = useCourses();

  return (
    <ResourceState
      loading={loading}
      error={error}
      empty={courses.length === 0}
      emptyProps={{
        title: "No courses found",
        description: "There are no available courses at the moment.",
      }}
      errorProps={{
        onRetry: refetch,
      }}
    >
      <main className={cx("catalog")}>
        <CourseCatalogHeader />

        <div className={cx("content")}>
          <LearningPathPreview />

          <CourseGrid courses={courses} />
        </div>
      </main>
    </ResourceState>
  );
}
