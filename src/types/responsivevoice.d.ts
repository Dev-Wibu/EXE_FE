declare module "responsivevoice" {
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

  const responsiveVoice: ResponsiveVoiceApi;
  export default responsiveVoice;
}
