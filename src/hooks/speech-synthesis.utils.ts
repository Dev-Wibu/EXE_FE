const normalizeLang = (value: string): string => value.trim().toLowerCase();

const isMatchingLanguage = (voiceLang: string, targetLang: string): boolean => {
  const normalizedVoiceLang = normalizeLang(voiceLang);
  const normalizedTargetLang = normalizeLang(targetLang);
  const targetPrefix = normalizedTargetLang.split("-")[0];

  return (
    normalizedVoiceLang === normalizedTargetLang ||
    normalizedVoiceLang === targetPrefix ||
    normalizedVoiceLang.startsWith(`${targetPrefix}-`)
  );
};

const getVoiceScore = (voice: SpeechSynthesisVoice, targetLang: string): number => {
  const normalizedTargetLang = normalizeLang(targetLang);
  const normalizedVoiceLang = normalizeLang(voice.lang);
  const targetPrefix = normalizedTargetLang.split("-")[0];
  const voiceName = voice.name.toLowerCase();

  let score = 0;

  if (normalizedVoiceLang === normalizedTargetLang) {
    score += 100;
  } else if (
    normalizedVoiceLang === targetPrefix ||
    normalizedVoiceLang.startsWith(`${targetPrefix}-`)
  ) {
    score += 70;
  }

  if (voice.localService) {
    score += 30;
  }

  if (voice.default) {
    score += 8;
  }

  if (targetPrefix === "vi" && /(viet|vietnam)/i.test(voice.name)) {
    score += 20;
  }

  if (targetPrefix === "en" && /english/i.test(voice.name)) {
    score += 10;
  }

  if (voiceName.includes("natural")) {
    score += 6;
  }

  if (voiceName.includes("translate")) {
    score -= 6;
  }

  return score;
};

export const hasVoiceForLanguage = (
  voices: SpeechSynthesisVoice[],
  targetLang: string
): boolean => {
  return voices.some((voice) => isMatchingLanguage(voice.lang, targetLang));
};

export const selectBestSpeechVoice = (
  voices: SpeechSynthesisVoice[],
  targetLang: string
): SpeechSynthesisVoice | null => {
  const matchingVoices = voices.filter((voice) => isMatchingLanguage(voice.lang, targetLang));
  if (matchingVoices.length === 0) {
    return null;
  }

  return matchingVoices.sort((first, second) => {
    return getVoiceScore(second, targetLang) - getVoiceScore(first, targetLang);
  })[0];
};
