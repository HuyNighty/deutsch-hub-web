import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { useAttemptDefinition } from "../attempt/hooks/useAttemptDefinition";
import { assessmentTitle } from "../shared/assessment-presentation";
import { useAssessmentResult } from "./hooks/useAssessmentResult";
import ResultEvidence from "./ResultEvidence";
import CurrentLevel from "./CurrentLevel";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

export default function AssessmentResult() {
  const { assessmentAttemptId } = useParams();
  const parentRoute = `/my-learning/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}`;
  const definition = useAttemptDefinition(assessmentAttemptId);
  const result = useAssessmentResult(assessmentAttemptId, definition.error ? null : definition.data);
  return (
    <section className={cx("page")} aria-label="Assessment result page">
      <AppLink to={parentRoute}>Back to assessment</AppLink>
      <ResourceState loading={definition.isPending} error={definition.error} errorProps={{
        onRetry: definition.refetch,
        actions: {
          notFound: { to: parentRoute, label: "Back to assessment" },
          forbidden: { to: parentRoute, label: "Back to assessment" },
        },
      }}>
        {definition.data && !definition.error && <>
          <h1 className={cx("title")}>{assessmentTitle(definition.data.title)}</h1>
          <ResultEvidence query={result} definition={definition.data} />
        </>}
      </ResourceState>
      <CurrentLevel />
    </section>
  );
}
