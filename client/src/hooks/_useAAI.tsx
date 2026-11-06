import { StreamingTranscriber } from 'assemblyai';
import React, { useReducer, useRef, useState } from 'react'
import { socket as local_socket } from "../apis/socket";
import { broadcastError } from '../utils';
import useLogger from './useLogger';
import { AAI_EOT_CONFIDENCE, AAI_MIN_SILENCE_MS, AAI_MAX_SILENCE_MS } from '../config';

interface Props {
  setTranscription: React.Dispatch<React.SetStateAction<string | null>>
  setMode: React.Dispatch<React.SetStateAction<Modes>>
}

export default function useAAI({ setTranscription, setMode }: Props) {
  const realtimeTranscriber = useRef<StreamingTranscriber>(null);

  const hasSpokenRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const queuedRef = useRef<number>(0)
  const connectedRef = useRef(false);
  const eotRef = useRef(false)
  const pausedRef = useRef(false) // true between turns: session stays open, silence is sent
  const { logInfo } = useLogger();


  const startSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (!hasSpokenRef.current) {
        setMode("idle")
        const payload = JSON.stringify({ event: "back-to-idle" })
        local_socket.send(payload);
        // fully close the session (mic + AssemblyAI) — it may have been kept open between turns
        stopSTT();
      }
    }, 8000);
  };
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // Between turns (while Lincoln thinks/speaks) we keep the AssemblyAI session and the mic open
  // and send silence instead of mic audio, so the next turn starts without a new connection.
  function pauseSTT() {
    pausedRef.current = true;
    clearSilenceTimer();
  }

  /** Resume a paused session. Returns false if there is no open session (caller must startSTT). */
  function resumeSTT(): boolean {
    if (!realtimeTranscriber.current || !connectedRef.current || !audioContextRef.current) return false;
    eotRef.current = false;
    hasSpokenRef.current = false;
    pausedRef.current = false;
    logInfo({ event: "AAI session resumed" })
    startSilenceTimer();
    return true;
  }

  function isSTTOpen() {
    return !!realtimeTranscriber.current && connectedRef.current;
  }

  async function startSTT(token: string) {
    // close any session left from an earlier visitor before opening a new one
    if (realtimeTranscriber.current) await stopSTT();
    eotRef.current = false;
    pausedRef.current = false;
    realtimeTranscriber.current = new StreamingTranscriber({
      token,
      sampleRate: 16000,
      endOfTurnConfidenceThreshold: AAI_EOT_CONFIDENCE,
      minEndOfTurnSilenceWhenConfident: AAI_MIN_SILENCE_MS,
      maxTurnSilence: AAI_MAX_SILENCE_MS,
    })

    realtimeTranscriber.current.on("open", (event) => {
      console.log('WebSocket connection established');
      logInfo({
        event: "AAI webSocket connection established",
      })
      setMode("listening");
      connectedRef.current = true;

      startSilenceTimer();
    })

    realtimeTranscriber.current.on("turn", async (event) => {
      if (pausedRef.current) return; // between turns: ignore anything AssemblyAI sends
      console.log("[TURN]", { eot: event.end_of_turn, len: (event.transcript || "").length });
      const message = event.transcript;

      const text = (message || "").trim();

      if (text && !hasSpokenRef.current) {
        hasSpokenRef.current = true;
        clearSilenceTimer();
      }

      // Turn ended with nothing usable (silence, noise, punctuation only):
      // don't call the LLM or the avatar, just keep listening.
      if (event.end_of_turn && !eotRef.current && !/[\p{L}\p{N}]/u.test(text)) {
        logInfo({
          event: "AAI empty turn skipped",
          detail: JSON.stringify({ transcript: message })
        })
        setTranscription(null);
        hasSpokenRef.current = false;
        startSilenceTimer();
        return;
      }

      if (event.end_of_turn && text.length != 0 && !eotRef.current) {
        logInfo({
          event: "AAI EOT triggered",
          detail: JSON.stringify(event)
        })
        eotRef.current = true;
        setTranscription(message);
        // Send the question to the server right away so the LLM starts now.
        const payload = JSON.stringify({ event: "start-thinking", data: message })
        local_socket.send(payload);
        // Keep the visitor's question on screen briefly before showing "thinking" (UI only, no added latency).
        setTimeout(() => {
          setMode((m) => (m === "listening" ? "thinking" : m));
        }, 1500)
        pauseSTT();
      } else {
        setTranscription(message);
      }
    })

    realtimeTranscriber.current.on("error", (error) => {
      console.error('WebSocket error:', error);
      broadcastError(`WebSocket error: ${error.message}`)
      setMode("away")
      clearSilenceTimer();
      stopSTT();
      connectedRef.current = false;
    })

    const transcriber = realtimeTranscriber.current;
    transcriber.on("close", () => {
      // ignore a late close from an older session that was already replaced
      if (realtimeTranscriber.current !== transcriber) return;
      // session closed (by us or by AssemblyAI): release the mic too, then clear state
      releaseAudio();
      reset();
    })


    logInfo({
      event: "AAI connection requested",
    })
    const begin = await realtimeTranscriber.current.connect();

    console.log(
      "[AAI] begin.id:", begin.id,
      "expires_at:", new Date(begin.expires_at * 1000).toISOString()
    );


    // audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    // streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    // const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
    // const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);

    // source.connect(processor);
    // processor.connect(audioContextRef.current.destination);

    // processor.onaudioprocess = (e) => {
    //   const input = e.inputBuffer.getChannelData(0);
    //   const buffer = new Int16Array(input.length);
    //   for (let i = 0; i < input.length; i++) {
    //     const s = Math.max(-1, Math.min(1, input[i]));
    //     buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    //   }
    //   realtimeTranscriber.current?.sendAudio(buffer.buffer);
    // };

    audioContextRef.current = new AudioContext({ latencyHint: 'interactive' });

    // Request mono, disable fancy DSP to reduce latency (tune as needed)
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }
    });

    await audioContextRef.current.audioWorklet.addModule('/aai-worklet.js');

    const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
    const worklet = new AudioWorkletNode(audioContextRef.current, 'aai-worklet', {
      processorOptions: { targetSampleRate: 16000 }
    });

    source.connect(worklet);

    worklet.port.onmessage = (e) => {
      if (e.data?.type !== 'audio') return;
      if (!realtimeTranscriber.current) return;

      const MAX_QUEUED = 50;

      // simple backpressure: drop oldest if queue grows too large
      if (queuedRef.current > MAX_QUEUED) {
        queuedRef.current = 0; // reset counter; next frames will be fresh
        return;
      }

      // paused between turns: send silence (keeps the session alive, and Lincoln's own voice is never transcribed)
      const pcm16 = pausedRef.current
        ? new Int16Array(e.data.samples.length)
        : floatToPCM16(e.data.samples);
      queuedRef.current++;

      // If the SDK exposes a promise or callback, hook it to decrement queued.
      if (connectedRef.current) {
        try {
          realtimeTranscriber.current.sendAudio(pcm16.buffer);
        } finally {
          queuedRef.current--;
        }
      }
    };
  }

  const stopSTT = async () => {
    try {
      clearSilenceTimer();
      logInfo({
        event: "AAI Stop triggered"
      })

      // 🧹 Stop audio processing first
      if (audioContextRef.current) {
        // Disconnect processor & source if they exist
        const ctx = audioContextRef.current;
        ctx.suspend().catch(console.warn);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // 🧩 Close the transcriber after audio stops flowing
      if (realtimeTranscriber.current) {
        try {
          await realtimeTranscriber.current.close();
        } catch (err) {
          console.warn("[AAI] Error closing transcriber:", err);
        }
      }

      // 🔇 Finally close the audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }

      reset()
    } catch (error) {
      console.error("[AAI stopSTT error]", error);
    }
  };


  // stop the mic and audio graph without waiting (used when AssemblyAI closes the session itself)
  function releaseAudio() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close().catch(() => { });
  }

  function reset() {
    pausedRef.current = false;
    audioContextRef.current = null;
    streamRef.current = null;
    realtimeTranscriber.current = null;
    queuedRef.current = 0;
    connectedRef.current = false;
    hasSpokenRef.current = false;
  }

  return { startSTT, stopSTT, resumeSTT, isSTTOpen };
}

function floatToPCM16(f32: Float32Array) {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}