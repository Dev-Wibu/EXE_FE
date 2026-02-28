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

// onFinalTranscript được gọi trực tiếp trong native event handler — không qua useEffect
export function useSpeechRecognition(
  lang = "vi-VN",
  onFinalTranscript?: (text: string) => void
): UseSpeechRecognitionReturn {
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
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Khởi tạo recognition instance một lần duy nhất
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = false;
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
        setIsListening(false);
        return;
      }
      const errorMessages: Record<string, string> = {
        "not-allowed": "Trình duyệt không được cấp quyền truy cập microphone.",
        "audio-capture": "Không tìm thấy microphone. Vui lòng kiểm tra thiết bị.",
        network: "Lỗi mạng khi nhận dạng giọng nói.",
        aborted: "",
      };
      setError(errorMessages[e.error] ?? `Lỗi nhận dạng giọng nói: ${e.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    try {
      recognitionRef.current.start();
    } catch {
      // Bỏ qua lỗi nếu recognition đang chạy (InvalidStateError)
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
  }, [isListening]);

  return { isListening, interimTranscript, isSupported, error, startListening, stopListening };
}
