"use client";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Mic, Clock, TrendingUp, Flame } from "lucide-react";

type Session = {
  id: string;
  title: string;
  difficulty_level: string;
  duration_seconds: number;
  completed_at: string;
  feedback: { overall_score: number }[];
};

type Props = {
  firstName: string;
  sessions: Session[];
  totalSessions: number;
  avgScore: string | null;
  streak: number;
  quote: { text: string; author: string };
  difficulty: string;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return m < 1 ? "< 1 min" : `${m} min`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const difficultyColor: Record<string, string> = {
  beginner: "#4ade80",
  intermediate: "#facc15",
  advanced: "#f87171",
};

export default function DashboardClient({ firstName, sessions, totalSessions, avgScore, streak, quote, difficulty }: Props) {
  const router = useRouter();

  return (
    <main style={{ minHeight: "100vh", background: "#fafaf8" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", background: "#fff", borderBottom: "1px solid #ebebeb", position: "sticky", top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#1a1a1a" }}>SpeakUp</span>
        <UserButton afterSignOutUrl="/" />
      </nav>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Greeting */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", color: "#999", marginBottom: "4px" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "34px", color: "#1a1a1a", lineHeight: 1.15 }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName}.
          </h1>
        </div>

        {/* Quote card */}
        <div style={{ background: "#1a1a1a", borderRadius: "16px", padding: "22px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "15px", color: "#fafaf8", lineHeight: 1.7, marginBottom: "10px" }}>
            "{quote.text}"
          </p>
          <p style={{ fontSize: "11px", color: "#666", letterSpacing: "0.06em", textTransform: "uppercase" }}>— {quote.author}</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          {[
            { icon: <Flame size={16} color="#f97316" />, value: streak, label: "Day streak" },
            { icon: <TrendingUp size={16} color="#4ade80" />, value: totalSessions, label: "Sessions" },
            { icon: <TrendingUp size={16} color="#818cf8" />, value: avgScore ?? "—", label: "Avg score" },
          ].map((stat, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>{stat.icon}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#1a1a1a", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "4px", letterSpacing: "0.04em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Start session button */}
        <button
          onClick={() => router.push("/session/new")}
          style={{ width: "100%", background: "#1a1a1a", color: "#fafaf8", border: "none", borderRadius: "14px", padding: "18px", fontSize: "15px", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "28px", transition: "opacity 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          Start new session
          <Mic size={16} />
        </button>

        {/* Recent sessions */}
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>
            Recent sessions
          </p>

          {sessions.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", padding: "40px", textAlign: "center" }}>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px", color: "#1a1a1a", marginBottom: "8px" }}>No sessions yet</p>
              <p style={{ fontSize: "13px", color: "#999" }}>Start your first conversation to see your history here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#ebebeb", borderRadius: "14px", overflow: "hidden" }}>
              {sessions.map((s, i) => {
                const score = s.feedback?.[0]?.overall_score;
                return (
                  <div key={s.id} style={{ background: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafaf8")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                    onClick={() => router.push(`/session/${s.id}/feedback`)}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "3px" }}>{s.title}</div>
                      <div style={{ fontSize: "12px", color: "#aaa", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{timeAgo(s.completed_at)}</span>
                        <span>·</span>
                        <span>{formatDuration(s.duration_seconds)}</span>
                        <span>·</span>
                        <span style={{ color: difficultyColor[s.difficulty_level] ?? "#aaa", textTransform: "capitalize" }}>{s.difficulty_level}</span>
                      </div>
                    </div>
                    {score && (
                      <div style={{ background: "#f5f4f0", borderRadius: "8px", padding: "6px 10px", fontSize: "13px", fontWeight: 600, color: "#1a1a1a", minWidth: "40px", textAlign: "center" }}>
                        {score}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
