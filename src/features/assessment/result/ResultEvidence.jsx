import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import { skillLabels } from "../shared/assessment-presentation";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);
const outcome = (passed) => passed ? "Passed" : "Not passed";

export default function ResultEvidence({ query, definition }) {
  return (
    <section aria-label="Assessment result">
      <h2>Assessment result</h2>
      {query.isPending ? <p role="status">Loading assessment result...</p>
        : query.error ? <>
          <p role="alert">{query.error.status === 404
            ? "Assessment result is not available yet." : query.error.message}</p>
          <Button onClick={() => query.refetch()} loading={query.isFetching}>Retry result</Button>
        </>
        : query.data && <>
          <p>Assessment target: {query.data.targetLevel}</p>
          <p>Overall result: {outcome(query.data.passed)}</p>
          <div className={cx("components")}>
            {definition.components.map((component) => {
              const result = query.data.componentResults.find((item) => item.componentId === component.componentId);
              return (
                <article className={cx("card")} key={component.componentId} aria-label={`${skillLabels[component.skillDimension]} result`}>
                  <h3 className={cx("cardTitle")}>{skillLabels[component.skillDimension]}</h3>
                  <p>Performance: {result.performance}%</p>
                  <p>Result: {outcome(result.passed)}</p>
                </article>
              );
            })}
          </div>
        </>}
    </section>
  );
}
