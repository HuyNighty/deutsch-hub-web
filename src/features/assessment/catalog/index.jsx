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
      <header className={cx("header")}>
        <AppLink to="/my-learning">Back to My Learning</AppLink>
        <h1 id="assessment-catalog-title" className={cx("title")}>Assessments</h1>
        <p className={cx("description")}>Explore available assessments.</p>
      </header>

      <ResourceState
        loading={isLoading}
        error={error}
        empty={data?.items.length === 0}
        emptyProps={{
          title: "No assessments available",
          description: "There are no active assessments available right now.",
        }}
        errorProps={{ onRetry: refetch }}
      >
        {data && (
          <div className={cx("grid")}>
            {data.items.map((assessment) => (
              <article className={cx("card")} key={assessment.assessmentId}>
                <h2 className={cx("cardTitle")}>{assessmentTitle(assessment.title)}</h2>
                <p className={cx("metadata")}>Target level: {assessment.targetLevel}</p>
                <p className={cx("metadata")}>
                  Time limit: {assessmentTimeLimit(assessment.timeLimitMinutes)}
                </p>
                <AppLink
                  to={`/my-learning/assessments/${encodeURIComponent(assessment.assessmentId)}`}
                  variant="outline"
                >
                  View assessment
                </AppLink>
              </article>
            ))}
          </div>
        )}
      </ResourceState>

      {!isLoading && !error && data?.totalPages > 0 && (
        <nav className={cx("pagination")} aria-label="Assessment pages">
          <Button
            variant="outline"
            disabled={data.page <= 0}
            onClick={() => setPage(data.page - 1)}
          >
            Previous
          </Button>
          <span>Page {data.page + 1} of {data.totalPages}</span>
          <Button
            variant="outline"
            disabled={data.page + 1 >= data.totalPages}
            onClick={() => setPage(data.page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </section>
  );
}
