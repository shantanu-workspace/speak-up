import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDailyQuote } from "@/lib/quotes";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const supabase = createAdminClient();
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, difficulty_level, preferred_accent, preferred_voice")
    .eq("clerk_id", userId)
    .single();

  if (!dbUser) {
    await supabase.from("users").upsert(
      { clerk_id: userId, email, full_name: fullName, updated_at: new Date().toISOString() },
      { onConflict: "clerk_id" }
    );
    redirect("/onboarding");
  }

  if (!dbUser.difficulty_level) redirect("/onboarding");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, difficulty_level, duration_seconds, completed_at, feedback(overall_score)")
    .eq("user_id", dbUser.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(5);

  const scores = sessions
    ?.flatMap((s: any) => s.feedback)
    ?.map((f: any) => f?.overall_score)
    ?.filter(Boolean) ?? [];
  const avgScore = scores.length
    ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
    : null;

  const { data: streakData } = await supabase
    .from("sessions")
    .select("completed_at")
    .eq("user_id", dbUser.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  let streak = 0;
  if (streakData && streakData.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = streakData.map((s: any) => {
      const d = new Date(s.completed_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = today.getTime() - i * 86400000;
      if (uniqueDates[i] === expected) streak++;
      else break;
    }
  }

  const quote = getDailyQuote();

  return (
    <DashboardClient
      firstName={user.firstName ?? "Friend"}
      sessions={sessions ?? []}
      totalSessions={sessions?.length ?? 0}
      avgScore={avgScore}
      streak={streak}
      quote={quote}
      difficulty={dbUser.difficulty_level}
    />
  );
}
