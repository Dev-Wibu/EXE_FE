import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks";
import { $api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";

import type { ChatMessage } from "./types";

export function useAIInterviewSession() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // chatInputValue là state được lift lên từ ChatInput để callback STT có thể cập nhật trực tiếp
  const [chatInputValue, setChatInputValue] = useState("");

  // Khởi tạo STT (Speech-to-Text) — onFinalTranscript gọi trực tiếp từ native event, không qua useEffect
  const {
    isListening,
    interimTranscript,
    isSupported: isSpeechRecognitionSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition("vi-VN", (finalText) => {
    setChatInputValue((prev) => (prev.trim() ? prev.trim() + " " + finalText : finalText));
  });

  const {
    speakingId,
    isSupported: isTTSSupported,
    isMuted,
    speak,
    cancel: cancelSpeech,
    toggleMute,
  } = useSpeechSynthesis("vi-VN");

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
  const [currentPhase, setCurrentPhase] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  // hasStarted = true ngay nếu phiên đã hoàn thành — lịch sử chat luôn lấy từ /cache
  const [hasStarted, setHasStarted] = useState<boolean>(isAlreadyFinished);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(1);
  // Dùng ref thay vì state để guard khỏi StrictMode double-invocation
  const hasProcessedStartRef = useRef(false);
  // Guard để tránh khôi phục từ cache nhiều lần
  const hasRestoredFromCacheRef = useRef(false);
  // Ref đồng bộ với messages state để tránh stale closure trong các useEffect
  const messagesRef = useRef<ChatMessage[]>([]);

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
    { params: { path: { sessionKey: sessionKey ?? "" } } },
    {
      enabled: !!sessionKey && !interviewFinished,
      refetchOnWindowFocus: false,
    }
  );

  // sessionId từ cache Redis (dbId) — dùng để navigate đến trang kết quả
  const sessionId = cacheData?.dbId;

  // Lưu sessionId vào localStorage làm fallback (phòng khi cache đã hết hạn lúc navigate)
  useEffect(() => {
    if (sessionId && sessionKey) {
      localStorage.setItem(`interview-session-id-${sessionKey}`, String(sessionId));
    }
  }, [sessionId, sessionKey]);

  // Khôi phục lịch sử chat từ Redis cache — nguồn dữ liệu duy nhất cho chat history
  useEffect(() => {
    if (!cacheData || hasRestoredFromCacheRef.current) return;

    const restored: ChatMessage[] = [];
    let counter = 1;
    let lastPhaseName: string | undefined;
    for (const exchange of cacheData.chatHistory ?? []) {
      if (exchange.questionText) {
        restored.push({
          id: counter++,
          role: "ai",
          content: exchange.questionText,
          // Câu hỏi AI không cần timestamp hiển thị — thời gian quan trọng là lúc user trả lời
          timestamp: "—",
        });
      }
      if (exchange.answerText) {
        // Gắn submittedAt của server vào câu trả lời — đây là thời gian thực tế user gửi
        const userTs = exchange.submittedAt
          ? new Date(
              exchange.submittedAt.endsWith("Z") ? exchange.submittedAt : exchange.submittedAt + "Z"
            ).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          : "—";
        restored.push({
          id: counter++,
          role: "user",
          content: exchange.answerText,
          timestamp: userTs,
        });
      }
      if (exchange.phaseName) lastPhaseName = exchange.phaseName;
    }
    // Câu hỏi đang chờ user trả lời — chỉ thêm nếu start chưa xử lý (tránh trùng lặp race condition)
    if (cacheData.currentQuestionText && !hasProcessedStartRef.current) {
      restored.push({
        id: counter++,
        role: "ai",
        content: cacheData.currentQuestionText,
        timestamp: "—",
      });
    }

    if (restored.length > 0) {
      hasRestoredFromCacheRef.current = true;
      hasProcessedStartRef.current = true;
      setMessages(restored);
      messagesRef.current = restored;
      msgIdCounter.current = counter;
      setHasStarted(true);
      if (lastPhaseName) setCurrentPhase(lastPhaseName);
    }
    if (cacheData.currentQuestionIndex != null) {
      setCurrentQuestionIndex(cacheData.currentQuestionIndex);
    }
  }, [cacheData]);

  const submitMutation = $api.useMutation("post", "/api/v1/interview/submit");

  // Giữ messagesRef luôn đồng bộ với messages state (tránh stale closure)
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const getNow = () =>
    new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

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
              content:
                "Cuộc phỏng vấn đã kết thúc. Cảm ơn bạn đã tham gia! Bạn có thể xem kết quả đánh giá chi tiết.",
              timestamp: getNow(),
            },
          ]);
        }, 3000);
        return;
      }

      if (data.questionContent) {
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
        if (isTTSSupported && !isMuted) {
          speak(data.questionContent, newId);
        }
      }
    },
    [isTTSSupported, isMuted, speak, cancelSpeech] // eslint-disable-line react-hooks/exhaustive-deps
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
    { params: { path: { sessionKey: sessionKey ?? "" } } },
    {
      enabled:
        !!sessionKey &&
        !hasStarted &&
        !isCacheLoading &&
        (isCacheError || (cacheData?.chatHistory?.length ?? 0) === 0),
    }
  );

  // Process the start response once — dùng ref guard để tránh StrictMode chạy effect 2 lần
  useEffect(() => {
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
              content:
                "Cuộc phỏng vấn này đã hoàn tất trước đó. Bạn có thể xem kết quả đánh giá chi tiết.",
              timestamp: getNow(),
            },
          ];
        });
        return;
      }

      // Kiểm tra nếu câu hỏi hiện tại đã là tin nhắn cuối cùng (tải lại trang giữa chừng)
      // Nếu trùng nội dung thì không thêm lại — tránh hiển thị câu hỏi trùng lặp
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "ai" && lastMsg.content === startData.questionContent) {
        return;
      }

      setTimeout(() => {
        // Nếu khôi phục từ cache đã chạy trước timeout, bỏ qua để tránh thêm câu hỏi trùng
        if (hasRestoredFromCacheRef.current) return;
        addAIMessage(startData);
      }, 600);
    }
  }, [startData, addAIMessage]); // eslint-disable-line react-hooks/exhaustive-deps

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
          body: { sessionKey, answer },
        });
        finished = !!response?.finished;
        addAIMessage(response);
        // Invalidate cache để refetch chatHistory với submittedAt mới nhất từ server
        // → effect sync sẽ cập nhật timestamp câu trả lời của user
        void queryClient.invalidateQueries({
          queryKey: ["get", "/api/interview-sessions/cache/{sessionKey}"],
        });
      } catch (err) {
        const errMsg = (err as { message?: string })?.message?.toLowerCase() ?? "";
        const isExpiry =
          errMsg.includes("not found") || errMsg.includes("expired") || errMsg.includes("404");
        if (isExpiry) {
          setSessionExpiredMidway(true);
          setInterviewFinished(true);
          setMessages((prev) => [
            ...prev,
            {
              id: msgIdCounter.current++,
              role: "ai",
              content:
                "Phiên phỏng vấn đã hết hạn sau 1 giờ không hoạt động. Bạn không thể tiếp tục phiên này. Vui lòng tạo buổi phỏng vấn mới.",
              timestamp: getNow(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: msgIdCounter.current++,
              role: "ai",
              content: "Đã xảy ra lỗi khi xử lý câu trả lời. Vui lòng thử gửi lại.",
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
    [sessionKey, isSubmitting, interviewFinished, submitMutation, addAIMessage]
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
    startListening,
    stopListening,
    isTTSSupported,
    isMuted,
    toggleMute,
    handleToggleSpeak,
    speakingId,
    chatInputValue,
    setChatInputValue,
    handleSendAnswer,
    handleViewResults,
    handleNavigateBack,
    messagesEndRef,
  };
}
