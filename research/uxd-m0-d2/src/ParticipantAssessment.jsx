import { useEffect, useReducer, useRef } from "react";
import { assessmentFixture } from "./interaction-fixtures";
import { assessmentTransition, isUnresolved, sameSelection } from "./interaction-state";
import { assessmentCases, assessmentCaseState } from "./participant-scenarios";
import base from "./research.module.css";
import interaction from "./interaction.module.css";
import styles from "./participant.module.css";

export default function ParticipantAssessment({ caseId, pendingMs }) {
  const scenario = assessmentCases[caseId];
  const [state, dispatch] = useReducer(assessmentTransition, caseId, assessmentCaseState);
  const claimed = useRef(false);
  const question = assessmentFixture.runtime.questions[0];
  const dirty = !sameSelection(state.saved, state.draft);
  const canStart = scenario.live && state.started === 0 && !isUnresolved(state)
    && (scenario.kind === "save" ? dirty : !dirty);

  useEffect(() => {
    if (!scenario.live || state.phase !== "pending") return;
    const ticket = state.operation;
    const timer = setTimeout(() => dispatch({ type: "settle", ticket, outcome: scenario.outcome }), pendingMs);
    return () => clearTimeout(timer);
  }, [scenario, state.phase, state.operation, pendingMs]);

  function start() {
    if (!canStart || claimed.current) return;
    claimed.current = true;
    dispatch({ type: "start", kind: scenario.kind });
  }

  const feedback = {
    idle: "Chưa bắt đầu thao tác mô phỏng mới.",
    pending: "Đang chờ kết quả mô phỏng. Chưa có xác nhận mới.",
    confirmed: scenario.kind === "submit"
      ? "Đã xác nhận nộp bài tập trong mô phỏng. Bài đánh giá vẫn đang thực hiện; chưa có kết quả chính thức."
      : "Đã xác nhận lựa chọn trong mô phỏng. Không có lưu dữ liệu Backend.",
    uncertain: "Kết quả chưa xác định. Chưa thể kết luận thành công hoặc thất bại. Không tự thử lại.",
  };
  function selection(ids) {
    const options = question.options.filter((option) => ids.includes(option.answerId));
    return options.length ? <ul>{options.map((option) => <li key={option.answerId} lang="de">{option.content}</li>)}</ul> : "Không có lựa chọn";
  }

  return <>
    <p className={base.eyebrow}>TƯƠNG TÁC ĐÁNH GIÁ</p>
    <h1 id="interaction-heading" className={base.title}>Tập trung vào từng lựa chọn</h1>
    <p className={base.lead} data-testid="task-status">Trạng thái bài tập: {state.taskStatus === "SUBMITTED" ? "Đã nộp" : "Đang thực hiện"}</p>
    <p data-testid="assessment-status">Bài đánh giá: Đang thực hiện</p>
    <p data-testid="official-result">Chưa có kết quả chính thức.</p>
    <fieldset className={base.question} aria-describedby="participant-question"
      disabled={isUnresolved(state) || state.taskStatus !== "IN_PROGRESS" || scenario.snapshot} aria-busy={state.phase === "pending"}>
      <legend>Câu hỏi {question.order} · Chọn nhiều đáp án</legend>
      <p id="participant-question" lang="de" className={base.questionText}>{question.content}</p>
      <div className={base.options}>
        {question.options.map((option) => <label className={[base.option, interaction.option].join(" ")} key={option.answerId}>
          <input type="checkbox" checked={state.draft.includes(option.answerId)} onChange={() => dispatch({ type: "edit", answerId: option.answerId })} />
          <span lang="de">{option.content}</span>
        </label>)}
      </div>
    </fieldset>
    <dl className={interaction.selections}>
      <div><dt>Lựa chọn đã xác nhận trong mô phỏng</dt><dd data-testid="saved-selection">{selection(state.saved)}</dd></div>
      <div><dt>Bản nháp cục bộ</dt><dd data-testid="draft-selection">{selection(state.draft)}</dd></div>
    </dl>
    <div className={interaction.feedback}>
      <p role="status" aria-atomic="true" data-testid="operation-status">{feedback[state.phase] || ""}</p>
      <p role="alert" aria-atomic="true" data-testid="operation-error">{state.phase === "error" ? "Mô phỏng báo lỗi xác định. Lựa chọn đã xác nhận không thay đổi." : ""}</p>
    </div>
    {scenario.live && <div className={styles.cue}>
      <p id="participant-cue-help">Đây là tín hiệu nghiên cứu để chạy một thao tác tổng hợp; không phải nút lưu của ứng dụng.
        {scenario.kind === "save" ? " Thay đổi bản nháp trước khi chạy tình huống." : " Giữ bản nháp giống lựa chọn đã xác nhận trước khi chạy tình huống."}</p>
      <button type="button" className={base.secondaryAction} aria-describedby="participant-cue-help"
        aria-disabled={!canStart} onClick={start}>Chạy tình huống mô phỏng</button>
    </div>}
  </>;
}
