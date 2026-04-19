import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { hasVoiceForLanguage, selectBestSpeechVoice } from "./speech-synthesis.utils";

export interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  speakingId: string | number | null;
  isSupported: boolean;
  isMuted: boolean;
  hasPreferredLanguageVoice: boolean | null;
  activeVoiceName: string | null;
  speak: (_text: string, _id: string | number) => void;
  cancel: () => void;
  toggleMute: () => void;
}

const waitForVoices = async (
  synth: SpeechSynthesis,
  maxWaitMs = 1800
): Promise<SpeechSynthesisVoice[]> => {
  const existingVoices = synth.getVoices();
  if (existingVoices.length > 0) {
    return existingVoices;
  }

  return await new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const tryResolve = () => {
      const nextVoices = synth.getVoices();
      if (nextVoices.length > 0) {
        cleanup();
        resolve(nextVoices);
      }
    };

    const cleanup = () => {
      synth.removeEventListener("voiceschanged", tryResolve);
      window.clearInterval(pollIntervalId);
      window.clearTimeout(timeoutId);
    };

    const pollIntervalId = window.setInterval(tryResolve, 250);
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(synth.getVoices());
    }, maxWaitMs);

    synth.addEventListener("voiceschanged", tryResolve);
    tryResolve();
  });
};

export function useSpeechSynthesis(lang = "vi-VN"): UseSpeechSynthesisReturn {
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window && !!window.speechSynthesis;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | number | null>(null);
  // Đọc từ localStorage để giữ trạng thái qua các lần điều hướng giữa các phòng phỏng vấn
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("tts-muted") === "true");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeVoiceName, setActiveVoiceName] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakRequestIdRef = useRef(0);

  const hasPreferredLanguageVoice = useMemo(() => {
    if (!isSupported || voices.length === 0) {
      return null;
    }

    return hasVoiceForLanguage(voices, lang);
  }, [isSupported, lang, voices]);

  // Hủy TTS khi unmount để không tiếp tục phát sau khi rời trang
  useEffect(() => {
    return () => {
      if (isSupported) {
        speakRequestIdRef.current += 1;
        window.speechSynthesis.cancel();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    let disposed = false;
    const synth = window.speechSynthesis;

    const syncVoices = () => {
      const nextVoices = synth.getVoices();
      if (disposed || nextVoices.length === 0) {
        return;
      }

      setVoices(nextVoices);
    };

    syncVoices();
    synth.addEventListener("voiceschanged", syncVoices);

    const pollIntervalId = window.setInterval(syncVoices, 400);
    const stopPollingTimeoutId = window.setTimeout(() => {
      window.clearInterval(pollIntervalId);
    }, 6000);

    return () => {
      disposed = true;
      synth.removeEventListener("voiceschanged", syncVoices);
      window.clearInterval(pollIntervalId);
      window.clearTimeout(stopPollingTimeoutId);
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string, id: string | number) => {
      if (!isSupported || !text) return;

      const requestId = ++speakRequestIdRef.current;
      const synth = window.speechSynthesis;

      // Hủy bất kỳ phát âm nào đang chạy trước khi bắt đầu cái mới
      synth.cancel();

      const runSpeak = async () => {
        const voicePool = voices.length > 0 ? voices : await waitForVoices(synth);
        if (requestId !== speakRequestIdRef.current) {
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const selectedVoice = selectBestSpeechVoice(voicePool, lang);
        setActiveVoiceName(selectedVoice ? `${selectedVoice.name} (${selectedVoice.lang})` : null);

        if (selectedVoice) {
          utterance.voice = selectedVoice;
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
        if (requestId !== speakRequestIdRef.current) {
          return;
        }

        synth.speak(utterance);
      };

      void runSpeak();
    },
    [isSupported, lang, voices]
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    speakRequestIdRef.current += 1;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingId(null);
  }, [isSupported]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      // Tắt âm thanh đang phát nếu người dùng chuyển sang chế độ tắt tiếng
      if (!prev && isSupported) {
        speakRequestIdRef.current += 1;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingId(null);
      }
      const next = !prev;
      localStorage.setItem("tts-muted", String(next));
      return next;
    });
  }, [isSupported]);

  return {
    isSpeaking,
    speakingId,
    isSupported,
    isMuted,
    hasPreferredLanguageVoice,
    activeVoiceName,
    speak,
    cancel,
    toggleMute,
  };
}
