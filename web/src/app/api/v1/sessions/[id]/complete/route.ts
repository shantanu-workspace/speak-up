import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({ duration_seconds: z.number() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return errorResponse("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse("Invalid input", 400);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("sessions")
      .update({ status: "completed", duration_seconds: parsed.data.duration_seconds, completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return errorResponse(error.message, 500);
    return successResponse({ message: "Session completed" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
