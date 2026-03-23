import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/with-ratelimit";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const limited = await withRateLimit(request);
    if (limited) return limited;

    const { userId } = await auth();
    if (!userId) return errorResponse("Unauthorized", 401);

    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) return errorResponse("User not found", 404);

    const { data: sessions } = await supabase
      .from("sessions")
      .select(`
        id, title, difficulty_level, status,
        duration_seconds, started_at, completed_at,
        feedback(overall_score)
      `)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10);

    const totalSessions = sessions?.length ?? 0;
    const scores = sessions
      ?.flatMap(s => s.feedback)
      ?.map((f: any) => f?.overall_score)
      ?.filter(Boolean) ?? [];
    const avgScore = scores.length
      ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
      : null;

    return successResponse({ sessions: sessions ?? [], totalSessions, avgScore });
  } catch (err) {
    console.error(err);
    return errorResponse("Internal server error", 500);
  }
}
