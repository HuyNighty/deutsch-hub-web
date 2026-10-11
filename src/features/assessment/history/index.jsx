import { useState } from "react";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { useAssessmentHistory } from "./hooks/useAssessmentHistory";
import { assessmentTitle } from "../shared/assessment-presentation";
import { resultRoute } from "../result/result-query";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);
const PAGE_SIZE = 20;
const STATUS_LABELS = { COMPLETED: "Đã hoàn thành", EXPIRED: "Hết hạn", CANCELLED: "Đã hủy" };
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

function outcomeLabel(item) {
  if (item.resultAvailable) {
    return item.passed ? "Đạt" : "Chưa đạt";
  }
  return item.status === "EXPIRED" ? "Chưa có kết quả để xem" : "Không có kết quả để xem";
}

export default function AssessmentHistory() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useAssessmentHistory({ page, size: PAGE_SIZE });

  return (
    <section className={cx("page")} aria-labelledby="assessment-history-title">
      <header lang="vi" className={cx("header")}>
        <AppLink to="/my-learning">Quay lại việc học của tôi</AppLink>
        <h1 id="assessment-history-title" className={cx("title")}>Lịch sử bài đánh giá</h1>
        <p className={cx("description")}>Xem các lượt làm bài đánh giá trước đây và kết quả chính thức hiện có.</p>
      </header>

      <ResourceState
        loading={isLoading}
        error={error}
        empty={data?.items.length === 0}
        emptyProps={{
          title: <span lang="vi">Chưa có lịch sử bài đánh giá</span>,
          description: <span lang="vi">Trang này chưa có lượt làm bài đánh giá trước đây.</span>,
        }}
        errorProps={{ onRetry: refetch }}
      >
        {data && (
          <div className={cx("grid")}>
            {data.items.map((item) => {
              const title = assessmentTitle(item.assessmentTitle);
              return (
                <article className={cx("card")} key={item.assessmentAttemptId} aria-label={`Lượt làm bài đánh giá: ${title}`}>
                  <h2 lang={item.assessmentTitle === null ? "vi" : undefined} className={cx("cardTitle")}>{title}</h2>
                  <p lang="vi" className={cx("metadata")}>Trình độ mục tiêu: {item.targetLevel}</p>
                  <p lang="vi">Trạng thái: {STATUS_LABELS[item.status]}</p>
                  <p lang="vi">{outcomeLabel(item)}</p>
                  {item.startedAt !== null && (
                    <p lang="vi" className={cx("metadata")}>
                      Bắt đầu: <time dateTime={item.startedAt}>{dateFormatter.format(new Date(item.startedAt))}</time>
                    </p>
                  )}
                  {item.expiresAt !== null && (
                    <p lang="vi" className={cx("metadata")}>
                      Hạn kết thúc: <time dateTime={item.expiresAt}>{dateFormatter.format(new Date(item.expiresAt))}</time>
                    </p>
                  )}
                  {item.resultAvailable && (
                    <AppLink to={resultRoute(item.assessmentAttemptId)} variant="outline" aria-label={`Xem kết quả của ${title}`}>
                      <span lang="vi">Xem kết quả</span>
                    </AppLink>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </ResourceState>

      {error && [403, 404].includes(error.status) && (
        <Button lang="vi" variant="outline" onClick={() => refetch()}>Thử lại</Button>
      )}

      {!isLoading && !error && data && (data.totalPages > 0 || data.page > 0) && (
        <nav className={cx("pagination")} lang="vi" aria-label="Các trang lịch sử bài đánh giá">
          <Button variant="outline" disabled={data.page === 0} onClick={() => setPage(data.page - 1)}>
            Trang trước
          </Button>
          <span>Trang {data.page + 1}{data.page < data.totalPages && ` / ${data.totalPages}`}</span>
          <Button variant="outline" disabled={data.page + 1 >= data.totalPages} onClick={() => setPage(data.page + 1)}>
            Trang tiếp
          </Button>
        </nav>
      )}
    </section>
  );
}
