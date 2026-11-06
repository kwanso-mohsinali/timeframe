export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
export const AGENT_ID = import.meta.env.VITE_AGENT_ID || 'your agent id here';
export const DID_API_KEY_B64 = import.meta.env.VITE_DID_API_KEY_B64 || 'your d-id api key here';
export const DID_CLIENT_KEY = import.meta.env.VITE_DID_CLIENT_KEY || 'your d-id client key here';
export const IDLE_VIDEO_PATH = import.meta.env.VITE_IDLE_VIDEO_PATH || 'lincoln idle video path';

// AssemblyAI end-of-turn detection (browser STT). Defaults = AssemblyAI "Balanced" preset.
// Lower values answer faster but may cut visitors off; tune on site via client/.env.
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== '' && Number.isFinite(n) ? n : fallback;
};
export const AAI_EOT_CONFIDENCE = num(import.meta.env.VITE_AAI_EOT_CONFIDENCE, 0.4);
export const AAI_MIN_SILENCE_MS = num(import.meta.env.VITE_AAI_MIN_SILENCE_MS, 400);
export const AAI_MAX_SILENCE_MS = num(import.meta.env.VITE_AAI_MAX_SILENCE_MS, 1280);
