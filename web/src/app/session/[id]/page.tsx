"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Mic, MicOff, Square, Pause, Play, Volume2, VolumeX, ChevronDown } from "lucide-react";

type Message = {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
};

const speedOptions = [0.7, 1.0, 1.25, 1.5];
const speedLabels: Record<number, string> = { 0.7: "0.7×", 1.0: "1×", 1.25: "1.25×", 1.5: "1.5×" };

function getSupportedMimeType() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", ""];
  for (const type of types) {
    if (type === "" || MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function getBestVoice(voices: SpeechSynthesisVoice[], preferred: string): SpeechSynthesisVoice | null {
  const priority = preferred === "female"
    ? ["Google UK English Female", "Google US English", "Samantha", "Karen", "Moira", "Tessa"]
    : ["Google UK English Male", "Daniel", "Alex", "Fred", "Bruce", "Ralph"];
  for (const name of priority) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  return voices.find(v => v.lang.startsWith("en")) ?? null;
}

export default function ConversationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const topic = searchParams.get("topic") ?? "General conversation";
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMessage = useRef(true);

  // Load available voices
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const speakText = useCallback((text: string, msgId: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = 1.1;
    utterance.lang = "en-GB";

    const bestVoice = getBestVoice(voices, "female");
    if (bestVoice) utterance.voice = bestVoice;

    setSpeakingMsgId(msgId);
    utterance.onstart = () => setIsAISpeaking(true);
    utterance.onend = () => {
      setIsAISpeaking(false);
      setCurrentSpeech("");
      setSpeakingMsgId(null);
    };
    utterance.onboundary = (e) => {
      if (e.name === "word") setCurrentSpeech(text.slice(0, e.charIndex + e.charLength));
    };
    window.speechSynthesis.speak(utterance);
  }, [isMuted, speed, voices]);

  const getAIResponse = useCallback(async (msgs: Message[], isFirst = false) => {
    setIsThinking(true);
    try {
      const res = await fetch("/api/v1/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs.map(m => ({ role: m.role, content: m.content })),
          topic, difficulty: "intermediate", isFirst,
        }),
      });
      const data = await res.json();
      const aiText = data.data?.message ?? "Sorry, could you try again?";
      const msgId = Date.now().toString();
      const aiMsg: Message = { id: msgId, role: "ai", content: aiText, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      speakText(aiText, msgId);
    } catch { console.error("AI response failed"); }
    finally { setIsThinking(false); }
  }, [topic, speakText]);

  useEffect(() => {
    if (isFirstMessage.current) {
      isFirstMessage.current = false;
      getAIResponse([], true);
    }
  }, [getAIResponse]);

  async function startRecording() {
    if (isAISpeaking) window.speechSynthesis.cancel();
    if (isThinking || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      audioChunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunks.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingDuration(0);
        const blob = new Blob(audioChunks.current, { type: mimeType || "audio/webm" });
        if (blob.size < 500) return;
        await transcribeAndRespond(blob);
      };
      recorder.start(100);
      mediaRecorder.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch { alert("Microphone access denied."); }
  }

  function stopRecording() {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  }

  async function transcribeAndRespond(blob: Blob) {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/v1/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      const text = data.data?.text?.trim();
      if (!text) { setIsTranscribing(false); return; }
      const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
      setMessages(prev => {
        const updated = [...prev, userMsg];
        getAIResponse(updated);
        return updated;
      });
    } catch { console.error("Transcription failed"); }
    finally { setIsTranscribing(false); }
  }

  async function endSession() {
    window.speechSynthesis.cancel();
    if (isRecording) stopRecording();
    if (timerRef.current) clearInterval(timerRef.current);
    await fetch(`/api/v1/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration_seconds: timer }),
    });
    router.push(`/session/${sessionId}/feedback`);
  }

  const canRecord = !isPaused && !isThinking && !isTranscribing;

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fafaf8", maxWidth: "680px", margin: "0 auto" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#fff", borderBottom: "1px solid #ebebeb", flexShrink: 0 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#999" }}>← Back</button>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "16px", color: "#1a1a1a", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic}</span>
        <span style={{ fontSize: "11px", background: "#f0f0ee", padding: "3px 8px", borderRadius: "6px", color: "#666" }}>Intermediate</span>
      </nav>

      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "#fff", borderBottom: "1px solid #ebebeb", flexShrink: 0 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#1a1a1a" }}>{formatTime(timer)}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowSpeedMenu(s => !s)}
              style={{ display: "flex", alignItems: "center", gap: "4px", background: "#f0f0ee", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}>
              {speedLabels[speed]} <ChevronDown size={12} />
            </button>
            {showSpeedMenu && (
              <div style={{ position: "absolute", right: 0, top: "30px", background: "#fff", border: "1px solid #ebebeb", borderRadius: "8px", overflow: "hidden", zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                {speedOptions.map(s => (
                  <button key={s} onClick={() => { setSpeed(s); setShowSpeedMenu(false); window.speechSynthesis.cancel(); }}
                    style={{ display: "block", width: "100%", padding: "8px 16px", background: speed === s ? "#f0f0ee" : "#fff", border: "none", cursor: "pointer", fontSize: "12px", color: "#1a1a1a", textAlign: "left" }}>
                    {speedLabels[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setIsMuted(m => !m); window.speechSynthesis.cancel(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: isMuted ? "#ef4444" : "#999" }}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: isRecording ? "#ef4444" : isAISpeaking ? "#4ade80" : "#999" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isRecording ? "#ef4444" : isAISpeaking ? "#4ade80" : "#ccc", animation: (isRecording || isAISpeaking) ? "pulse 1.5s infinite" : "none" }} />
            {isRecording ? `Recording ${formatTime(recordingDuration)}` : isAISpeaking ? "Speaking" : isTranscribing ? "Transcribing..." : isThinking ? "Thinking..." : "Ready"}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "ai" && <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#aaa", marginBottom: "4px" }}>SPEAKUP AI</span>}
            <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: "16px", borderBottomLeftRadius: msg.role === "ai" ? "4px" : "16px", borderBottomRightRadius: msg.role === "user" ? "4px" : "16px", background: msg.role === "user" ? "#1a1a1a" : "#fff", border: msg.role === "ai" ? "1px solid #ebebeb" : "none", color: msg.role === "user" ? "#fafaf8" : "#1a1a1a", fontSize: "14px", lineHeight: 1.6 }}>
              {msg.content}
            </div>
            {/* Live subtitle only for currently speaking message */}
            {msg.role === "ai" && speakingMsgId === msg.id && isAISpeaking && currentSpeech && (
              <div style={{ maxWidth: "78%", marginTop: "4px", fontSize: "11px", color: "#aaa", fontStyle: "italic", paddingLeft: "4px" }}>
                {currentSpeech}
              </div>
            )}
            {msg.role === "user" && <span style={{ fontSize: "10px", color: "#bbb", marginTop: "3px" }}>You · {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
          </div>
        ))}

        {isThinking && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", color: "#aaa", marginBottom: "4px" }}>SPEAKUP AI</span>
            <div style={{ padding: "12px 16px", borderRadius: "16px", borderBottomLeftRadius: "4px", background: "#fff", border: "1px solid #ebebeb", display: "flex", gap: "4px", alignItems: "center" }}>
              {[0, 1, 2].map(i => <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ccc", display: "inline-block", animation: `bounce 1s infinite ${i * 0.2}s` }} />)}
            </div>
          </div>
        )}

        {isTranscribing && <div style={{ alignSelf: "flex-end", fontSize: "12px", color: "#aaa", fontStyle: "italic" }}>Processing your voice...</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Controls */}
      <div style={{ padding: "16px 20px 28px", background: "#fff", borderTop: "1px solid #ebebeb", flexShrink: 0 }}>
        <p style={{ textAlign: "center", fontSize: "12px", color: isRecording ? "#ef4444" : "#bbb", marginBottom: "14px", fontWeight: isRecording ? 500 : 400 }}>
          {isRecording ? `🔴 Recording ${formatTime(recordingDuration)} — tap mic again when done`
            : isPaused ? "Session paused"
            : isThinking ? "AI is thinking..."
            : isTranscribing ? "Processing your voice..."
            : isAISpeaking ? "AI is speaking — tap mic to interrupt"
            : "Tap the mic and speak — tap again to send"}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
          <button onClick={() => { setIsPaused(p => !p); if (isRecording) stopRecording(); }}
            style={{ width: "46px", height: "46px", borderRadius: "50%", background: isPaused ? "#1a1a1a" : "#f0f0ee", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isPaused ? "#fff" : "#666" }}>
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button onClick={isRecording ? stopRecording : startRecording} disabled={!canRecord}
            style={{ width: "72px", height: "72px", borderRadius: "50%", background: isRecording ? "#ef4444" : canRecord ? "#1a1a1a" : "#ccc", border: "none", cursor: canRecord ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: isRecording ? "0 0 0 10px rgba(239,68,68,0.12), 0 0 0 20px rgba(239,68,68,0.06)" : "0 4px 16px rgba(0,0,0,0.15)", transition: "all 0.2s" }}>
            {isRecording ? <MicOff size={26} /> : <Mic size={26} />}
          </button>
          <button onClick={endSession}
            style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#fee2e2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
            <Square size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>
    </main>
  );
}
