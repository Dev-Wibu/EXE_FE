import { useQuery } from "@tanstack/react-query";
import type { components } from "../../schema-from-be";

type RoundConfig = components["schemas"]["RoundConfig"];
type CodingProblemSnapshot = components["schemas"]["CodingProblemSnapshot"];

export interface CodingRoundConfig {
  roundId: number;
  roundName: string;
  maxScore: number;
  passThreshold: number;
  timeLimitMinutes: number;
  codingProblems: CodingProblemSnapshot[];
}

export function useRoundConfig(jdId: number) {
  return useQuery({
    queryKey: ["job-description", jdId, "coding-round-config"],
    queryFn: async (): Promise<CodingRoundConfig | null> => {
      const { fetchClient } = await import("@/lib/api");
      const result = await fetchClient.GET("/api/job-descriptions/{id}", {
        params: { path: { id: jdId } },
      });

      if (!result.response?.ok) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jd = result.data as any;
      const rounds: Array<{
        id?: number;
        name?: string;
        roundType?: string;
        passThreshold?: number;
        configData?: RoundConfig;
      }> = jd?.rounds ?? [];

      const codingRound = rounds.find((r) => r.roundType === "CODING");
      if (!codingRound || !codingRound.id) return null;

      const configData: RoundConfig | undefined = codingRound.configData as RoundConfig;

      return {
        roundId: codingRound.id,
        roundName: codingRound.name ?? "Vòng Lập trình",
        maxScore: configData?.maxScore ?? 100,
        passThreshold: codingRound.passThreshold ?? 0.7,
        timeLimitMinutes: configData?.timeLimitMinutes ?? 60,
        codingProblems: configData?.codingProblems ?? [],
      };
    },
    enabled: jdId > 0,
  });
}
