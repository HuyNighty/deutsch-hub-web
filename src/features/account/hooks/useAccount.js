import { useQuery } from "@tanstack/react-query";
import { getAccount } from "../services/account.service";

function useAccount() {
  const {
    data: account,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["account"],
    queryFn: getAccount,
  });

  return { account, loading, error, refetch };
}

export default useAccount;
