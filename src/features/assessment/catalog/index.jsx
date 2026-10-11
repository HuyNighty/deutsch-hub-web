import { useState } from "react";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { useLearnerAssessments } from "./hooks/useLearnerAssessments";
import { assessmentTitle, assessmentTimeLimit } from "../shared/assessment-presentation";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);
const PAGE_SIZE = 20;

export default function AssessmentCatalog() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useLearnerAssessments({ page, size: PAGE_SIZE });

  return (
    <section className={cx("page")} aria-labelledby="assessment-catalog-title">
      <header lang="vi" className={cx("header")}>
        <AppLink to="/my-learning">Quay lại việc học của tôi</AppLink>
        <h1 id="assessment-catalog-title" className={cx("title")}>Bài đánh giá</h1>
        <p className={cx("description")}>Khám phá các bài đánh giá hiện có.</p>
      </header>

      <ResourceState
        loading={isLoading}
        error={error}
        empty={data?.items.length === 0}
        emptyProps={{
          title: <span lang="vi">Chưa có bài đánh giá</span>,
          description: <span lang="vi">Hiện chưa có bài đánh giá đang hoạt động.</span>,
        }}
        errorProps={{ onRetry: refetch }}
      >
        {data && (
          <div className={cx("grid")}>
            {data.items.map((assessment) => (
              <article className={cx("card")} key={assessment.assessmentId}>
                <h2 lang={assessment.title === null ? "vi" : undefined} className={cx("cardTitle")}>{assessmentTitle(assessment.title)}</h2>
                <p lang="vi" className={cx("metadata")}>Trình độ mục tiêu: {assessment.targetLevel}</p>
                <p lang="vi" className={cx("metadata")}>
                  Giới hạn thời gian: {assessmentTimeLimit(assessment.timeLimitMinutes)}
                </p>
                <AppLink
                  to={`/my-learning/assessments/${encodeURIComponent(assessment.assessmentId)}`}
                  variant="outline"
                  lang="vi"
                >
                  Xem bài đánh giá
                </AppLink>
              </article>
            ))}
          </div>
        )}
      </ResourceState>

      {!isLoading && !error && data?.totalPages > 0 && (
        <nav className={cx("pagination")} lang="vi" aria-label="Các trang bài đánh giá">
          <Button
            variant="outline"
            disabled={data.page <= 0}
            onClick={() => setPage(data.page - 1)}
          >
            Trang trước
          </Button>
          <span>Trang {data.page + 1} / {data.totalPages}</span>
          <Button
            variant="outline"
            disabled={data.page + 1 >= data.totalPages}
            onClick={() => setPage(data.page + 1)}
          >
            Trang tiếp
          </Button>
        </nav>
      )}
    </section>
  );
}
