import { isApiError } from "@/shared/api/api-error";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { useLearningJourney } from "../attempt/hooks/useLearningJourney";
import { useStartAssessment } from "../attempt/hooks/useStartAssessment";

export default function AssessmentEntry({ assessmentId }) {
  const journey = useLearningJourney();
  const start = useStartAssessment(assessmentId);

  return (
    <section lang="vi" aria-label="Bắt đầu hoặc tiếp tục bài đánh giá">
      {start.error && <p role="alert">{startErrorLabel(start.error)}</p>}
      {journey.isPending || journey.isFetching ? (
        <p role="status">Đang kiểm tra lượt làm bài đánh giá...</p>
      ) : journey.error ? (
        <>
          <p role="alert">Không thể kiểm tra lượt làm bài đánh giá.</p>
          <Button onClick={() => journey.refetch()}>Kiểm tra lại lượt làm bài</Button>
        </>
      ) : (
        <AssessmentAction
          existing={journey.data.assessmentAttempts.find((attempt) => attempt.assessmentId === assessmentId)}
          start={start}
        />
      )}
    </section>
  );
}

function AssessmentAction({ existing, start }) {
  if (existing) {
    return <AppLink to={`/my-learning/assessment-attempts/${encodeURIComponent(existing.assessmentAttemptId)}`}>
      Tiếp tục bài đánh giá
    </AppLink>;
  }
  return <Button onClick={start.start} loading={start.isPending}>Bắt đầu bài đánh giá</Button>;
}

function startErrorLabel(error) {
  if (["ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK", "NETWORK_ERROR"].includes(error.code)) {
    return "Chưa thể xác nhận yêu cầu bắt đầu bài đánh giá. Yêu cầu có thể đã được ghi nhận. Vui lòng kiểm tra lại lượt làm bài trước khi thử lại.";
  }
  if (error.status === 409) {
    return "Chưa thể bắt đầu bài đánh giá do xung đột trạng thái. Vui lòng kiểm tra lại lượt làm bài.";
  }
  if (error.status === 403) return "Bạn không có quyền bắt đầu bài đánh giá này.";
  if (error.status === 404) return "Không tìm thấy bài đánh giá này.";
  if (isApiError(error) && error.status === null && error.code === null &&
      error.message === "The server returned an invalid assessment start response.") {
    return "Máy chủ trả về thông tin bắt đầu bài đánh giá không hợp lệ.";
  }
  return "Không thể bắt đầu bài đánh giá. Vui lòng kiểm tra lại lượt làm bài trước khi thử lại.";
}
