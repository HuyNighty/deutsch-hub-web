import { useQuery } from "@tanstack/react-query";
import { getSessions } from "../services/account.service";

export const sessionsQueryKey = ["account", "sessions"];

export default function useSessions() {
  const { data: sessions, isLoading: loading, error, refetch } = useQuery({
    queryKey: sessionsQueryKey,
    queryFn: ({ signal }) => getSessions({ signal }),
  });
  return { sessions, loading, error, refetch };
}
