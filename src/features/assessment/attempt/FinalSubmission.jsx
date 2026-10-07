import { Button } from "@/shared/ui/components/button";
import { useFinalSubmit } from "./hooks/useFinalSubmit";

export default function FinalSubmission({ attempt, definition }) {
  const mutation = useFinalSubmit(attempt, definition);
  return (
    <section aria-label="Assessment finalization">
      {mutation.isSuccess ? <p role="status">Assessment finalized successfully.</p>
        : attempt.status === "COMPLETED" ? <p>Assessment completed.</p>
        : ["IN_PROGRESS", "EXPIRED"].includes(attempt.status) && (
          <Button onClick={mutation.submit} loading={mutation.isPending} disabled={mutation.childrenPending}>
            {attempt.status === "EXPIRED" ? "Finalize expired assessment" : "Submit assessment"}
          </Button>
        )}
      {mutation.error && <p role="alert">{mutation.error.message}</p>}
    </section>
  );
}
