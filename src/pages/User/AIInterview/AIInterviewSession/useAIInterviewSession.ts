import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks";
import { $api } from "@/lib/api";
import { formatTime, formatUtcNaiveTime } from "@/lib/formatting";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { resolveAutoSendDraft } from "./speech.utils";
import { buildSpeechLanguageLabels, type ChatMessage, type SpeechLanguageCode } from "./types";
const normalizeServerTimestamp = (value?: string): string | null => {
  if (!value) {
    return null;
  }
  const normalized = formatUtcNaiveTime(value, "");
  return normalized || null;
};
const normalizeMessageContent = (value: string): string => {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};
const isEquivalentMessage = (first: ChatMessage, second: ChatMessage): boolean => {
  if (first.role !== second.role) {
    return false;
  }
  return normalizeMessageContent(first.content) === normalizeMessageContent(second.content);
};
const mergeServerAndLocalMessages = (
  serverMessages: ChatMessage[],
  localMessages: ChatMessage[]
): ChatMessage[] => {
  if (serverMessages.length === 0) {
    return localMessages;
  }
  const merged = [...serverMessages];
  let searchStart = 0;
  for (const localMessage of localMessages) {
    let matchedIndex = -1;
    for (let index = searchStart; index < merged.length; index += 1) {
      if (isEquivalentMessage(localMessage, merged[index])) {
        matchedIndex = index;
        break;
      }
    }
    if (matchedIndex >= 0) {
      if (merged[matchedIndex].timestamp === "—" && localMessage.timestamp !== "—") {
        merged[matchedIndex] = {
          ...merged[matchedIndex],
          timestamp: localMessage.timestamp,
        };
      }
      searchStart = matchedIndex + 1;
      continue;
    }
    merged.push(localMessage);
    searchStart = merged.length;
  }
  return merged;
};
const removeMergedDuplicates = (messages: ChatMessage[]): ChatMessage[] => {
  const seen = new Set<string>();
  const deduped: ChatMessage[] = [];
  for (const message of messages) {
    const fingerprint = [message.role, normalizeMessageContent(message.content)].join("|");
    if (seen.has(fingerprint)) {
      continue;
    }
    seen.add(fingerprint);
    deduped.push(message);
  }
  return deduped;
};
const applyStableMessageIds = (
  nextMessages: ChatMessage[],
  previousMessages: ChatMessage[],
  nextIdRef: {
    current: number;
  }
): ChatMessage[] => {
  const usedPreviousIndexes = new Set<number>();
  return nextMessages.map((message) => {
    const matchedIndex = previousMessages.findIndex(
      (previousMessage, index) =>
        !usedPreviousIndexes.has(index) && isEquivalentMessage(previousMessage, message)
    );
    if (matchedIndex >= 0) {
      usedPreviousIndexes.add(matchedIndex);
      return {
        ...message,
        id: previousMessages[matchedIndex].id,
      };
    }
    const newId = nextIdRef.current;
    nextIdRef.current += 1;
    return {
      ...message,
      id: newId,
    };
  });
};
const buildMessagesFromCache = (
  cacheData: {
    chatHistory?: Array<{
      questionText?: string;
      answerText?: string;
      submittedAt?: string;
      phaseName?: string;
      type?: string;
    }>;
    currentQuestionText?: string;
    currentQuestionType?: string;
  },
  fallbackTimestamp: () => string
): {
  messages: ChatMessage[];
  lastPhaseName?: string;
} => {
  const restored: ChatMessage[] = [];
  let lastPhaseName: string | undefined;
  for (const exchange of cacheData.chatHistory ?? []) {
    const serverTimestamp = normalizeServerTimestamp(exchange.submittedAt) ?? fallbackTimestamp();
    if (exchange.questionText) {
      restored.push({
        id: 0,
        role: "ai",
        content: exchange.questionText,
        timestamp: serverTimestamp,
        meta: {
          phaseName: exchange.phaseName,
          questionType: exchange.type,
        },
      });
    }
    if (exchange.answerText) {
      restored.push({
        id: 0,
        role: "user",
        content: exchange.answerText,
        timestamp: serverTimestamp,
      });
    }
    if (exchange.phaseName) {
      lastPhaseName = exchange.phaseName;
    }
  }
  if (cacheData.currentQuestionText) {
    const lastMessage = restored[restored.length - 1];
    const isDuplicateCurrentQuestion =
      lastMessage?.role === "ai" && lastMessage.content === cacheData.currentQuestionText;
    if (!isDuplicateCurrentQuestion) {
      restored.push({
        id: 0,
        role: "ai",
        content: cacheData.currentQuestionText,
        timestamp: fallbackTimestamp(),
        meta: {
          phaseName: lastPhaseName,
          questionType: cacheData.currentQuestionType,
        },
      });
    }
  }
  return {
    messages: restored,
    lastPhaseName,
  };
};
export function useAIInterviewSession(isSessionActivated = false) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [speechLanguage, setSpeechLanguage] = useState<SpeechLanguageCode>("vi-VN");

  // chatInputValue là state được lift lên từ ChatInput để callback STT có thể cập nhật trực tiếp
  const [chatInputValue, setChatInputValue] = useState("");
  const handleSpeechListeningReminder = useCallback(
    (elapsedMs: number) => {
      const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / 60000));
      toast.info(t("userMockinterview.recordingReminder", { var_0: elapsedMinutes }));
    },
    [t]
  );

  // Khởi tạo STT (Speech-to-Text) — onFinalTranscript gọi trực tiếp từ native event, không qua useEffect
  const {
    isListening,
    interimTranscript,
    isSupported: isSpeechRecognitionSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition(
    speechLanguage,
    (finalText) => {
      setChatInputValue((prev) => (prev.trim() ? prev.trim() + " " + finalText : finalText));
    },
    {
      reminderIntervalMs: 5 * 60 * 1000,
      onReminder: handleSpeechListeningReminder,
    }
  );
  const {
    speakingId,
    isSupported: isTTSSupported,
    isMuted,
    hasPreferredLanguageVoice,
    activeVoiceName,
    speak,
    cancel: cancelSpeech,
    toggleMute,
  } = useSpeechSynthesis(speechLanguage, {
    strategy: "responsive-voice-first",
  });

  // Toggle TTS cho một tin nhắn — nếu đang phát tin này thì dừng, ngược lại phát mới
  const handleToggleSpeak = useCallback(
    (text: string, id: number) => {
      if (speakingId === id) {
        cancelSpeech();
      } else {
        speak(text, id);
      }
    },
    [speak, cancelSpeech, speakingId]
  );

  // Đọc session key từ URL params
  const [searchParams] = useSearchParams();
  const sessionKey = searchParams.get("sessionKey") ?? undefined;
  const [sessionExpiredMidway, setSessionExpiredMidway] = useState(false);

  // Kiểm tra xem phiên có đã được đánh dấu hoàn thành trong localStorage chưa
  const [isAlreadyFinished] = useState<boolean>(() => {
    if (!sessionKey) return false;
    return localStorage.getItem(`interview-finished-${sessionKey}`) === "true";
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // isEvaluating = true trong khoảng 3 giây sau khi trả lời xong câu hỏi cuối cùng
  const [isEvaluating, setIsEvaluating] = useState(false);
  // Khôi phục trạng thái finished nếu phiên đã hoàn thành trước đó
  const [interviewFinished, setInterviewFinished] = useState(isAlreadyFinished);
  const [shouldAutoStartMicAfterDeviceCheck, setShouldAutoStartMicAfterDeviceCheck] =
    useState(false);
  const [currentPhase, setCurrentPhase] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  // hasStarted = true ngay nếu phiên đã hoàn thành — lịch sử chat luôn lấy từ /cache
  const [hasStarted, setHasStarted] = useState<boolean>(isAlreadyFinished);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(1);
  // Dùng ref thay vì state để guard khỏi StrictMode double-invocation
  const hasProcessedStartRef = useRef(false);
  // Ref đồng bộ với messages state để tránh stale closure trong các useEffect
  const messagesRef = useRef<ChatMessage[]>([]);
  const chatInputValueRef = useRef(chatInputValue);
  const interimTranscriptRef = useRef(interimTranscript);
  const pendingInterimForAutoSendRef = useRef("");
  const shouldAutoSendAfterStopRef = useRef(false);

  // Lấy trạng thái Redis của phiên đang chạy — nguồn dữ liệu duy nhất cho:
  // 1. Lấy dbId (numeric session ID) cho navigate đến trang kết quả
  // 2. Khôi phục lịch sử chat khi vào lại phiên (Tiếp tục phỏng vấn)
  const {
    data: cacheData,
    isLoading: isCacheLoading,
    isError: isCacheError,
  } = $api.useQuery(
    "get",
    "/api/interview-sessions/cache/{sessionKey}",
    {
      params: {
        path: {
          sessionKey: sessionKey ?? "",
        },
      },
    },
    {
      enabled: !!sessionKey && !interviewFinished,
      refetchOnWindowFocus: false,
    }
  );

  // sessionId từ cache Redis (dbId) — dùng để navigate đến trang kết quả
  const sessionId = cacheData?.dbId;
  const getNow = useCallback(() => formatTime(new Date()), []);

  // Lưu sessionId vào localStorage làm fallback (phòng khi cache đã hết hạn lúc navigate)
  useEffect(() => {
    if (sessionId && sessionKey) {
      localStorage.setItem(`interview-session-id-${sessionKey}`, String(sessionId));
    }
  }, [sessionId, sessionKey]);

  // Khôi phục lịch sử chat từ Redis cache — nguồn dữ liệu duy nhất cho chat history
  useEffect(() => {
    if (!cacheData) return;
    const { messages: restored, lastPhaseName } = buildMessagesFromCache(cacheData, getNow);
    const hasServerConversation =
      (cacheData.chatHistory?.length ?? 0) > 0 || !!cacheData.currentQuestionText;
    if (hasServerConversation) {
      hasProcessedStartRef.current = true;
      setHasStarted(true);
    }
    if (restored.length > 0) {
      setMessages((previous) => {
        const merged = mergeServerAndLocalMessages(restored, previous);
        const deduped = removeMergedDuplicates(merged);
        const withStableIds = applyStableMessageIds(deduped, previous, msgIdCounter);
        messagesRef.current = withStableIds;
        return withStableIds;
      });
      if (lastPhaseName) {
        setCurrentPhase(lastPhaseName);
      }
    }
    if (typeof cacheData.currentQuestionIndex === "number" && cacheData.currentQuestionIndex > 0) {
      setCurrentQuestionIndex(cacheData.currentQuestionIndex);
    }
  }, [cacheData, getNow]);
  const submitMutation = $api.useMutation("post", "/api/v1/interview/submit");

  // Giữ messagesRef luôn đồng bộ với messages state (tránh stale closure)
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Giữ ref đồng bộ với giá trị composer để xử lý gửi nhanh sau khi dừng mic
  useEffect(() => {
    chatInputValueRef.current = chatInputValue;
  }, [chatInputValue]);
  useEffect(() => {
    interimTranscriptRef.current = interimTranscript;
  }, [interimTranscript]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isSubmitting]);
  const addAIMessage = useCallback(
    (data: {
      questionContent?: string;
      phaseName?: string;
      currentQuestionIndex?: number;
      totalQuestionsInPhase?: number;
      questionType?: string;
      finished?: boolean;
    }) => {
      if (data.phaseName) setCurrentPhase(data.phaseName);
      if (data.currentQuestionIndex) setCurrentQuestionIndex(data.currentQuestionIndex);
      if (data.totalQuestionsInPhase) setTotalQuestions(data.totalQuestionsInPhase);
      if (data.finished) {
        // Dừng TTS nếu đang phát khi kết thúc buổi phỏng vấn
        cancelSpeech();
        // setEvaluating rồi delay trước khi hiện completion card
        setIsEvaluating(true);
        // Xóa session key khỏi danh sách "Đang tiến hành" và đánh dấu finished
        if (sessionKey) {
          try {
            const stored = JSON.parse(localStorage.getItem("interview-session-keys") ?? "{}");
            delete stored[sessionKey];
            localStorage.setItem("interview-session-keys", JSON.stringify(stored));
            localStorage.setItem(`interview-finished-${sessionKey}`, "true");
          } catch {
            /* ignore */
          }
        }
        // Invalidate sessions cache để dữ liệu mới nhất (kết quả đánh giá) được tải sẵn
        void queryClient.invalidateQueries({
          queryKey: ["get", "/api/interview-sessions/user/{userId}"],
        });
        // Sau 3 giây ẩn evaluating và hiện completion card
        setTimeout(() => {
          setIsEvaluating(false);
          setIsSubmitting(false);
          setInterviewFinished(true);
          setMessages((prev) => [
            ...prev,
            {
              id: msgIdCounter.current++,
              role: "ai",
              content: t("userAiinterview.theInterviewHasEndedThank"),
              timestamp: getNow(),
            },
          ]);
        }, 3000);
        return;
      }
      if (data.questionContent) {
        const lastMessage = messagesRef.current[messagesRef.current.length - 1];
        const isSameAsLatestAiMessage =
          lastMessage?.role === "ai" &&
          normalizeMessageContent(lastMessage.content) ===
            normalizeMessageContent(data.questionContent);
        if (isSameAsLatestAiMessage) {
          return;
        }
        const newId = msgIdCounter.current++;
        setMessages((prev) => [
          ...prev,
          {
            id: newId,
            role: "ai",
            content: data.questionContent!,
            timestamp: getNow(),
            meta: {
              phaseName: data.phaseName,
              questionIndex: data.currentQuestionIndex,
              totalQuestions: data.totalQuestionsInPhase,
              questionType: data.questionType,
            },
          },
        ]);
        // Tự động đọc to câu hỏi mới của AI — bỏ qua nếu người dùng đã tắt tiếng
        if (isSessionActivated && isTTSSupported && !isMuted) {
          speak(data.questionContent, newId);
        }
      }
    },

    [cancelSpeech, getNow, isMuted, isSessionActivated, isTTSSupported, sessionKey, speak, t]
  );

  // Start interview — GET /api/v1/interview/start/{sessionKey}
  // Chỉ gọi 1 lần duy nhất khi vừa tạo session (cache chưa có history)
  // Khi reload giữa chừng: cache đã có history → skip /start, dùng restore từ cache
  const {
    data: startData,
    isLoading: isStarting,
    error: startError,
  } = $api.useQuery(
    "get",
    "/api/v1/interview/start/{sessionKey}",
    {
      params: {
        path: {
          sessionKey: sessionKey ?? "",
        },
      },
    },
    {
      enabled:
        !!sessionKey &&
        isSessionActivated &&
        !hasStarted &&
        !isCacheLoading &&
        (isCacheError ||
          ((cacheData?.chatHistory?.length ?? 0) === 0 && !cacheData?.currentQuestionText)),
    }
  );

  // Process the start response once — dùng ref guard để tránh StrictMode chạy effect 2 lần
  useEffect(() => {
    if (!isSessionActivated) {
      return;
    }
    if (startData && !hasProcessedStartRef.current) {
      hasProcessedStartRef.current = true;
      setHasStarted(true);

      // Luôn khôi phục trạng thái phase/progress từ phản hồi start
      if (startData.phaseName) setCurrentPhase(startData.phaseName);
      if (startData.currentQuestionIndex) setCurrentQuestionIndex(startData.currentQuestionIndex);
      if (startData.totalQuestionsInPhase) setTotalQuestions(startData.totalQuestionsInPhase);

      // Nếu phỏng vấn đã hoàn tất trước đó (finished === true từ start response)
      if (startData.finished) {
        setInterviewFinished(true);
        // Xóa session key khỏi danh sách active + đánh dấu finished
        if (sessionKey) {
          try {
            const stored = JSON.parse(localStorage.getItem("interview-session-keys") ?? "{}");
            delete stored[sessionKey];
            localStorage.setItem("interview-session-keys", JSON.stringify(stored));
            localStorage.setItem(`interview-finished-${sessionKey}`, "true");
          } catch {
            /* ignore */
          }
        }
        // Chỉ thêm tin nhắn kết thúc nếu chưa có lịch sử chat được khôi phục
        setMessages((prev) => {
          if (prev.length > 0) return prev;
          return [
            {
              id: msgIdCounter.current++,
              role: "ai",
              content: t("userAiinterview.thisInterviewHasBeenCompleted"),
              timestamp: getNow(),
            },
          ];
        });
        return;
      }

      // Kiểm tra nếu câu hỏi hiện tại đã là tin nhắn cuối cùng (tải lại trang giữa chừng)
      // Nếu trùng nội dung thì không thêm lại — tránh hiển thị câu hỏi trùng lặp
      const lastMsg = messagesRef.current[messagesRef.current.length - 1];
      if (lastMsg?.role === "ai" && lastMsg.content === startData.questionContent) {
        return;
      }
      setTimeout(() => {
        const hasServerConversation =
          (cacheData?.chatHistory?.length ?? 0) > 0 || !!cacheData?.currentQuestionText;
        if (hasServerConversation) return;
        const hasSameAiQuestion = messagesRef.current.some(
          (message) => message.role === "ai" && message.content === startData.questionContent
        );
        if (hasSameAiQuestion) return;
        addAIMessage(startData);
      }, 600);
    }
  }, [addAIMessage, cacheData, getNow, isSessionActivated, sessionKey, startData, t]);

  // Handle send answer
  const handleSendAnswer = useCallback(
    async (answer: string) => {
      if (!sessionKey || isSubmitting || interviewFinished) return;
      setMessages((prev) => [
        ...prev,
        {
          id: msgIdCounter.current++,
          role: "user",
          content: answer,
          timestamp: getNow(),
        },
      ]);
      setIsSubmitting(true);
      let finished = false;
      try {
        const response = await submitMutation.mutateAsync({
          body: {
            sessionKey,
            answer,
          },
        });
        finished = !!response?.finished;
        addAIMessage(response);
        // Invalidate cache để refetch chatHistory với submittedAt mới nhất từ server
        // → effect sync sẽ cập nhật timestamp câu trả lời của user
        await queryClient.invalidateQueries({
          queryKey: ["get", "/api/interview-sessions/cache/{sessionKey}"],
        });
      } catch (err) {
        // Use HTTP status code instead of fragile string matching.
        // AppApiError (thrown by the unified openapi-fetch middleware) carries .status.
        const errStatus = (err as { status?: number })?.status;
        const isExpiry = errStatus === 404 || errStatus === 410;
        if (isExpiry) {
          setSessionExpiredMidway(true);
          setInterviewFinished(true);
          setMessages((prev) => [
            ...prev,
            {
              id: msgIdCounter.current++,
              role: "ai",
              content: t("userAiinterview.theInterviewSessionExpiredAfter"),
              timestamp: getNow(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: msgIdCounter.current++,
              role: "ai",
              content: t("userAiinterview.anErrorOccurredWhileProcessing"),
              timestamp: getNow(),
            },
          ]);
        }
      } finally {
        // Khi câu trả lời cuối cùng, addAIMessage đã gọi setIsEvaluating(true)
        // → không tắt isSubmitting ở đây để EvaluatingIndicator hiển thị ngay
        if (!finished) {
          setIsSubmitting(false);
        }
      }
    },

    [sessionKey, isSubmitting, interviewFinished, submitMutation, addAIMessage, getNow, t]
  );
  const handleSendFromComposer = useCallback(
    (answer: string) => {
      const trimmedAnswer = answer.trim();
      if (!trimmedAnswer) {
        return;
      }
      setChatInputValue("");
      void handleSendAnswer(trimmedAnswer);
    },
    [handleSendAnswer]
  );

  // Nhấn mic lần 2 sẽ dừng nhận dạng và tự gửi transcript
  const canUseSpeechInput =
    isSpeechRecognitionSupported &&
    hasStarted &&
    !isSubmitting &&
    !isEvaluating &&
    !interviewFinished;
  const handleToggleListening = useCallback(() => {
    if (!isSpeechRecognitionSupported) {
      return;
    }
    if (isListening) {
      pendingInterimForAutoSendRef.current = interimTranscriptRef.current;
      shouldAutoSendAfterStopRef.current = true;
      stopListening();
      return;
    }
    if (!canUseSpeechInput) {
      return;
    }
    shouldAutoSendAfterStopRef.current = false;
    pendingInterimForAutoSendRef.current = "";
    startListening();
  }, [canUseSpeechInput, isListening, isSpeechRecognitionSupported, startListening, stopListening]);
  const handleDeviceCheckConfirmed = useCallback(() => {
    setShouldAutoStartMicAfterDeviceCheck(true);
  }, []);
  useEffect(() => {
    if (!shouldAutoStartMicAfterDeviceCheck) {
      return;
    }
    if (!isSpeechRecognitionSupported || interviewFinished || sessionExpiredMidway) {
      setShouldAutoStartMicAfterDeviceCheck(false);
      return;
    }
    if (isListening || !canUseSpeechInput) {
      return;
    }
    setShouldAutoStartMicAfterDeviceCheck(false);
    shouldAutoSendAfterStopRef.current = false;
    pendingInterimForAutoSendRef.current = "";
    startListening();
  }, [
    canUseSpeechInput,
    interviewFinished,
    isListening,
    isSpeechRecognitionSupported,
    sessionExpiredMidway,
    shouldAutoStartMicAfterDeviceCheck,
    startListening,
  ]);
  useEffect(() => {
    if (isListening || !shouldAutoSendAfterStopRef.current) {
      return;
    }
    shouldAutoSendAfterStopRef.current = false;
    const finalDraft = resolveAutoSendDraft(
      chatInputValueRef.current,
      pendingInterimForAutoSendRef.current
    );
    pendingInterimForAutoSendRef.current = "";
    if (!finalDraft) {
      return;
    }
    setChatInputValue("");
    void handleSendAnswer(finalDraft);
  }, [handleSendAnswer, isListening]);
  const canSwitchSpeechLanguage = !isListening && !isSubmitting && !isEvaluating;
  const shouldWarnSpeechFallback =
    speechLanguage === "vi-VN" && hasPreferredLanguageVoice === false;
  const handleSpeechLanguageChange = useCallback(
    (language: SpeechLanguageCode) => {
      if (!canSwitchSpeechLanguage || language === speechLanguage) {
        return;
      }
      setSpeechLanguage(language);
    },
    [canSwitchSpeechLanguage, speechLanguage]
  );

  // Dọn localStorage và chuyển đến trang kết quả
  const handleViewResults = useCallback(() => {
    if (sessionKey) {
      try {
        const stored = JSON.parse(localStorage.getItem("interview-session-keys") ?? "{}");
        delete stored[sessionKey];
        localStorage.setItem("interview-session-keys", JSON.stringify(stored));
        localStorage.removeItem(`interview-finished-${sessionKey}`);
        localStorage.removeItem(`interview-session-id-${sessionKey}`);
      } catch {
        /* ignore */
      }
    }
    const resolvedId =
      sessionId ?? (sessionKey ? localStorage.getItem(`interview-session-id-${sessionKey}`) : null);
    if (resolvedId) {
      navigate(`/user/ai-interview/result/${resolvedId}`);
    } else {
      navigate("/user?tab=aiInterview");
    }
  }, [sessionKey, sessionId, navigate]);

  // Invalidate danh sách phiên và cache chat rồi quay lại
  // Invalidate cache để lần "Tiếp tục" tiếp theo luôn tải lịch sử mới nhất từ server
  const handleNavigateBack = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["get", "/api/interview-sessions/user/{userId}"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["get", "/api/interview-sessions/cache/{sessionKey}"],
    });
    navigate("/user?tab=aiInterview");
  }, [navigate]);
  return {
    navigate,
    user,
    sessionKey,
    messages,
    isSubmitting,
    isEvaluating,
    interviewFinished,
    sessionExpiredMidway,
    currentPhase,
    currentQuestionIndex,
    totalQuestions,
    hasStarted,
    isCacheLoading,
    isStarting,
    startError,
    isListening,
    interimTranscript,
    isSpeechRecognitionSupported,
    canUseSpeechInput,
    handleToggleListening,
    handleDeviceCheckConfirmed,
    isTTSSupported,
    isMuted,
    toggleMute,
    speechLanguage,
    speechLanguageLabel: buildSpeechLanguageLabels(t)[speechLanguage],
    hasPreferredLanguageVoice,
    activeVoiceName,
    shouldWarnSpeechFallback,
    canSwitchSpeechLanguage,
    handleSpeechLanguageChange,
    handleToggleSpeak,
    speakingId,
    chatInputValue,
    setChatInputValue,
    handleSendFromComposer,
    handleViewResults,
    handleNavigateBack,
    messagesEndRef,
  };
}
