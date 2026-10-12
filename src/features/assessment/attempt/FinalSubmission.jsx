import { Button } from "@/shared/ui/components/button";
import { AppLink } from "@/shared/ui/components/app-link";
import { resultRoute } from "../result/result-query";
import { useFinalSubmit } from "./hooks/useFinalSubmit";
import { assessmentExecutionError } from "../shared/assessment-execution-error";

export default function FinalSubmission({ attempt, definition }) {
  const mutation = useFinalSubmit(attempt, definition);
  return (
    <section lang="vi" aria-label="Hoàn tất bài đánh giá">
      {mutation.isSuccess ? <p role="status">Thao tác hoàn tất bài đánh giá đã thành công.</p>
        : attempt.status === "COMPLETED" ? <p>Lượt làm bài đánh giá đã hoàn thành.</p>
        : ["IN_PROGRESS", "EXPIRED"].includes(attempt.status) && (
          <Button onClick={mutation.submit} loading={mutation.isPending} disabled={mutation.childrenPending}>
            {attempt.status === "EXPIRED" ? "Hoàn tất bài đánh giá đã hết hạn" : "Nộp bài đánh giá"}
          </Button>
        )}
      {mutation.error && <p role="alert">{assessmentExecutionError(mutation.error, "finalSubmit")}</p>}
      {(mutation.isSuccess || ["COMPLETED", "EXPIRED"].includes(attempt.status)) && (
        <AppLink to={resultRoute(attempt.assessmentAttemptId)} variant="primary">Xem kết quả</AppLink>
      )}
    </section>
  );
}
