import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import { resultSkillLabels, resultOutcome, resultErrorMessage } from "./result-presentation";
import SkillGuidance from "./guidance/SkillGuidance";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

export default function ResultEvidence({ query, definition }) {
  return (
    <section aria-label="Kết quả đánh giá chính thức">
      <h2>Kết quả đánh giá chính thức</h2>
      {query.isPending ? <p role="status">Đang tải kết quả đánh giá...</p>
        : query.error ? <>
          <p role="alert">{resultErrorMessage(query.error)}</p>
          <Button onClick={() => query.refetch()} loading={query.isFetching}>Thử tải lại kết quả</Button>
        </>
        : query.data && <>
          <p>Trình độ mục tiêu: {query.data.targetLevel}</p>
          <p>Kết quả tổng thể: {resultOutcome(query.data.passed)}</p>
          <div className={cx("components")}>
            {definition.components.map((component) => {
              const result = query.data.componentResults.find((item) => item.componentId === component.componentId);
              return (
                <article className={cx("card")} key={component.componentId} aria-label={`Kết quả kỹ năng ${resultSkillLabels[component.skillDimension]}`}>
                  <h3 className={cx("cardTitle")}>{resultSkillLabels[component.skillDimension]}</h3>
                  <p>Tỷ lệ điểm đạt được: {result.performance}%</p>
                  <p>Kết quả: {resultOutcome(result.passed)}</p>
                  <SkillGuidance targetLevel={query.data.targetLevel} skillDimension={result.skillDimension} passed={result.passed} />
                </article>
              );
            })}
          </div>
        </>}
    </section>
  );
}
