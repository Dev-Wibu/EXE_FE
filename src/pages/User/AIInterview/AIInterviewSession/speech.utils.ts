const normalizeSegment = (value: string): string => value.trim().replace(/\s+/g, " ");

export const composeTranscriptDraft = (inputValue: string, interimTranscript: string): string => {
  const normalizedInput = normalizeSegment(inputValue);
  const normalizedInterim = normalizeSegment(interimTranscript);

  if (normalizedInput && normalizedInterim) {
    return `${normalizedInput} ${normalizedInterim}`;
  }

  return normalizedInput || normalizedInterim;
};

export const resolveAutoSendDraft = (inputValue: string, fallbackInterim: string): string => {
  const draftFromInput = composeTranscriptDraft(inputValue, "");
  if (draftFromInput) {
    return draftFromInput;
  }

  return composeTranscriptDraft("", fallbackInterim);
};
