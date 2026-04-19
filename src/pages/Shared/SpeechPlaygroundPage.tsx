import { AlertTriangle, LoaderCircle, Square, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Footer, Header } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectBestSpeechVoice } from "@/hooks/speech-synthesis.utils";
import {
  buildGoogleTranslateTtsUrl,
  loadResponsiveVoice,
  resolveResponsiveVoiceName,
  stopGoogleAudioPlayback,
  stopResponsiveVoicePlayback,
} from "@/lib/tts-playground";

type PlaygroundLanguage = "vi-VN" | "en-US";
type SpeechEngine = "web-speech" | "responsive-voice" | "google-translate";

const ENGINE_LABELS: Record<SpeechEngine, string> = {
  "web-speech": "Web Speech API",
  "responsive-voice": "ResponsiveVoice.js",
  "google-translate": "Google Translate trick",
};

const TEST_PHRASE_BY_LANG: Record<PlaygroundLanguage, string> = {
  "vi-VN": "Xin chào, đây là bài kiểm tra giọng nói tiếng Việt trong AI Interview.",
  "en-US": "Hello, this is a speech synthesis test for AI Interview.",
};

function formatDateTime(date: Date | null): string {
  if (!date) {
    return "Chưa có";
  }

  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN")}`;
}

function detectBrowserLabel(): string {
  if (typeof navigator === "undefined") {
    return "Không xác định";
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Microsoft Edge";
  if (ua.includes("chrome/")) return "Google Chrome";
  if (ua.includes("firefox/")) return "Mozilla Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  return "Trình duyệt khác";
}

export function SpeechPlaygroundPage() {
  const [language, setLanguage] = useState<PlaygroundLanguage>("vi-VN");
  const [engine, setEngine] = useState<SpeechEngine>("web-speech");
  const [text, setText] = useState(TEST_PHRASE_BY_LANG["vi-VN"]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEngineLoading, setIsEngineLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voicesLoadedAt, setVoicesLoadedAt] = useState<Date | null>(null);
  const [voicesChangedCount, setVoicesChangedCount] = useState(0);
  const [lastSelectedVoice, setLastSelectedVoice] = useState<string>("Chưa phát");
  const [lastSpeakAt, setLastSpeakAt] = useState<Date | null>(null);
  const [lastEngineUsed, setLastEngineUsed] = useState<string>("Chưa phát");
  const [lastSpeakLatencyMs, setLastSpeakLatencyMs] = useState<number | null>(null);
  const [lastGoogleTtsUrl, setLastGoogleTtsUrl] = useState("");

  const googleAudioRef = useRef<HTMLAudioElement | null>(null);
  const speakRequestIdRef = useRef(0);

  const isWebSpeechSupported =
    typeof window !== "undefined" && "speechSynthesis" in window && !!window.speechSynthesis;

  useEffect(() => {
    if (!isWebSpeechSupported) {
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
      setVoicesLoadedAt((previous) => previous ?? new Date());
    };

    const handleVoicesChanged = () => {
      setVoicesChangedCount((previous) => previous + 1);
      syncVoices();
    };

    syncVoices();
    synth.addEventListener("voiceschanged", handleVoicesChanged);

    const pollIntervalId = window.setInterval(syncVoices, 300);
    const stopPollingTimeoutId = window.setTimeout(() => {
      window.clearInterval(pollIntervalId);
    }, 7000);

    return () => {
      disposed = true;
      synth.cancel();
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      window.clearInterval(pollIntervalId);
      window.clearTimeout(stopPollingTimeoutId);
    };
  }, [isWebSpeechSupported]);

  const stopAllPlayback = useCallback(() => {
    if (isWebSpeechSupported) {
      window.speechSynthesis.cancel();
    }
    stopResponsiveVoicePlayback();
    stopGoogleAudioPlayback(googleAudioRef.current);
    googleAudioRef.current = null;
  }, [isWebSpeechSupported]);

  useEffect(() => {
    return () => {
      speakRequestIdRef.current += 1;
      stopAllPlayback();
    };
  }, [stopAllPlayback]);

  const languagePrefix = language.split("-")[0];

  const filteredVoices = useMemo(() => {
    return voices.filter((voice) => {
      const normalizedVoiceLang = voice.lang.toLowerCase();
      return (
        normalizedVoiceLang === language.toLowerCase() ||
        normalizedVoiceLang === languagePrefix ||
        normalizedVoiceLang.startsWith(`${languagePrefix}-`)
      );
    });
  }, [language, languagePrefix, voices]);

  const hasVietnameseVoice = useMemo(() => {
    return voices.some((voice) => {
      const normalizedVoiceLang = voice.lang.toLowerCase();
      return normalizedVoiceLang === "vi-vn" || normalizedVoiceLang === "vi";
    });
  }, [voices]);

  const handleUsePreset = () => {
    setText(TEST_PHRASE_BY_LANG[language]);
  };

  const handleStop = useCallback(() => {
    speakRequestIdRef.current += 1;
    stopAllPlayback();
    setIsEngineLoading(false);
    setIsSpeaking(false);
  }, [stopAllPlayback]);

  const handleSpeak = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      setError("Vui lòng nhập nội dung để thử đọc.");
      return;
    }

    const requestId = ++speakRequestIdRef.current;
    const startedAt = performance.now();

    setError(null);
    setIsSpeaking(false);
    setIsEngineLoading(engine === "responsive-voice");
    if (engine !== "google-translate") {
      setLastGoogleTtsUrl("");
    }
    stopAllPlayback();

    const markStarted = (engineLabel: string, voiceLabel: string) => {
      if (requestId !== speakRequestIdRef.current) {
        return;
      }

      setIsSpeaking(true);
      setLastSpeakAt(new Date());
      setLastEngineUsed(engineLabel);
      setLastSelectedVoice(voiceLabel);
      setLastSpeakLatencyMs(Math.max(0, Math.round(performance.now() - startedAt)));
    };

    const markEnded = () => {
      if (requestId !== speakRequestIdRef.current) {
        return;
      }

      setIsEngineLoading(false);
      setIsSpeaking(false);
    };

    if (engine === "web-speech") {
      if (!isWebSpeechSupported) {
        setIsEngineLoading(false);
        setError("Trình duyệt hiện tại không hỗ trợ Web Speech API.");
        return;
      }

      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(trimmedText);
      utterance.lang = language;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const selectedVoice =
        voices.find((voice) => voice.voiceURI === selectedVoiceUri) ??
        selectBestSpeechVoice(voices, language);

      const selectedVoiceLabel = selectedVoice
        ? `${selectedVoice.name} (${selectedVoice.lang})`
        : "Mac dinh he thong";

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        markStarted(ENGINE_LABELS["web-speech"], selectedVoiceLabel);
      };

      utterance.onend = () => {
        markEnded();
      };

      utterance.onerror = () => {
        if (requestId !== speakRequestIdRef.current) {
          return;
        }
        markEnded();
        setError("Có lỗi khi phát âm Web Speech. Vui lòng thử lại với voice khác.");
      };

      setIsEngineLoading(false);
      synth.speak(utterance);
      return;
    }

    if (engine === "responsive-voice") {
      try {
        const responsiveVoice = await loadResponsiveVoice();
        if (requestId !== speakRequestIdRef.current) {
          return;
        }

        const responsiveVoiceName = resolveResponsiveVoiceName(language);

        responsiveVoice.speak(trimmedText, responsiveVoiceName, {
          rate,
          pitch,
          volume,
          onstart: () => {
            markStarted(ENGINE_LABELS["responsive-voice"], responsiveVoiceName);
          },
          onend: () => {
            markEnded();
          },
          onerror: () => {
            if (requestId !== speakRequestIdRef.current) {
              return;
            }
            markEnded();
            setError("ResponsiveVoice lỗi trong quá trình phát. Vui lòng thử lại.");
          },
        });

        setIsEngineLoading(false);
      } catch {
        if (requestId !== speakRequestIdRef.current) {
          return;
        }
        setIsEngineLoading(false);
        setIsSpeaking(false);
        setError("Không thể tải ResponsiveVoice.js. Vui lòng thử lại sau.");
      }
      return;
    }

    const googleUrl = buildGoogleTranslateTtsUrl(trimmedText, language);
    setLastGoogleTtsUrl(googleUrl);

    const audio = new Audio(googleUrl);
    audio.preload = "auto";
    googleAudioRef.current = audio;

    audio.onplay = () => {
      markStarted(ENGINE_LABELS["google-translate"], `Google Translate (${language})`);
    };

    audio.onended = () => {
      markEnded();
    };

    audio.onerror = () => {
      if (requestId !== speakRequestIdRef.current) {
        return;
      }
      markEnded();
      setError("Không thể phát audio từ Google Translate trick. Thử lại sau.");
    };

    try {
      await audio.play();
    } catch {
      if (requestId !== speakRequestIdRef.current) {
        return;
      }
      markEnded();
      setError("Trình duyệt chặn autoplay. Hãy bấm phát thử lại một lần nữa.");
    }
  }, [
    engine,
    isWebSpeechSupported,
    language,
    pitch,
    rate,
    selectedVoiceUri,
    stopAllPlayback,
    text,
    voices,
    volume,
  ]);

  const browserLabel = detectBrowserLabel();
  const isPlayDisabled = isEngineLoading || (engine === "web-speech" && !isWebSpeechSupported);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <Header />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Speech Playground (DEV)</CardTitle>
              <CardDescription>
                Khu thử nghiệm giọng nói cho AI Interview để benchmark Web Speech, ResponsiveVoice
                và Google Translate trick.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Trình duyệt: {browserLabel}</Badge>
                <Badge variant="outline">Tổng số voice: {voices.length}</Badge>
                <Badge variant="outline">Voices loaded lúc: {formatDateTime(voicesLoadedAt)}</Badge>
                <Badge variant="outline">voiceschanged: {voicesChangedCount}</Badge>
                <Badge variant="outline">Engine đang chọn: {ENGINE_LABELS[engine]}</Badge>
              </div>

              {!hasVietnameseVoice && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Thiết bị hiện tại chưa tìm thấy voice tiếng Việt trong Web Speech. Bạn có thể
                      đổi sang ResponsiveVoice hoặc Google Translate trick để so sánh.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bảng điều khiển test TTS</CardTitle>
              <CardDescription>
                Chọn engine, ngôn ngữ và thông số phát âm. Có thể lặp lại nhiều lần để so sánh.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="speech-engine">Engine test</Label>
                  <select
                    id="speech-engine"
                    value={engine}
                    onChange={(event) => setEngine(event.target.value as SpeechEngine)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="web-speech">Web Speech API</option>
                    <option value="responsive-voice">ResponsiveVoice.js fallback</option>
                    <option value="google-translate">Google Translate trick (dev only)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="speech-language">Ngôn ngữ</Label>
                  <select
                    id="speech-language"
                    value={language}
                    onChange={(event) => {
                      const nextLanguage = event.target.value as PlaygroundLanguage;
                      setLanguage(nextLanguage);
                      setSelectedVoiceUri("");
                    }}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="vi-VN">Tiếng Việt (vi-VN)</option>
                    <option value="en-US">English (en-US)</option>
                  </select>
                </div>
              </div>

              {engine === "responsive-voice" && (
                <div className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
                  ResponsiveVoice được bật để fallback benchmark. Đây là công cụ test, cần review
                  license và quota trước khi đưa vào production.
                </div>
              )}

              {engine === "google-translate" && (
                <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300">
                  Mẹo gọi thẳng Google Translate TTS chỉ dùng để test local. Endpoint này không
                  chính thức và có thể bị giới hạn bất kỳ lúc nào.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="speech-voice">Voice (chỉ áp dụng cho Web Speech)</Label>
                  <select
                    id="speech-voice"
                    disabled={engine !== "web-speech"}
                    value={selectedVoiceUri}
                    onChange={(event) => setSelectedVoiceUri(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900">
                    <option value="">Tự động chọn voice tốt nhất</option>
                    {filteredVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang}) {voice.localService ? "- local" : "- cloud"}
                      </option>
                    ))}
                  </select>
                </div>

                {engine === "google-translate" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="google-tts-url">Google Translate URL (lan gan nhat)</Label>
                    <Input
                      id="google-tts-url"
                      readOnly
                      value={lastGoogleTtsUrl || "Chưa tạo URL. Bấm 'Phát thử' để sinh URL."}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="speech-rate">Tốc độ: {rate.toFixed(2)}</Label>
                  <Input
                    id="speech-rate"
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={rate}
                    onChange={(event) => setRate(Number(event.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="speech-pitch">Độ cao: {pitch.toFixed(2)}</Label>
                  <Input
                    id="speech-pitch"
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={pitch}
                    onChange={(event) => setPitch(Number(event.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="speech-volume">Âm lượng: {volume.toFixed(2)}</Label>
                  <Input
                    id="speech-volume"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="speech-text">Nội dung test</Label>
                <textarea
                  id="speech-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <Button variant="outline" onClick={handleUsePreset}>
                  Dùng câu mẫu theo ngôn ngữ đã chọn
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => void handleSpeak()}
                  disabled={isPlayDisabled}
                  className="gap-2 bg-cyan-600 text-white hover:bg-cyan-700">
                  {isEngineLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  {isEngineLoading ? "Đang tải engine..." : "Phát thử"}
                </Button>
                <Button variant="outline" onClick={handleStop} className="gap-2">
                  <Square className="h-4 w-4" />
                  Dừng phát
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRate(1);
                    setPitch(1);
                    setVolume(1);
                  }}>
                  Reset thông số
                </Button>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900/60">
                <p>
                  <span className="font-semibold">Trạng thái:</span>{" "}
                  {isSpeaking ? "Đang phát" : "Đã dừng"}
                </p>
                <p>
                  <span className="font-semibold">Engine đã phát:</span> {lastEngineUsed}
                </p>
                <p>
                  <span className="font-semibold">Voice đã chọn:</span> {lastSelectedVoice}
                </p>
                <p>
                  <span className="font-semibold">Lần phát gần nhất:</span>{" "}
                  {formatDateTime(lastSpeakAt)}
                </p>
                <p>
                  <span className="font-semibold">Độ trễ bắt đầu phát:</span>{" "}
                  {lastSpeakLatencyMs === null ? "Chưa có" : `${lastSpeakLatencyMs} ms`}
                </p>
                <p>
                  <span className="font-semibold">Voice phù hợp với {language}:</span>{" "}
                  {filteredVoices.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách voice hiện có</CardTitle>
              <CardDescription>
                Dùng bảng này để xác định xem máy có voice tiếng Việt thật hay không.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[740px] text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-2">Ten voice</th>
                      <th className="px-3 py-2">Lang</th>
                      <th className="px-3 py-2">Loai</th>
                      <th className="px-3 py-2">Mac dinh</th>
                      <th className="px-3 py-2">Voice URI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voices.map((voice) => (
                      <tr
                        key={voice.voiceURI}
                        className="border-t border-slate-200 dark:border-slate-700">
                        <td className="px-3 py-2 font-medium">{voice.name}</td>
                        <td className="px-3 py-2">{voice.lang}</td>
                        <td className="px-3 py-2">{voice.localService ? "Local" : "Cloud"}</td>
                        <td className="px-3 py-2">{voice.default ? "Có" : "Không"}</td>
                        <td className="px-3 py-2 text-xs opacity-80">{voice.voiceURI}</td>
                      </tr>
                    ))}
                    {voices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                          Chưa tải được danh sách voice. Thử refresh trang hoặc chờ thêm vài giây.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist test khuyến nghị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Chọn Tiếng Việt, test lại cùng 1 câu với 3 engine Web/Responsive/Google.</p>
              <p>2. Kiểm tra độ trễ bắt đầu phát và ghi lại engine đọc rõ tiếng Việt hơn.</p>
              <p>3. Thử rate 0.9, pitch 1.05 và so sánh với rate 1.0, pitch 1.0.</p>
              <p>4. Đổi qua EN rồi quay lại VI để kiểm tra fallback và quality.</p>
              <p>5. Reload trang và lặp lại để kiểm tra khả năng phục hồi engine.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
