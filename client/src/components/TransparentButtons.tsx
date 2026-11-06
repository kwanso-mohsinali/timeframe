import { startCoreLoopApiCall, stopCoreLoopApiCall } from "../apis";

/**
 * Two fully transparent, large tap targets at the very top.
 * - Each takes ~25% of screen width.
 * - Does not block the rest of the UI (uses pointer-events layering).
 */
export default function TransparentButtons() {
  function onStart() {
    startCoreLoopApiCall()
  }

  function onStop() {
    stopCoreLoopApiCall()
  }

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* START area (top-left 25% width) */}
      <button
        aria-label="Start"
        onClick={onStart}
        className="pointer-events-auto absolute top-0 left-0 w-[45%] h-20 rounded-lg border-2 border-emerald-400 bg-emerald-500/30 text-white font-semibold hover:bg-emerald-500/50"
      >
        Start
      </button>

      {/* STOP area (top-right 25% width) */}
      <button
        aria-label="Stop"
        onClick={onStop}
        className="pointer-events-auto absolute top-0 right-0 w-[45%] h-20 rounded-lg border-2 border-red-400 bg-red-500/30 text-white font-semibold hover:bg-red-500/50"
      >
        Stop
      </button>
    </div>
  );
}
