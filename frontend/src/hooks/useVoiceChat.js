import { useCallback, useEffect, useRef, useState } from "react";

// Encapsulates browser speech-to-text (input) and text-to-speech (output) for HYDRA.
export function useVoiceChat({ onTranscript, onFinalTranscript }) {
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const recognitionRef = useRef(null);
  const voiceOutRef = useRef(false);
  const transcriptCbRef = useRef(onTranscript);
  const finalCbRef = useRef(onFinalTranscript);

  useEffect(() => {
    transcriptCbRef.current = onTranscript;
    finalCbRef.current = onFinalTranscript;
  });

  const speechSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    voiceOutRef.current = voiceOut;
    if (!voiceOut && typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [voiceOut]);

  const speak = useCallback((text) => {
    if (!voiceOutRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    const clean = text.replace(/[*#_`>]/g, "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 1.03;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /female|samantha|google us english|zira/i.test(v.name)) ||
      voices.find((v) => v.lang?.startsWith("en"));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  }, []);

  const toggleListen = useCallback(() => {
    if (!speechSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      transcriptCbRef.current?.(finalText || interim);
    };
    rec.onend = () => {
      setListening(false);
      const q = finalText.trim();
      if (q) finalCbRef.current?.(q);
    };
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }, [listening, speechSupported]);

  return { listening, voiceOut, setVoiceOut, speak, toggleListen, speechSupported };
}
