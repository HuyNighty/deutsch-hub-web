import { assessmentFixture } from "./interaction-fixtures";

const question = assessmentFixture.runtime.questions[0];
const allowedAnswers = question.options.map((option) => option.answerId);
export const sameSelection = (a, b) => a.length === b.length && a.every((id) => b.includes(id));
export const isUnresolved = (state) => state.phase === "pending" || state.phase === "uncertain";

export function initialAssessmentState(epoch = 0) {
  return {
    epoch,
    saved: [...question.selectedAnswerIds],
    draft: [...question.selectedAnswerIds],
    phase: "idle",
    operation: null,
    started: 0,
    ignored: 0,
    taskStatus: "IN_PROGRESS",
    assessmentStatus: "IN_PROGRESS",
    officialResult: null,
  };
}

export function assessmentTransition(state, event) {
  if (event.type === "reset") return initialAssessmentState(state.epoch + 1);
  if (event.type === "edit") {
    if (isUnresolved(state) || state.taskStatus !== "IN_PROGRESS" || !allowedAnswers.includes(event.answerId)) return state;
    const draft = state.draft.includes(event.answerId)
      ? state.draft.filter((id) => id !== event.answerId) : [...state.draft, event.answerId];
    return { ...state, draft, phase: "idle", operation: null };
  }
  if (event.type === "start") {
    if (isUnresolved(state) || state.taskStatus !== "IN_PROGRESS" || !["save", "submit"].includes(event.kind)) return state;
    const dirty = !sameSelection(state.draft, state.saved);
    if ((event.kind === "save" && !dirty) || (event.kind === "submit" && dirty)) return state;
    const operation = Object.freeze({ epoch: state.epoch, id: state.started + 1, kind: event.kind, payload: Object.freeze([...state.draft]) });
    return { ...state, phase: "pending", operation, started: state.started + 1 };
  }
  if (event.type === "settle") {
    const ticket = event.ticket;
    const current = state.operation;
    if (state.phase !== "pending" || !current || !ticket || ticket.epoch !== current.epoch || ticket.id !== current.id || ticket.kind !== current.kind) {
      return { ...state, ignored: state.ignored + 1 };
    }
    if (event.outcome === "confirmed") {
      return { ...state, phase: "confirmed", operation: null,
        saved: current.kind === "save" ? [...current.payload] : state.saved,
        taskStatus: current.kind === "submit" ? "SUBMITTED" : state.taskStatus };
    }
    if (event.outcome === "error") return { ...state, phase: "error", operation: null };
    if (event.outcome === "uncertain") return { ...state, phase: "uncertain" };
  }
  return state;
}
