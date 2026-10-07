import { Button } from "@/shared/ui/components/button";
import { useCompetency } from "./hooks/useCompetency";

export default function CurrentLevel() {
  const query = useCompetency();
  return (
    <section aria-label="Current German level">
      <h2>Current German level</h2>
      {query.isPending ? <p role="status">Loading current German level...</p>
        : query.error ? <>
          <p role="alert">Unable to load current German level. {query.error.message}</p>
          <Button onClick={() => query.refetch()} loading={query.isFetching}>Retry current level</Button>
        </>
        : query.data && <p>{query.data.currentLevel === "UNKNOWN" ? "Not established yet" : query.data.currentLevel}</p>}
    </section>
  );
}
