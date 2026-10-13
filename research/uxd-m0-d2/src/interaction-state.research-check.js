import { describe, it, expect } from "vitest";
import { initialAssessmentState, assessmentTransition as transition } from "./interaction-state";
import { assessmentFixture } from "./interaction-fixtures";

const [a, b] = assessmentFixture.runtime.questions[0].options.map((option) => option.answerId);
function pending() {
  const edited = transition(initialAssessmentState(), { type: "edit", answerId: b });
  return transition(edited, { type: "start", kind: "save" });
}

describe("Research-only operation evidence", () => {
  it("starts saved A independently from draft, operation and result state", () => {
    const state = initialAssessmentState();
    expect(state.saved).toEqual([a]);
    expect(state.draft).toEqual([a]);
    expect(state.saved).not.toBe(state.draft);
    expect(state).toMatchObject({ phase: "idle", operation: null, taskStatus: "IN_PROGRESS", assessmentStatus: "IN_PROGRESS", officialResult: null });
  });
  it("edits only the draft and freezes the operation payload", () => {
    const state = pending();
    expect(state.saved).toEqual([a]);
    expect(state.draft).toEqual([a, b]);
    expect(state.operation.payload).toEqual([a, b]);
    expect(Object.isFrozen(state.operation.payload)).toBe(true);
    expect(transition(state, { type: "edit", answerId: a })).toBe(state);
  });
  it("prevents duplicate saves and submissions while pending", () => {
    const state = pending();
    expect(transition(state, { type: "start", kind: "save" })).toBe(state);
    expect(transition(state, { type: "start", kind: "submit" })).toBe(state);
    expect(state.started).toBe(1);
  });
  it.each(["confirmed", "error", "uncertain"])("%s retains the appropriate canonical evidence", (outcome) => {
    const state = pending();
    const settled = transition(state, { type: "settle", ticket: state.operation, outcome });
    expect(settled.phase).toBe(outcome);
    expect(settled.saved).toEqual(outcome === "confirmed" ? [a, b] : [a]);
    expect(settled).toMatchObject({ assessmentStatus: "IN_PROGRESS", taskStatus: "IN_PROGRESS", officialResult: null, started: 1 });
  });
  it("blocks uncertain retries and rejects an unsolicited late confirmation", () => {
    const state = pending();
    const uncertain = transition(state, { type: "settle", ticket: state.operation, outcome: "uncertain" });
    expect(transition(uncertain, { type: "start", kind: "save" })).toBe(uncertain);
    const late = transition(uncertain, { type: "settle", ticket: state.operation, outcome: "confirmed" });
    expect(late).toMatchObject({ phase: "uncertain", saved: [a], started: 1, ignored: 1 });
  });
  it("reset rejects a stale ticket even while a newer operation is pending", () => {
    const old = pending();
    const reset = transition(old, { type: "reset" });
    expect(reset).toEqual(initialAssessmentState(old.epoch + 1));
    const next = transition(transition(reset, { type: "edit", answerId: b }), { type: "start", kind: "save" });
    const late = transition(next, { type: "settle", ticket: old.operation, outcome: "confirmed" });
    expect(late).toMatchObject({ saved: [a], phase: "pending", ignored: 1 });
    expect(late.operation).toBe(next.operation);
  });
  it("submits only the Task and does not complete or grade its parent", () => {
    const state = transition(initialAssessmentState(), { type: "start", kind: "submit" });
    const submitted = transition(state, { type: "settle", ticket: state.operation, outcome: "confirmed" });
    expect(submitted).toMatchObject({ taskStatus: "SUBMITTED", assessmentStatus: "IN_PROGRESS", officialResult: null });
    expect(transition(submitted, { type: "edit", answerId: b })).toBe(submitted);
    expect(transition(submitted, { type: "start", kind: "submit" })).toBe(submitted);
  });
  it("requires confirmed draft saving before simulated Task submission", () => {
    const dirty = transition(initialAssessmentState(), { type: "edit", answerId: b });
    expect(transition(dirty, { type: "start", kind: "submit" })).toBe(dirty);
  });
});
