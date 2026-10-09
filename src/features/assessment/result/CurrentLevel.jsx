import { Button } from "@/shared/ui/components/button";
import { useCompetency } from "./hooks/useCompetency";

export default function CurrentLevel() {
  const query = useCompetency();
  return (
    <section aria-label="Trình độ tiếng Đức hiện tại">
      <h2>Trình độ tiếng Đức hiện tại</h2>
      {query.isPending ? <p role="status">Đang tải trình độ tiếng Đức hiện tại...</p>
        : query.error ? <>
          <p role="alert">Không thể tải trình độ tiếng Đức hiện tại. Vui lòng thử lại.</p>
          <Button onClick={() => query.refetch()} loading={query.isFetching}>Thử tải lại trình độ hiện tại</Button>
        </>
        : query.data && <p>{query.data.currentLevel === "UNKNOWN" ? "Chưa xác định" : query.data.currentLevel}</p>}
    </section>
  );
}
