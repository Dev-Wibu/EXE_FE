import { AlertTriangle, Square, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Footer, Header } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectBestSpeechVoice } from "@/hooks/speech-synthesis.utils";

const TEST_PHRASE_BY_LANG: Record<"vi-VN" | "en-US", string> = {
  "vi-VN": "Xin chao, day la bai kiem tra giong noi tieng Viet trong AI Interview.",
  "en-US": "Hello, this is a speech synthesis test for AI Interview.",
};

function formatDateTime(date: Date | null): string {
  if (!date) {
    return "Chua co";
  }

  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN")}`;
}

function detectBrowserLabel(): string {
  if (typeof navigator === "undefined") {
    return "Khong xac dinh";
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Microsoft Edge";
  if (ua.includes("chrome/")) return "Google Chrome";
  if (ua.includes("firefox/")) return "Mozilla Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  return "Trinh duyet khac";
}

export function SpeechPlaygroundPage() {
  const [language, setLanguage] = useState<"vi-VN" | "en-US">("vi-VN");
  const [text, setText] = useState(TEST_PHRASE_BY_LANG["vi-VN"]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voicesLoadedAt, setVoicesLoadedAt] = useState<Date | null>(null);
  const [voicesChangedCount, setVoicesChangedCount] = useState(0);
  const [lastSelectedVoice, setLastSelectedVoice] = useState<string>("Chua phat");
  const [lastSpeakAt, setLastSpeakAt] = useState<Date | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window && !!window.speechSynthesis;

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
  }, [isSupported]);

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

  const handleSpeak = () => {
    if (!isSupported) {
      setError("Trinh duyet hien tai khong ho tro SpeechSynthesis.");
      return;
    }

    const synth = window.speechSynthesis;
    const trimmedText = text.trim();

    if (!trimmedText) {
      setError("Vui long nhap noi dung de thu doc.");
      return;
    }

    setError(null);
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmedText);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const selectedVoice =
      voices.find((voice) => voice.voiceURI === selectedVoiceUri) ??
      selectBestSpeechVoice(voices, language);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      setLastSelectedVoice(`${selectedVoice.name} (${selectedVoice.lang})`);
    } else {
      setLastSelectedVoice("Mac dinh he thong");
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setLastSpeakAt(new Date());
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setError("Co loi khi phat am. Vui long thu lai voi voice khac.");
    };

    synth.speak(utterance);
  };

  const handleStop = () => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const browserLabel = detectBrowserLabel();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <Header />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Speech Playground (DEV)</CardTitle>
              <CardDescription>
                Khu thu nghiem giong noi cho AI Interview de kiem tra kha nang doc tieng Viet tren
                Chrome Windows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Trinh duyet: {browserLabel}</Badge>
                <Badge variant="outline">Tong so voice: {voices.length}</Badge>
                <Badge variant="outline">Voices loaded luc: {formatDateTime(voicesLoadedAt)}</Badge>
                <Badge variant="outline">voiceschanged: {voicesChangedCount}</Badge>
              </div>

              {!hasVietnameseVoice && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Thiet bi hien tai chua tim thay voice tieng Viet. Khi test co the se fallback
                      sang giong mac dinh (thuong la English).
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bang dieu khien test TTS</CardTitle>
              <CardDescription>
                Chon ngon ngu, voice, thong so phat am va thu lap lai nhieu lan de so sanh ket qua.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="speech-language">Ngon ngu</Label>
                  <select
                    id="speech-language"
                    value={language}
                    onChange={(event) => {
                      const nextLanguage = event.target.value as "vi-VN" | "en-US";
                      setLanguage(nextLanguage);
                      setSelectedVoiceUri("");
                    }}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="vi-VN">Tieng Viet (vi-VN)</option>
                    <option value="en-US">English (en-US)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="speech-voice">Voice</Label>
                  <select
                    id="speech-voice"
                    value={selectedVoiceUri}
                    onChange={(event) => setSelectedVoiceUri(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="">Tu dong chon voice tot nhat</option>
                    {filteredVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang}) {voice.localService ? "- local" : "- cloud"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="speech-rate">Toc do: {rate.toFixed(2)}</Label>
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
                  <Label htmlFor="speech-pitch">Do cao: {pitch.toFixed(2)}</Label>
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
                  <Label htmlFor="speech-volume">Am luong: {volume.toFixed(2)}</Label>
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
                <Label htmlFor="speech-text">Noi dung test</Label>
                <textarea
                  id="speech-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <Button variant="outline" onClick={handleUsePreset}>
                  Dung cau mau theo ngon ngu da chon
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleSpeak}
                  className="gap-2 bg-cyan-600 text-white hover:bg-cyan-700">
                  <Volume2 className="h-4 w-4" />
                  Phat thu
                </Button>
                <Button variant="outline" onClick={handleStop} className="gap-2">
                  <Square className="h-4 w-4" />
                  Dung phat
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRate(1);
                    setPitch(1);
                    setVolume(1);
                  }}>
                  Reset thong so
                </Button>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900/60">
                <p>
                  <span className="font-semibold">Trang thai:</span>{" "}
                  {isSpeaking ? "Dang phat" : "Da dung"}
                </p>
                <p>
                  <span className="font-semibold">Voice da chon:</span> {lastSelectedVoice}
                </p>
                <p>
                  <span className="font-semibold">Lan phat gan nhat:</span>{" "}
                  {formatDateTime(lastSpeakAt)}
                </p>
                <p>
                  <span className="font-semibold">Voice phu hop voi {language}:</span>{" "}
                  {filteredVoices.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sach voice hien co</CardTitle>
              <CardDescription>
                Dung bang nay de xac dinh xem may co voice tieng Viet that hay khong.
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
                        <td className="px-3 py-2">{voice.default ? "Co" : "Khong"}</td>
                        <td className="px-3 py-2 text-xs opacity-80">{voice.voiceURI}</td>
                      </tr>
                    ))}
                    {voices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                          Chua tai duoc danh sach voice. Thu refresh trang hoac cho them vai giay.
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
              <CardTitle>Checklist test khuyen nghi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Chon Tieng Viet, de auto voice va phat thu 3 lan lien tiep.</p>
              <p>2. Thu tung voice vi-VN trong danh sach, ghi nhan voice nao doc tu nhien nhat.</p>
              <p>3. Thu rate 0.9, pitch 1.05 va so sanh voi rate 1.0, pitch 1.0.</p>
              <p>4. Doi qua EN roi quay lai VI de kiem tra fallback voice co doi dung khong.</p>
              <p>5. Lap lai sau khi reload trang de kiem tra tinh on dinh cua voiceschanged.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
