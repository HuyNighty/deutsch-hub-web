import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { useAttemptDefinition } from "../attempt/hooks/useAttemptDefinition";
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
    <section className={cx("page")} lang="vi" aria-label="Trang kết quả đánh giá">
      <AppLink to={parentRoute}>Quay lại bài đánh giá</AppLink>
      {definition.isPending ? <p role="status">Đang tải thông tin bài đánh giá...</p>
        : definition.error ? <>
          <p role="alert">{definition.error.status === 403
            ? "Bạn không có quyền xem bài đánh giá này."
            : definition.error.status === 404 ? "Không tìm thấy bài đánh giá này."
              : "Không thể tải thông tin bài đánh giá. Vui lòng thử lại."}</p>
          {![403, 404].includes(definition.error.status) &&
            <Button onClick={() => definition.refetch()} loading={definition.isFetching}>Thử tải lại bài đánh giá</Button>}
        </>
        : definition.data && <>
          <h1 className={cx("title")}>{definition.data.title ?? "Bài đánh giá chưa có tên"}</h1>
          <ResultEvidence query={result} definition={definition.data} />
        </>}
      <CurrentLevel />
    </section>
  );
}
