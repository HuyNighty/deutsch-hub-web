import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { useLearnerAssessment } from "./hooks/useLearnerAssessment";
import AssessmentEntry from "./AssessmentEntry";
import AssessmentStructure from "../shared/AssessmentStructure";
import {
  assessmentTitle,
  assessmentTimeLimit,
} from "../shared/assessment-presentation";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

export default function AssessmentDetail() {
  const { assessmentId } = useParams();
  const { data: assessment, isLoading, error, refetch } = useLearnerAssessment(assessmentId);

  return (
    <section className={cx("page")} aria-label="Chi tiết bài đánh giá">
      <AppLink lang="vi" to="/my-learning/assessments">Quay lại bài đánh giá</AppLink>
      <ResourceState
        loading={isLoading}
        error={error}
        errorProps={{
          onRetry: refetch,
          actions: {
            notFound: { to: "/my-learning/assessments", label: "Khám phá bài đánh giá" },
          },
        }}
      >
        {assessment && (
          <>
            <header className={cx("header")}>
              <h1 lang={assessment.title === null ? "vi" : undefined} className={cx("title")}>{assessmentTitle(assessment.title)}</h1>
              <p lang="vi" className={cx("metadata")}>Trình độ mục tiêu: {assessment.targetLevel}</p>
              <p lang="vi" className={cx("metadata")}>Giới hạn thời gian: {assessmentTimeLimit(assessment.timeLimitMinutes)}</p>
            </header>
            <AssessmentEntry assessmentId={assessmentId} />
            <AssessmentStructure components={assessment.components} />
          </>
        )}
      </ResourceState>
    </section>
  );
}
