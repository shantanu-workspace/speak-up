import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/with-ratelimit";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  difficulty_level: z.enum(["beginner", "intermediate", "advanced"]),
  preferred_accent: z.enum(["neutral", "american", "british", "australian"]),
  preferred_voice: z.enum(["male", "female"]),
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
    const { error } = await supabase
      .from("users")
      .update({
        difficulty_level: parsed.data.difficulty_level,
        preferred_accent: parsed.data.preferred_accent,
        preferred_voice: parsed.data.preferred_voice,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", userId);

    if (error) return errorResponse(error.message, 500);
    return successResponse({ message: "Preferences saved" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
