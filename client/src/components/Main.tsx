import { useEffect, useRef, useState } from 'react';
import { socket } from '../apis/socket';
import useVideoProviderService from '../hooks/useVideoProviderService';
import ModeIcon from './ModeIcon';
import FullscreenButton from './FullscreenButton';
import Text from './Text';
import useTextDisplay from '../hooks/useTextDisplay';
import subtitles from '../subtitles.json';
import useCameraSender from '../hooks/useCameraSender';
import { IDLE_VIDEO_PATH } from '../config';
import TransparentButtons from './TransparentButtons';
import useAAI from '../hooks/_useAAI';
import { getAAIToken } from '../apis';
import { cleanupAllConnections } from '../utils';
import useLogger from '../hooks/useLogger';

export default function Main() {
  const [mode, setMode] = useState<Modes>("idle");
  const coreLoop = useRef(false)
  const speakingText = useRef('')
  const idleRef = useRef<HTMLVideoElement>(null)
  const remoteRef = useRef<HTMLVideoElement>(null)
  // AssemblyAI token for the next listening turn, fetched while Lincoln is still speaking
  const nextTokenRef = useRef<ReturnType<typeof getAAIToken> | null>(null)
  // true from the moment an answer is sent to the avatar until we return to listening
  const speakingTurnRef = useRef(false)
  const { logInfo, commitToDB } = useLogger();


  function backToListeningTransition(type: 'textAnimation' | 'videoStream') {
    // Return to listening as soon as the avatar video ends; don't wait for the subtitle animation.
    if (type !== 'videoStream') return;
    if (!speakingTurnRef.current) return; // ignore duplicate STOP events for the same answer
    speakingTurnRef.current = false;
    stopReveal()

    if (!coreLoop.current) return;
    const message = JSON.stringify({ event: "back-to-listening" });
    socket.send(message)

    // Fast path: the AssemblyAI session was kept open during the answer — just resume it.
    if (resumeSTT()) {
      nextTokenRef.current = null;
      setTranscription(null)
      setMode("listening")
      return;
    }

    // Fallback: session was closed — open a new one (token usually prefetched while Lincoln spoke).
    const tokenPromise = nextTokenRef.current ?? getAAIToken();
    nextTokenRef.current = null;
    tokenPromise
      .then((res) => res || getAAIToken()) // prefetch failed: try once more
      .then((res) => {
        if (res) {
          startSTT(res.token)
          setTranscription(null)
          setMode("listening")
        }
      })
  }

  const {
    transcription,
    setTranscription,
    onStartSpeaking,
    stopReveal
  } = useTextDisplay(speakingText, backToListeningTransition)
  const { startSTT, stopSTT, resumeSTT, isSTTOpen } = useAAI({ setTranscription, setMode });


  const { connected, connect, sendText, destroy } = useVideoProviderService(idleRef, remoteRef, onStartSpeaking, setMode, backToListeningTransition)
  const pendingTextsRef = useRef<string[]>([]);
  useCameraSender();

  useEffect(() => {
    const ws = socket;

    const handleOpen = () => console.log('Web socket connected');
    const handleClose = () => { setMode('idle'); };
    const handleError = () => console.error('Failed to connect to web socket');
    const handleMsg = (event: MessageEvent<Modes>) => {
      const socketResponse: SocketResponse = JSON.parse(event.data)
      if (socketResponse.event === "start-listening") {
        if (coreLoop.current) {
          const token = socketResponse.data!
          logInfo({
            event: "Token Created Speaking Start Trigger",
            detail: `face is detected and token is also received for AAI session TOKEN:${token}`
          })
          connect();
          startSTT(token);
        }
      }
      else if (socketResponse.event == "stt-transcription") {
        setTranscription(socketResponse.data!)
      } else if (socketResponse.event == "start-speaking") {
        speakingTurnRef.current = true
        // only needed if the AssemblyAI session closed during the answer (fallback path)
        if (coreLoop.current && !isSTTOpen()) nextTokenRef.current = getAAIToken();
        sendText(socketResponse.data!)
        speakingText.current = socketResponse.data!

        setTranscription(null)
        console.log('line 189')
      } else if (socketResponse.event == "stop-video-connection") {
        console.log('stop-video-connection')
        destroy()
      } else if (socketResponse.event == "start-offline-speaking") {
        // show offline video - (/offline-fallback.mp4)
        // first fade in the top video using opacity
        // when video end fade it out
        const videoElement = remoteRef.current!
        videoElement.srcObject = null
        videoElement.src = socketResponse.data!
        videoElement.play()
        videoElement.addEventListener("play", () => {
          console.log('play', socketResponse.data!)
          const message = JSON.stringify({ event: "speaking" });
          ws.send(message)
          videoElement.style.opacity = '1'
          setMode("speaking")
          const text = subtitles["1"];
          speakingText.current = text
          console.log('line 113')
          onStartSpeaking()
        })
        videoElement.addEventListener("ended", () => {
          videoElement.style.opacity = '0'
          const message = JSON.stringify({ event: "back-to-listening" });
          ws.send(message)
        })
      } else if (socketResponse.event == "away") {
        setMode("away")
      } else if (socketResponse.event == "thinking") { // modes
        setTimeout(() => {
          setMode("thinking");
        }, 1000)
      } else if (socketResponse.event == "loop-stopped") {
        coreLoop.current = false
      } else if (socketResponse.event == "loop-started") {
        coreLoop.current = true
      }
      else { // modes
        setMode(socketResponse.event);
      }
    };

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('close', handleClose);
    ws.addEventListener('error', handleError);
    ws.addEventListener('message', handleMsg);

    /* 🔑  If the socket is already open, fire the callback manually */
    if (ws.readyState === WebSocket.OPEN) {
      handleOpen();
    }

    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('close', handleClose);
      ws.removeEventListener('error', handleError);
      ws.removeEventListener('message', handleMsg);
    };
  }, []);

  useEffect(() => {
    if (mode == "away" || !coreLoop.current) {
      cleanupAllConnections({ stopSTT, destroyVideo: destroy }).then(() => {
        commitToDB();
      })
    }
  }, [mode, coreLoop.current, setTranscription, stopSTT, destroy])

  // useEffect(() => {
  //   if (!connected) return;
  //   (async () => {
  //     const queue = pendingTextsRef.current;
  //     pendingTextsRef.current = [];
  //     for (const msg of queue) {
  //       speakingText.current = msg
  //       await sendText(msg);
  //     }
  //   })();
  // }, [connected, sendText]);

  useEffect(() => {
    if (coreLoop.current) {
      logInfo({
        event: 'Core Loop started',
        detail: "core loop start triggered"
      })
    }
  }, [coreLoop.current])


  return (
    <div className='relative w-fit mx-auto'>
      <TransparentButtons />
      <div className="relative aspect-[9/16] h-screen">
        {/* <FullscreenButton /> */}
        {/* idle layer */}
        <video
          ref={idleRef}
          src={IDLE_VIDEO_PATH}
          loop
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
        />

        {/* remote layer */}
        <video
          ref={remoteRef}
          muted={false}
          className="absolute inset-0 w-full h-full object-cover rounded-xl
               transition-opacity duration-1000 opacity-0"
        />
      </div>
      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
      <div className='absolute bottom-[5%] left-0 right-0 p-6'>
        <div className='flex items-center gap-2'>
          <ModeIcon mode={mode} className='shrink-0' />
          <Text mode={mode} transcription={transcription} />
        </div>
      </div>
    </div>
  )
}
