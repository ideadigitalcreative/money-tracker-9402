import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useRef } from "react";
import { financeSchema, type Finance, type Currency } from "../../shared/finance";
export function useFinance() {
  const queryClient = useQueryClient();
  const busy = useRef(false);
  const query = useQuery(
    orpc.finance.read.queryOptions({ staleTime: 10000, refetchInterval: 30000 }),
  );
  const save = useMutation(orpc.finance.save.mutationOptions());
  async function commit(state: Finance) {
    if (!query.data || busy.current) throw new Error("Sync in progress. Please try again.");
    busy.current = true;
    try {
      const parsed = financeSchema.parse(state);
      const data = await save.mutateAsync({ state: parsed, revision: query.data.revision });
      queryClient.setQueryData(orpc.finance.read.queryOptions().queryKey, data);
      return data;
    } catch (e) {
      await query.refetch();
      throw e;
    } finally {
      busy.current = false;
    }
  }
  return { query, commit, saving: save.isPending };
}
export const useExchange = (base: Currency) =>
  useQuery(orpc.exchange.rates.queryOptions({ input: { base }, staleTime: 3600000, retry: 1 }));
export const useAIDraft = () => useMutation(orpc.intelligence.draft.mutationOptions());
export const useAIAnalysis = () => useMutation(orpc.intelligence.analyze.mutationOptions());
