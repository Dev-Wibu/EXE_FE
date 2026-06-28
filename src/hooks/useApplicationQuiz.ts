import { getNormalizedErrorMessage } from "@/lib/error-normalizer";
import { applicationDetailManager } from "@/services/application-detail.manager";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { components } from "../../schema-from-be";

type ApplicationDetail = components["schemas"]["ApplicationDetail"];
type SubmissionResult = components["schemas"]["SubmissionResult"];
type SubmissionData = components["schemas"]["SubmissionData"];
type QuizAnswer = components["schemas"]["QuizAnswer"];

// ============================================================
// Types
// ============================================================

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer?: string;
  points?: number;
}

export interface QuizAnswerState {
  questionIndex: number;
  selectedAnswer: string | null;
}

export interface QuizResult {
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
}

export interface QuizState {
  answers: Record<number, string>; // questionIndex -> selectedAnswer
  currentIndex: number;
  startedAt: string;
  timeLimitSeconds: number;
}

// ============================================================
// Quiz State Hook (persisted in URL + sessionStorage)
// ============================================================

export function useQuizState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getQuizState = useCallback((): QuizState | null => {
    const saved = sessionStorage.getItem("quizState");
    return saved ? JSON.parse(saved) : null;
  }, []);

  const saveQuizState = useCallback((state: QuizState) => {
    sessionStorage.setItem("quizState", JSON.stringify(state));
  }, []);

  const clearQuizState = useCallback(() => {
    sessionStorage.removeItem("quizState");
  }, []);

  // Persist to URL (for deep link / F5 recovery)
  const persistToUrl = useCallback(
    (answers: Record<number, string>, currentIndex: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("answers", JSON.stringify(answers));
      params.set("idx", String(currentIndex));
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const recoverFromUrl = useCallback((): {
    answers: Record<number, string>;
    currentIndex: number;
  } | null => {
    const answersStr = searchParams.get("answers");
    const idxStr = searchParams.get("idx");
    if (!answersStr || !idxStr) return null;
    try {
      const answers = JSON.parse(answersStr) as Record<number, string>;
      const currentIndex = parseInt(idxStr, 10);
      if (isNaN(currentIndex)) return null;
      return { answers, currentIndex };
    } catch {
      return null;
    }
  }, [searchParams]);

  return {
    getQuizState,
    saveQuizState,
    clearQuizState,
    persistToUrl,
    recoverFromUrl,
  };
}

// ============================================================
// Fetch Quiz Questions (from round config via application details)
// ============================================================

/**
 * Get quiz questions from the current round's config
 * Requires: applicationId + roundId to find the right detail
 */
export function useQuizQuestions(applicationId: number, roundId: number) {
  return useQuery({
    queryKey: ["quiz", "questions", applicationId, roundId],
    queryFn: async (): Promise<QuizQuestion[]> => {
      // Fetch the application detail to get round config with quiz questions
      const result = await applicationDetailManager.getByApplicationId(applicationId);
      if (!result.success) throw new Error(result.error);

      const details = result.data ?? [];
      const detail = details.find((d) => d.roundId === roundId);
      if (!detail) throw new Error("Round not found");

      // Round config should contain quizQuestions
      // For now, extract from submissionData if exists (for resuming)
      // The actual questions should come from a dedicated endpoint or cached in the round config
      // We'll use the detail's round config if available via another fetch

      // Fetch round details to get the quiz questions config
      // Since the BE doesn't have a direct "get round config" endpoint for quiz questions,
      // we need to use the existing data. In some cases, the questions might be stored
      // in the round config that's part of JD setup.
      // For now, return questions from submission data if already answered, else empty
      // This will be populated when user starts the quiz via the quiz page

      return [];
    },
    enabled: applicationId > 0 && roundId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================
// Get Quiz Config from JD rounds
// ============================================================

export interface QuizConfig {
  roundId: number;
  roundName: string;
  instruction?: string;
  timeLimitMinutes: number;
  maxScore: number;
  questions: QuizQuestion[];
}

/**
 * Get quiz config from JD rounds
 * Requires: jdId to fetch JD with rounds config
 */
export function useQuizConfig(jdId: number, roundId: number) {
  return useQuery({
    queryKey: ["quiz", "config", jdId, roundId],
    queryFn: async (): Promise<QuizConfig | null> => {
      const { fetchClient } = await import("@/lib/api");
      const result = await fetchClient.GET("/api/job-descriptions/{id}", {
        params: { path: { id: jdId } },
      });

      if (!result.response?.ok) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jd = result.data as any;

      const rounds = jd.rounds as Array<{
        id?: number;
        name?: string;
        roundOrder?: number;
        roundType?: string;
        passThreshold?: number;
        configData?: {
          instruction?: string;
          timeLimitMinutes?: number;
          maxScore?: number;
          quizQuestions?: QuizQuestion[];
        };
      }>;

      const round = rounds?.find((r) => r.id === roundId);
      if (!round || round.roundType !== "QUIZ") return null;

      const questions = round.configData?.quizQuestions ?? [];

      return {
        roundId: round.id!,
        roundName: round.name ?? "Quiz",
        instruction: round.configData?.instruction,
        timeLimitMinutes: round.configData?.timeLimitMinutes ?? 30,
        maxScore: round.configData?.maxScore ?? 100,
        questions,
      };
    },
    enabled: jdId > 0 && roundId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Submit Quiz Answers
// ============================================================

export interface SubmitQuizParams {
  applicationId: number;
  answers: string[]; // Array of selected answers in order
}

export interface SubmitQuizResult {
  success: boolean;
  data?: SubmissionResult;
  error?: string;
}

export function useSubmitQuiz(options?: {
  onSuccess?: (result: SubmissionResult) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitQuizParams): Promise<SubmissionResult> => {
      const result = await applicationDetailManager.submit({
        applicationId: params.applicationId,
        quizAnswers: params.answers,
      });

      if (!result.success) {
        throw new Error(result.error ?? "Submit failed");
      }

      return result.data!;
    },
    onSuccess: (data) => {
      toast.success("Nộp bài quiz thành công!");
      queryClient.invalidateQueries({ queryKey: ["applicationDetails"] });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      const message = getNormalizedErrorMessage(error);
      toast.error(message);
      options?.onError?.(message);
    },
  });
}

// ============================================================
// Parse Quiz Result from ApplicationDetail
// ============================================================

export function useQuizResult(detail: ApplicationDetail | undefined | null): {
  score: number | null;
  totalQuestions: number;
  correctCount: number;
  results: QuizResult[];
  maxScore: number;
} {
  return useMemo(() => {
    if (!detail) {
      return { score: null, totalQuestions: 0, correctCount: 0, results: [], maxScore: 0 };
    }

    const submissionData = detail.submissionData as SubmissionData | undefined;
    const quizAnswers = submissionData?.quizAnswers as QuizAnswer[] | undefined;

    if (!quizAnswers || quizAnswers.length === 0) {
      return { score: null, totalQuestions: 0, correctCount: 0, results: [], maxScore: 0 };
    }

    const results: QuizResult[] = quizAnswers.map((qa) => ({
      questionText: qa.questionText ?? "",
      selectedAnswer: qa.selectedAnswer ?? null,
      correctAnswer: (qa as { correctAnswer?: string }).correctAnswer ?? null,
      isCorrect: qa.isCorrect ?? false,
    }));

    const correctCount = quizAnswers.filter((qa) => qa.isCorrect).length;
    const totalQuestions = quizAnswers.length;

    // Calculate score based on finalScore or derive from correct count
    let score = detail.finalScore;
    if (score === undefined || score === null) {
      // Derive from correct count (each question = 100 / total)
      score = Math.round((correctCount / totalQuestions) * 100);
    }

    const maxScore = detail.finalScore ?? 100;

    return { score, totalQuestions, correctCount, results, maxScore };
  }, [detail]);
}
