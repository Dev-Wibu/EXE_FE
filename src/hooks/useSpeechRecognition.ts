import { useCallback, useEffect, useRef, useState } from "react";

// Khai báo kiểu để TypeScript không báo lỗi với Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((_e: SpeechRecognitionEvent) => void) | null;
  onerror: ((_e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

export interface UseSpeechRecognitionOptions {
  reminderIntervalMs?: number;
  onReminder?: (_elapsedMs: number) => void;
}

// onFinalTranscript được gọi trực tiếp trong native event handler — không qua useEffect
export function useSpeechRecognition(
  lang = "vi-VN",
  onFinalTranscript?: (text: string) => void,
  options?: UseSpeechRecognitionOptions
): UseSpeechRecognitionReturn {
  const reminderIntervalMs = options?.reminderIntervalMs ?? 5 * 60 * 1000;
  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
      : undefined;

  const isSupported = !!SpeechRecognitionAPI;

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Dùng ref để giữ callback mới nhất — cập nhật qua effect tránh mutate ref trong render
  const onFinalTranscriptRef = useRef<((text: string) => void) | undefined>(onFinalTranscript);
  const onReminderRef = useRef<((elapsedMs: number) => void) | undefined>(options?.onReminder);
  const shouldKeepListeningRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const reminderTimeoutRef = useRef<number | null>(null);
  const listeningStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    onReminderRef.current = options?.onReminder;
  }, [options?.onReminder]);

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current !== null) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const clearReminderTimeout = useCallback(() => {
    if (reminderTimeoutRef.current !== null) {
      window.clearTimeout(reminderTimeoutRef.current);
      reminderTimeoutRef.current = null;
    }
  }, []);

  const scheduleReminder = useCallback(() => {
    clearReminderTimeout();

    if (reminderIntervalMs <= 0 || !shouldKeepListeningRef.current || stopRequestedRef.current) {
      return;
    }

    const scheduleNext = () => {
      reminderTimeoutRef.current = window.setTimeout(() => {
        if (!shouldKeepListeningRef.current || stopRequestedRef.current) {
          reminderTimeoutRef.current = null;
          return;
        }

        const startedAt = listeningStartedAtRef.current;
        if (startedAt !== null) {
          onReminderRef.current?.(Date.now() - startedAt);
        }

        scheduleNext();
      }, reminderIntervalMs);
    };

    scheduleNext();
  }, [clearReminderTimeout, reminderIntervalMs]);

  const scheduleRestart = useCallback(
    (delayMs = 250) => {
      clearRestartTimeout();
      if (!shouldKeepListeningRef.current || stopRequestedRef.current) {
        return;
      }

      restartTimeoutRef.current = window.setTimeout(() => {
        restartTimeoutRef.current = null;
        if (
          !recognitionRef.current ||
          stopRequestedRef.current ||
          !shouldKeepListeningRef.current
        ) {
          return;
        }

        try {
          recognitionRef.current.start();
        } catch {
          // Bỏ qua lỗi InvalidStateError khi browser vẫn đang ở trạng thái listening.
        }
      }, delayMs);
    },
    [clearRestartTimeout]
  );

  // Khởi tạo recognition instance một lần duy nhất
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        // Gọi callback trực tiếp từ event handler — tránh setState-in-effect
        onFinalTranscriptRef.current?.(finalText.trim());
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      // no-speech là lỗi bình thường (người dùng không nói gì), không cần hiện
      if (e.error === "no-speech") {
        scheduleRestart(350);
        return;
      }

      if (e.error === "aborted") {
        return;
      }

      const errorMessages: Record<string, string> = {
        "not-allowed": "Trình duyệt không được cấp quyền truy cập microphone.",
        "audio-capture": "Không tìm thấy microphone. Vui lòng kiểm tra thiết bị.",
        network: "Lỗi mạng khi nhận dạng giọng nói.",
        aborted: "",
      };
      setError(errorMessages[e.error] ?? `Lỗi nhận dạng giọng nói: ${e.error}`);
      stopRequestedRef.current = true;
      shouldKeepListeningRef.current = false;
      clearRestartTimeout();
      clearReminderTimeout();
      setIsListening(false);
    };

    recognition.onend = () => {
      if (shouldKeepListeningRef.current && !stopRequestedRef.current) {
        scheduleRestart(250);
        return;
      }

      clearRestartTimeout();
      clearReminderTimeout();
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      stopRequestedRef.current = true;
      shouldKeepListeningRef.current = false;
      clearRestartTimeout();
      clearReminderTimeout();
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionAPI, clearReminderTimeout, clearRestartTimeout, lang, scheduleRestart]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    stopRequestedRef.current = false;
    shouldKeepListeningRef.current = true;
    listeningStartedAtRef.current = Date.now();
    scheduleReminder();

    try {
      recognitionRef.current.start();
    } catch {
      // Bỏ qua lỗi nếu recognition đang chạy (InvalidStateError)
    }
  }, [isListening, scheduleReminder]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || stopRequestedRef.current || !shouldKeepListeningRef.current) {
      return;
    }

    stopRequestedRef.current = true;
    shouldKeepListeningRef.current = false;
    clearRestartTimeout();
    clearReminderTimeout();
    try {
      recognitionRef.current.stop();
    } catch {
      // Bỏ qua lỗi nếu recognition chưa sẵn sàng để stop.
    }
  }, [clearReminderTimeout, clearRestartTimeout]);

  return { isListening, interimTranscript, isSupported, error, startListening, stopListening };
}
