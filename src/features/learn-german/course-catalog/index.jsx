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
        title: <span lang="vi">Không tìm thấy khóa học</span>,
        description: <span lang="vi">Hiện chưa có khóa học nào.</span>,
      }}
      errorProps={{
        onRetry: refetch,
      }}
    >
      <main lang="vi" className={cx("catalog")}>
        <CourseCatalogHeader />

        <div className={cx("content")}>
          <LearningPathPreview />

          <CourseGrid courses={courses} />
        </div>
      </main>
    </ResourceState>
  );
}
