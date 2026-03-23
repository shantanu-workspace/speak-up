"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Volume2, Gauge } from "lucide-react";

const difficulties = [
  {
    id: "beginner",
    label: "Beginner",
    desc: "I know basic English but struggle with conversations",
    emoji: "🌱",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    desc: "I can hold conversations but make grammar mistakes",
    emoji: "🌿",
  },
  {
    id: "advanced",
    label: "Advanced",
    desc: "I speak well but want to refine fluency and accent",
    emoji: "🌳",
  },
];

const accents = [
  { id: "neutral", label: "Neutral", desc: "Clear global English" },
  { id: "american", label: "American", desc: "US accent" },
  { id: "british", label: "British", desc: "UK accent" },
];

const voices = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [difficulty, setDifficulty] = useState("");
  const [accent, setAccent] = useState("neutral");
  const [voice, setVoice] = useState("female");
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);
    await fetch("/api/v1/users/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty_level: difficulty, preferred_accent: accent, preferred_voice: voice }),
    });
    router.push("/dashboard");
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>

        {/* Logo */}
        <div style={{ fontFamily: "var(--font-serif)", fontSize: "24px", marginBottom: "32px", textAlign: "center" }}>
          SpeakUp
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "32px" }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: s === step ? "24px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: s <= step ? "var(--ink)" : "var(--border)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        {/* Step 1 — Difficulty */}
        {step === 1 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Gauge size={18} color="var(--ink-muted)" />
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Step 1 of 3</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", marginBottom: "6px", lineHeight: 1.2 }}>Where are you right now?</h1>
            <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "24px", lineHeight: 1.6 }}>Pick the level that feels most like you. You can always change this later.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {difficulties.map(d => (
                <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
                  background: difficulty === d.id ? "var(--ink)" : "var(--bg-card)",
                  border: `1.5px solid ${difficulty === d.id ? "var(--ink)" : "var(--border)"}`,
                  borderRadius: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  display: "flex",
                  gap: "14px",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: "24px" }}>{d.emoji}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: difficulty === d.id ? "var(--bg)" : "var(--ink)", marginBottom: "2px" }}>{d.label}</div>
                    <div style={{ fontSize: "12px", color: difficulty === d.id ? "#aaa" : "var(--ink-muted)", lineHeight: 1.4 }}>{d.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!difficulty} style={{
              width: "100%", padding: "14px", background: difficulty ? "var(--ink)" : "var(--border)",
              color: difficulty ? "var(--bg)" : "var(--ink-muted)", border: "none", borderRadius: "12px",
              fontSize: "14px", fontWeight: 500, cursor: difficulty ? "pointer" : "not-allowed", transition: "all 0.2s",
            }}>Continue →</button>
          </div>
        )}

        {/* Step 2 — Accent */}
        {step === 2 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Volume2 size={18} color="var(--ink-muted)" />
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Step 2 of 3</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", marginBottom: "6px", lineHeight: 1.2 }}>Which accent feels comfortable?</h1>
            <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "24px", lineHeight: 1.6 }}>The AI will speak in this accent so it feels natural to you.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {accents.map(a => (
                <button key={a.id} onClick={() => setAccent(a.id)} style={{
                  background: accent === a.id ? "var(--ink)" : "var(--bg-card)",
                  border: `1.5px solid ${accent === a.id ? "var(--ink)" : "var(--border)"}`,
                  borderRadius: "12px", padding: "16px", cursor: "pointer", textAlign: "left",
                  transition: "all 0.2s ease",
                }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: accent === a.id ? "var(--bg)" : "var(--ink)", marginBottom: "2px" }}>{a.label}</div>
                  <div style={{ fontSize: "12px", color: accent === a.id ? "#aaa" : "var(--ink-muted)" }}>{a.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "14px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "12px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 2, padding: "14px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Voice */}
        {step === 3 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Mic size={18} color="var(--ink-muted)" />
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-muted)" }}>Step 3 of 3</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", marginBottom: "6px", lineHeight: 1.2 }}>Pick a voice for your AI coach.</h1>
            <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "24px", lineHeight: 1.6 }}>You can change this anytime from settings.</p>
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              {voices.map(v => (
                <button key={v.id} onClick={() => setVoice(v.id)} style={{
                  flex: 1, padding: "20px", background: voice === v.id ? "var(--ink)" : "var(--bg-card)",
                  border: `1.5px solid ${voice === v.id ? "var(--ink)" : "var(--border)"}`,
                  borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: 600,
                  color: voice === v.id ? "var(--bg)" : "var(--ink)", transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>{v.id === "female" ? "👩" : "👨"}</div>
                  {v.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "14px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "12px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>← Back</button>
              <button onClick={handleFinish} disabled={loading} style={{ flex: 2, padding: "14px", background: "var(--ink)", color: "var(--bg)", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                {loading ? "Setting up..." : "Let's go 🎙️"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
