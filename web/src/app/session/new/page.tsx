"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

const categories = [
  { id: "Daily life & routines", emoji: "☀️" },
  { id: "Work & career", emoji: "💼" },
  { id: "Travel & places", emoji: "✈️" },
  { id: "Food & culture", emoji: "🍛" },
  { id: "Sports & hobbies", emoji: "🏏" },
  { id: "News & current events", emoji: "📰" },
  { id: "Family & relationships", emoji: "👨‍👩‍👧" },
  { id: "Technology & gadgets", emoji: "📱" },
];

export default function NewSessionPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [showTopics, setShowTopics] = useState(false);

  async function handleProceed() {
    if (!selectedCategory) return;
    setLoadingTopics(true);
    setShowTopics(true);
    setTopics([]);
    setSelectedTopic("");

    const res = await fetch("/api/v1/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: selectedCategory, difficulty: "intermediate" }),
    });
    const data = await res.json();
    setTopics(data.data?.topics ?? []);
    setLoadingTopics(false);
  }

  async function handleStartSession() {
    if (!selectedTopic) return;
    setStartingSession(true);
    const res = await fetch("/api/v1/sessions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: selectedTopic, difficulty_level: "intermediate" }),
    });
    const data = await res.json();
    if (data.data?.session?.id) {
      router.push(`/session/${data.data.session.id}?topic=${encodeURIComponent(selectedTopic)}`);
    }
    setStartingSession(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fafaf8" }}>

      {/* Nav — clean, no collision */}
      <nav style={{ padding: "16px 24px", background: "#fff", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center" }}>
        <button
          onClick={() => showTopics ? (setShowTopics(false), setTopics([])) : router.push("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#999", padding: "4px 0" }}>
          <ArrowLeft size={18} />
        </button>
      </nav>

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "32px 24px 100px" }}>

        {!showTopics ? (
          <>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#1a1a1a", marginBottom: "6px", lineHeight: 1.2 }}>
              What do you want to talk about?
            </h1>
            <p style={{ fontSize: "14px", color: "#999", marginBottom: "28px" }}>
              Pick a category and we'll suggest 3 topics for you.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "32px" }}>
              {categories.map(c => (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                  style={{
                    background: selectedCategory === c.id ? "#1a1a1a" : "#fff",
                    border: `1.5px solid ${selectedCategory === c.id ? "#1a1a1a" : "#ebebeb"}`,
                    borderRadius: "12px", padding: "16px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (selectedCategory !== c.id) { e.currentTarget.style.borderColor = "#1a1a1a"; } }}
                  onMouseLeave={e => { if (selectedCategory !== c.id) { e.currentTarget.style.borderColor = "#ebebeb"; } }}
                >
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>{c.emoji}</div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: selectedCategory === c.id ? "#fafaf8" : "#1a1a1a", lineHeight: 1.3 }}>{c.id}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Sparkles size={14} color="#999" />
              <span style={{ fontSize: "12px", color: "#999", fontWeight: 500 }}>{selectedCategory}</span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#1a1a1a", marginBottom: "6px", lineHeight: 1.2 }}>
              Choose your topic
            </h1>
            <p style={{ fontSize: "14px", color: "#999", marginBottom: "24px" }}>
              AI picked these based on your level.
            </p>

            {loadingTopics ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: "#fff", border: "1.5px solid #ebebeb", borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <Loader2 size={16} color="#ccc" style={{ animation: "spin 1s linear infinite" }} />
                    <div style={{ height: "14px", background: "#f0f0ee", borderRadius: "4px", width: `${50 + i * 15}%` }} />
                  </div>
                ))}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {topics.map(topic => (
                  <button key={topic} onClick={() => setSelectedTopic(topic)}
                    style={{
                      background: selectedTopic === topic ? "#1a1a1a" : "#fff",
                      border: `1.5px solid ${selectedTopic === topic ? "#1a1a1a" : "#ebebeb"}`,
                      borderRadius: "12px", padding: "18px 20px", cursor: "pointer",
                      textAlign: "left", fontSize: "14px", fontWeight: 500,
                      color: selectedTopic === topic ? "#fafaf8" : "#1a1a1a", transition: "all 0.15s",
                    }}>
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom button */}
      {!showTopics && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px", background: "#fafaf8", borderTop: "1px solid #ebebeb" }}>
          <div style={{ maxWidth: "520px", margin: "0 auto" }}>
            <button onClick={handleProceed} disabled={!selectedCategory}
              style={{ width: "100%", padding: "16px", background: selectedCategory ? "#1a1a1a" : "#ebebeb", color: selectedCategory ? "#fafaf8" : "#999", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: selectedCategory ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
              See topics →
            </button>
          </div>
        </div>
      )}

      {showTopics && !loadingTopics && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px", background: "#fafaf8", borderTop: "1px solid #ebebeb" }}>
          <div style={{ maxWidth: "520px", margin: "0 auto" }}>
            <button onClick={handleStartSession} disabled={!selectedTopic || startingSession}
              style={{ width: "100%", padding: "16px", background: selectedTopic ? "#1a1a1a" : "#ebebeb", color: selectedTopic ? "#fafaf8" : "#999", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: selectedTopic ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}>
              {startingSession
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Starting...</>
                : "Start conversation →"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
