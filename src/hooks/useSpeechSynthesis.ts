import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  speakingId: string | number | null;
  isSupported: boolean;
  speak: (_text: string, _id: string | number) => void;
  cancel: () => void;
}

export function useSpeechSynthesis(lang = "vi-VN"): UseSpeechSynthesisReturn {
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window && !!window.speechSynthesis;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Hủy TTS khi unmount để không tiếp tục phát sau khi rời trang
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = useCallback(
    (text: string, id: string | number) => {
      if (!isSupported || !text) return;

      // Hủy bất kỳ phát âm nào đang chạy trước khi bắt đầu cái mới
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Chọn giọng tiếng Việt ưu tiên: exact vi-VN → bất kỳ vi-* → fallback mặc định
      const selectVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const exactMatch = voices.find((v) => v.lang === lang);
        const partialMatch = voices.find((v) => v.lang.startsWith("vi"));
        utterance.voice = exactMatch ?? partialMatch ?? null;
      };

      // getVoices() có thể trả về [] lần đầu vì load async — cần lắng nghe onvoiceschanged
      if (window.speechSynthesis.getVoices().length > 0) {
        selectVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          selectVoice();
          window.speechSynthesis.onvoiceschanged = null;
        };
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingId(id);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang]
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingId(null);
  }, [isSupported]);

  return { isSpeaking, speakingId, isSupported, speak, cancel };
}
