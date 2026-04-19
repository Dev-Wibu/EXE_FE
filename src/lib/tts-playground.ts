export interface ResponsiveVoiceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onstart?: () => void;
  onend?: () => void;
  onerror?: () => void;
}

export interface ResponsiveVoiceApi {
  speak: (_text: string, _voice?: string, _options?: ResponsiveVoiceOptions) => void;
  cancel: () => void;
  getVoices?: () => string[];
}

declare global {
  interface Window {
    responsiveVoice?: ResponsiveVoiceApi;
    rvApiKey?: string;
  }
}

const RESPONSIVE_VOICE_SCRIPT_SRC = "https://code.responsivevoice.org/responsivevoice.js";
const RESPONSIVE_VOICE_SCRIPT_SELECTOR = "script[data-responsive-voice-loader='true']";
const RESPONSIVE_VOICE_KEY = (import.meta.env.VITE_RESPONSIVE_VOICE_KEY ?? "").trim();

let responsiveVoiceCache: ResponsiveVoiceApi | null = null;
let responsiveVoiceLoadingPromise: Promise<ResponsiveVoiceApi> | null = null;

interface ResponsiveVoiceModuleNamespace {
  default?: unknown;
  responsiveVoice?: unknown;
}

const isResponsiveVoiceApi = (value: unknown): value is ResponsiveVoiceApi => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    speak?: unknown;
    cancel?: unknown;
  };

  return typeof candidate.speak === "function" && typeof candidate.cancel === "function";
};

const resolveResponsiveVoiceApi = (): ResponsiveVoiceApi | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return isResponsiveVoiceApi(window.responsiveVoice) ? window.responsiveVoice : null;
};

const resolveResponsiveVoiceFromModule = (moduleValue: unknown): ResponsiveVoiceApi | null => {
  if (isResponsiveVoiceApi(moduleValue)) {
    return moduleValue;
  }

  if (typeof moduleValue === "object" && moduleValue !== null) {
    const namespace = moduleValue as ResponsiveVoiceModuleNamespace;

    if (isResponsiveVoiceApi(namespace.default)) {
      return namespace.default;
    }

    if (isResponsiveVoiceApi(namespace.responsiveVoice)) {
      return namespace.responsiveVoice;
    }
  }

  return resolveResponsiveVoiceApi();
};

const loadResponsiveVoiceFromPackage = async (): Promise<ResponsiveVoiceApi | null> => {
  const packageName = "responsivevoice";
  const moduleValue = (await import(packageName)) as unknown;
  const api = resolveResponsiveVoiceFromModule(moduleValue);

  if (api && typeof window !== "undefined") {
    window.responsiveVoice = api;
  }

  return api;
};

export const loadResponsiveVoice = async (timeoutMs = 8000): Promise<ResponsiveVoiceApi> => {
  if (responsiveVoiceCache) {
    return responsiveVoiceCache;
  }

  const existingApi = resolveResponsiveVoiceApi();
  if (existingApi) {
    responsiveVoiceCache = existingApi;
    return existingApi;
  }

  if (typeof document === "undefined") {
    throw new Error("Môi trường hiện tại không hỗ trợ tải script ResponsiveVoice.");
  }

  if (responsiveVoiceLoadingPromise) {
    return responsiveVoiceLoadingPromise;
  }

  responsiveVoiceLoadingPromise = (async () => {
    try {
      const packageApi = await loadResponsiveVoiceFromPackage();
      if (packageApi) {
        responsiveVoiceCache = packageApi;
        return packageApi;
      }
    } catch {
      // Nếu package không load được, fallback sang script CDN.
    }

    return new Promise<ResponsiveVoiceApi>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        RESPONSIVE_VOICE_SCRIPT_SELECTOR
      );
      const script = existingScript ?? document.createElement("script");

      let timeoutId = 0;
      let pollId = 0;

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        window.clearInterval(pollId);
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
      };

      const tryResolve = () => {
        const api = resolveResponsiveVoiceApi();
        if (!api) {
          return;
        }

        responsiveVoiceCache = api;
        cleanup();
        resolve(api);
      };

      const handleLoad = () => {
        tryResolve();
      };

      const handleError = () => {
        cleanup();
        reject(new Error("Không tải được ResponsiveVoice.js."));
      };

      timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error("ResponsiveVoice.js tải quá lâu, vui lòng thử lại."));
      }, timeoutMs);

      pollId = window.setInterval(tryResolve, 180);

      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);

      if (!existingScript) {
        const scriptSrc = RESPONSIVE_VOICE_KEY
          ? `${RESPONSIVE_VOICE_SCRIPT_SRC}?key=${encodeURIComponent(RESPONSIVE_VOICE_KEY)}`
          : RESPONSIVE_VOICE_SCRIPT_SRC;

        if (RESPONSIVE_VOICE_KEY) {
          window.rvApiKey = RESPONSIVE_VOICE_KEY;
        }

        script.src = scriptSrc;
        script.async = true;
        script.setAttribute("data-responsive-voice-loader", "true");
        document.head.append(script);
      } else {
        tryResolve();
      }
    });
  })().finally(() => {
    responsiveVoiceLoadingPromise = null;
  });

  return responsiveVoiceLoadingPromise;
};

export const resolveResponsiveVoiceName = (language: "vi-VN" | "en-US"): string => {
  return language === "vi-VN" ? "Vietnamese Female" : "US English Female";
};

export const stopResponsiveVoicePlayback = (): void => {
  resolveResponsiveVoiceApi()?.cancel();
};

export const buildGoogleTranslateTtsUrl = (text: string, language: "vi-VN" | "en-US"): string => {
  const params = new URLSearchParams({
    ie: "UTF-8",
    client: "tw-ob",
    tl: language === "vi-VN" ? "vi" : "en",
    q: text,
  });

  return `https://translate.google.com/translate_tts?${params.toString()}`;
};

export const stopGoogleAudioPlayback = (audio: HTMLAudioElement | null): void => {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
};
