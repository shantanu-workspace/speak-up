import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/with-ratelimit";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const limited = await withRateLimit(request);
    if (limited) return limited;

    const { userId } = await auth();
    if (!userId) return errorResponse("Unauthorized", 401);

    const user = await currentUser();
    if (!user) return errorResponse("User not found", 404);

    const supabase = createAdminClient();
    const email = user.emailAddresses[0]?.emailAddress ?? "";
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    const { data, error } = await supabase
      .from("users")
      .upsert(
        { clerk_id: userId, email, full_name: fullName, updated_at: new Date().toISOString() },
        { onConflict: "clerk_id" }
      )
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse({ user: data });
  } catch (err) {
    console.error("Sync error:", err);
    return errorResponse("Internal server error", 500);
  }
}
