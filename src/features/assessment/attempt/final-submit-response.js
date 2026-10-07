import { ApiError } from "@/shared/api/api-error";
import { isAssessmentResult } from "../shared/assessment-result-response";

export class FinalSubmitResponseError extends ApiError {
  constructor() {
    super({ message: "The server returned an invalid assessment final submit response." });
  }
}

export function parseFinalResult(value, assessmentAttemptId, definition) {
  if (!isAssessmentResult(value, assessmentAttemptId, definition)) throw new FinalSubmitResponseError();
  return value;
}
