import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectBestSpeechVoice } from "@/hooks/speech-synthesis.utils";
import i18n from "@/lib/i18n";
import {
  loadResponsiveVoice,
  resolveResponsiveVoiceName,
  stopResponsiveVoicePlayback,
} from "@/lib/tts-playground";
import { AlertTriangle, LoaderCircle, Square, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
const t = i18n.t.bind(i18n);
type PlaygroundLanguage = "vi-VN" | "en-US";
type SpeechEngine = "web-speech" | "responsive-voice";
const ENGINE_LABELS: Record<SpeechEngine, string> = {
  "web-speech": "Web Speech API",
  "responsive-voice": "ResponsiveVoice.js",
};
const TEST_PHRASE_BY_LANG: Record<PlaygroundLanguage, string> = {
  "vi-VN": t("sharedSpeechplaygroundpage.helloTestVoice"),
  "en-US": "Hello, this is a speech synthesis test for AI Interview.",
};
function formatDateTime(date: Date | null): string {
  if (!date) {
    return t("common.notYet");
  }
  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN")}`;
}
function detectBrowserLabel(): string {
  if (typeof navigator === "undefined") {
    return t("sharedSpeechplaygroundpage.areNot");
  }
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Microsoft Edge";
  if (ua.includes("chrome/")) return "Google Chrome";
  if (ua.includes("firefox/")) return "Mozilla Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  return t("sharedSpeechplaygroundpage.otherBrowsers");
}
export function SpeechPlaygroundPage() {
  const { t } = useTranslation();
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
  const [lastSelectedVoice, setLastSelectedVoice] = useState<string>(
    t("sharedSpeechplaygroundpage.notPlayedYet")
  );
  const [lastSpeakAt, setLastSpeakAt] = useState<Date | null>(null);
  const [lastEngineUsed, setLastEngineUsed] = useState<string>(
    t("sharedSpeechplaygroundpage.notPlayedYet")
  );
  const [lastSpeakLatencyMs, setLastSpeakLatencyMs] = useState<number | null>(null);
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
      setError(t("sharedSpeechplaygroundpage.pleaseEnterContentToRead"));
      return;
    }
    const requestId = ++speakRequestIdRef.current;
    const startedAt = performance.now();
    setError(null);
    setIsSpeaking(false);
    setIsEngineLoading(engine === "responsive-voice");
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
        setError(t("sharedSpeechplaygroundpage.browser"));
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
        : t("common.code");
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
        setError(t("common.have"));
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
            setError(t("sharedSpeechplaygroundpage.responsivevoiceErrorDuringPlaybackPlease"));
          },
        });
        setIsEngineLoading(false);
      } catch {
        if (requestId !== speakRequestIdRef.current) {
          return;
        }
        setIsEngineLoading(false);
        setIsSpeaking(false);
        setError(t("sharedSpeechplaygroundpage.areNot"));
      }
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
    t,
  ]);
  const browserLabel = detectBrowserLabel();
  const isPlayDisabled = isEngineLoading || (engine === "web-speech" && !isWebSpeechSupported);
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <HomepageHeader />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Speech Playground (DEV)</CardTitle>
              <CardDescription>
                {t("sharedSpeechplaygroundpage.voiceTestingAreaForAi")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {t("sharedSpeechplaygroundpage.browser")} {browserLabel}
                </Badge>
                <Badge variant="outline">
                  {t("sharedSpeechplaygroundpage.totalVoices")} {voices.length}
                </Badge>
                <Badge variant="outline">
                  {t("sharedSpeechplaygroundpage.voicesLoadedAt")} {formatDateTime(voicesLoadedAt)}
                </Badge>
                <Badge variant="outline">voiceschanged: {voicesChangedCount}</Badge>
                <Badge variant="outline">
                  {t("sharedSpeechplaygroundpage.engineSelected")} {ENGINE_LABELS[engine]}
                </Badge>
              </div>

              {!hasVietnameseVoice && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{t("sharedSpeechplaygroundpage.deviceVoiceNotFound")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("adminPostmanagement.board")}</CardTitle>
              <CardDescription>{t("compShared.select")}</CardDescription>
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
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="speech-language">{t("common.language")}</Label>
                  <select
                    id="speech-language"
                    value={language}
                    onChange={(event) => {
                      const nextLanguage = event.target.value as PlaygroundLanguage;
                      setLanguage(nextLanguage);
                      setSelectedVoiceUri("");
                    }}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="vi-VN">{t("common.vietnameseVi")}</option>
                    <option value="en-US">English (en-US)</option>
                  </select>
                </div>
              </div>

              {engine === "responsive-voice" && (
                <div className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
                  {t("sharedSpeechplaygroundpage.responsiveVoiceFallback")}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="speech-voice">
                  {t("sharedSpeechplaygroundpage.voiceAppliesToWebSpeech")}
                </Label>
                <select
                  id="speech-voice"
                  disabled={engine !== "web-speech"}
                  value={selectedVoiceUri}
                  onChange={(event) => setSelectedVoiceUri(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900">
                  <option value="">{t("compShared.from")}</option>
                  {filteredVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang}) {voice.localService ? "- local" : "- cloud"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="speech-rate">
                    {t("sharedSpeechplaygroundpage.speed")} {rate.toFixed(2)}
                  </Label>
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
                  <Label htmlFor="speech-pitch">
                    {t("sharedSpeechplaygroundpage.pitch")} {pitch.toFixed(2)}
                  </Label>
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
                  <Label htmlFor="speech-volume">
                    {t("sharedSpeechplaygroundpage.volume")} {volume.toFixed(2)}
                  </Label>
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
                <Label htmlFor="speech-text">{t("sharedSpeechplaygroundpage.testContent")}</Label>
                <textarea
                  id="speech-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <Button variant="outline" onClick={handleUsePreset}>
                  {t("general.text")}
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
                  {isEngineLoading
                    ? t("adminUsermanagement.hide")
                    : t("sharedSpeechplaygroundpage.tryItOut")}
                </Button>
                <Button variant="outline" onClick={handleStop} className="gap-2">
                  <Square className="h-4 w-4" />
                  {t("sharedSpeechplaygroundpage.stopPlaying")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRate(1);
                    setPitch(1);
                    setVolume(1);
                  }}>
                  {t("sharedSpeechplaygroundpage.resetParameters")}
                </Button>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900/60">
                <p>
                  <span className="font-semibold">{t("common.status1")}</span>{" "}
                  {isSpeaking
                    ? t("adminUsermanagement.hide")
                    : t("sharedSpeechplaygroundpage.stopped")}
                </p>
                <p>
                  <span className="font-semibold">
                    {t("sharedSpeechplaygroundpage.enginePlayed")}
                  </span>{" "}
                  {lastEngineUsed}
                </p>
                <p>
                  <span className="font-semibold">
                    {t("sharedSpeechplaygroundpage.voiceSelected")}
                  </span>{" "}
                  {lastSelectedVoice}
                </p>
                <p>
                  <span className="font-semibold">
                    {t("sharedSpeechplaygroundpage.lastBroadcast")}
                  </span>{" "}
                  {formatDateTime(lastSpeakAt)}
                </p>
                <p>
                  <span className="font-semibold">
                    {t("sharedSpeechplaygroundpage.playbackDelay")}
                  </span>{" "}
                  {lastSpeakLatencyMs === null ? t("common.notYet") : `${lastSpeakLatencyMs} ms`}
                </p>
                <p>
                  <span className="font-semibold">
                    {t("sharedSpeechplaygroundpage.voiceMatches")} {language}:
                  </span>{" "}
                  {filteredVoices.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sharedSpeechplaygroundpage.listOfAvailableVoices")}</CardTitle>
              <CardDescription>{t("general.text")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[740px] text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-2">{t("sharedSpeechplaygroundpage.voiceName")}</th>
                      <th className="px-3 py-2">{t("common.language")}</th>
                      <th className="px-3 py-2">{t("common.type")}</th>
                      <th className="px-3 py-2">{t("common.code")}</th>
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
                        <td className="px-3 py-2">
                          {voice.default
                            ? t("common.have")
                            : t("sharedSpeechplaygroundpage.areNot")}
                        </td>
                        <td className="px-3 py-2 text-xs opacity-80">{voice.voiceURI}</td>
                      </tr>
                    ))}
                    {voices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                          {t("sharedSpeechplaygroundpage.voicesNotLoadedRefresh")}
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
              <CardTitle>{t("sharedSpeechplaygroundpage.checklistOfRecommendedTests")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{t("sharedSpeechplaygroundpage.1ChooseVietnameseTestThe")}</p>
              <p>{t("sharedSpeechplaygroundpage.testDelayAndRecord")}</p>
              <p>{t("sharedSpeechplaygroundpage.3TryRate09")}</p>
              <p>{t("sharedSpeechplaygroundpage.switchAndReturnToTest")}</p>
              <p>{t("sharedSpeechplaygroundpage.reloadAndRepeatTest")}</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
