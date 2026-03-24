import { auth } from "@clerk/nextjs/server";
import { groq } from "@/lib/groq";
import { withRateLimit } from "@/lib/with-ratelimit";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const limited = await withRateLimit(request);
    if (limited) return limited;

    const { userId } = await auth();
    if (!userId) return errorResponse("Unauthorized", 401);

    const formData = await request.formData();
    const audio = formData.get("audio") as File;

    if (!audio) return errorResponse("No audio file", 400);
    if (audio.size > 25 * 1024 * 1024) return errorResponse("File too large", 400);

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: "whisper-large-v3",
      language: "en",
      response_format: "json",
    });

    return successResponse({ text: transcription.text });
  } catch (err) {
    console.error("Transcription error:", err);
    return errorResponse("Internal server error", 500);
  }
}
