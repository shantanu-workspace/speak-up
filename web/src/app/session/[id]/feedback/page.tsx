"use client";
import { useRouter } from "next/navigation";

export default function FeedbackPage() {
  const router = useRouter();
  return (
    <main style={{ minHeight: "100vh", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", color: "#1a1a1a" }}>Session complete! 🎉</h1>
      <p style={{ color: "#999", fontSize: "14px" }}>Feedback coming on Day 10.</p>
      <button onClick={() => router.push("/dashboard")} style={{ background: "#1a1a1a", color: "#fafaf8", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", cursor: "pointer" }}>Back to dashboard</button>
    </main>
  );
}
