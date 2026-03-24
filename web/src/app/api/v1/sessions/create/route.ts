import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/with-ratelimit";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2).max(100),
  difficulty_level: z.enum(["beginner", "intermediate", "advanced"]),
});

export async function POST(request: NextRequest) {
  try {
    const limited = await withRateLimit(request);
    if (limited) return limited;

    const { userId } = await auth();
    if (!userId) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse("Invalid input", 400);

    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) return errorResponse("User not found", 404);

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        difficulty_level: parsed.data.difficulty_level,
        status: "active",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse({ session });
  } catch (err) {
    console.error(err);
    return errorResponse("Internal server error", 500);
  }
}
