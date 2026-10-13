import { assessmentFixture } from "../interaction-fixtures";
import { isUnresolved } from "../interaction-state";
import base from "../research.module.css";
import styles from "../interaction.module.css";

const phaseCopy = {
  idle: "Chưa bắt đầu thao tác mô phỏng mới.",
  pending: "Đang chờ kết quả kịch bản. Chưa có xác nhận mới.",
  confirmed: "Đã xác nhận trong mô phỏng. Không có lưu dữ liệu Backend.",
  error: "Kịch bản báo lỗi xác định. Lựa chọn đã xác nhận không thay đổi.",
  uncertain: "Kết quả chưa xác định. Chưa thể kết luận thao tác thành công hoặc thất bại. Không tự thử lại.",
};

export default function AssessmentProbe({ state, onEdit }) {
  const question = assessmentFixture.runtime.questions[0];
  const selection = (ids) => question.options.map((option, index) => ids.includes(option.answerId) ? String.fromCharCode(65 + index) : null).filter(Boolean).join(", ") || "Không có";
  return (
    <>
      <p className={base.eyebrow}>BỐI CẢNH ĐỐI CHỨNG · TƯƠNG TÁC ĐÁNH GIÁ</p>
      <h1 id="interaction-heading" className={base.title}>Tập trung vào từng lựa chọn</h1>
      <p className={base.lead} data-testid="task-status">Trạng thái bài tập: {state.taskStatus === "SUBMITTED" ? "Đã nộp" : "Đang thực hiện"}</p>
      <p data-testid="assessment-status">Bài đánh giá: Đang thực hiện</p>
      <p data-testid="official-result">Chưa có kết quả chính thức.</p>
      <fieldset className={base.question} disabled={isUnresolved(state) || state.taskStatus !== "IN_PROGRESS"} aria-busy={state.phase === "pending"}>
        <legend>Câu hỏi {question.order} · Chọn nhiều đáp án</legend>
        <p lang="de" className={base.questionText}>{question.content}</p>
        <div className={base.options}>
          {question.options.map((option) => <label className={`${base.option} ${styles.option}`} key={option.answerId}>
            <input type="checkbox" checked={state.draft.includes(option.answerId)} onChange={() => onEdit(option.answerId)} />
            <span lang="de">{option.content}</span>
          </label>)}
        </div>
      </fieldset>
      <dl className={styles.selections}>
        <div><dt>Lựa chọn đã xác nhận trong mô phỏng</dt><dd data-testid="saved-selection">{selection(state.saved)}</dd></div>
        <div><dt>Bản nháp cục bộ</dt><dd data-testid="draft-selection">{selection(state.draft)}</dd></div>
      </dl>
      <p className={styles.feedback} role={state.phase === "error" ? "alert" : "status"} aria-atomic="true" data-testid="operation-status">{phaseCopy[state.phase]}</p>
    </>
  );
}
