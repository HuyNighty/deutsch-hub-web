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
const STATUS_LABELS = { COMPLETED: "Completed", EXPIRED: "Expired", CANCELLED: "Cancelled" };
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function outcomeLabel(item) {
  if (item.resultAvailable) {
    if (item.passed === null) return "Outcome not available";
    return item.passed ? "Passed" : "Not passed";
  }
  return item.status === "EXPIRED" ? "Result not available yet" : "Result not available";
}

export default function AssessmentHistory() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useAssessmentHistory({ page, size: PAGE_SIZE });

  return (
    <section className={cx("page")} aria-labelledby="assessment-history-title">
      <header className={cx("header")}>
        <AppLink to="/my-learning">Back to My Learning</AppLink>
        <h1 id="assessment-history-title" className={cx("title")}>Assessment History</h1>
        <p className={cx("description")}>See your past assessment attempts and available official results.</p>
      </header>

      <ResourceState
        loading={isLoading}
        error={error}
        empty={data?.items.length === 0}
        emptyProps={{
          title: "No assessment history",
          description: "There are no past assessment attempts on this page.",
        }}
        errorProps={{ onRetry: refetch }}
      >
        {data && (
          <div className={cx("grid")}>
            {data.items.map((item) => {
              const title = assessmentTitle(item.assessmentTitle);
              return (
                <article className={cx("card")} key={item.assessmentAttemptId} aria-label={`${title} attempt`}>
                  <h2 className={cx("cardTitle")}>{title}</h2>
                  <p className={cx("metadata")}>Target level: {item.targetLevel}</p>
                  <p>Status: {STATUS_LABELS[item.status]}</p>
                  <p>{outcomeLabel(item)}</p>
                  {item.startedAt !== null && (
                    <p className={cx("metadata")}>
                      Started: <time dateTime={item.startedAt}>{dateFormatter.format(new Date(item.startedAt))}</time>
                    </p>
                  )}
                  {item.expiresAt !== null && (
                    <p className={cx("metadata")}>
                      Deadline: <time dateTime={item.expiresAt}>{dateFormatter.format(new Date(item.expiresAt))}</time>
                    </p>
                  )}
                  {item.resultAvailable && (
                    <AppLink to={resultRoute(item.assessmentAttemptId)} variant="outline" aria-label={`View result for ${title}`}>
                      View result
                    </AppLink>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </ResourceState>

      {error && [403, 404].includes(error.status) && (
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      )}

      {!isLoading && !error && data && (data.totalPages > 0 || data.page > 0) && (
        <nav className={cx("pagination")} aria-label="Assessment history pages">
          <Button variant="outline" disabled={data.page === 0} onClick={() => setPage(data.page - 1)}>
            Previous
          </Button>
          <span>Page {data.page + 1}{data.page < data.totalPages && ` of ${data.totalPages}`}</span>
          <Button variant="outline" disabled={data.page + 1 >= data.totalPages} onClick={() => setPage(data.page + 1)}>
            Next
          </Button>
        </nav>
      )}
    </section>
  );
}
