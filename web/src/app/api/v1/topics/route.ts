import { auth } from "@clerk/nextjs/server";
import { geminiFlash } from "@/lib/gemini";
import { withRateLimit } from "@/lib/with-ratelimit";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  category: z.string().min(2).max(50),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

const difficultyGuide = {
  beginner: "very simple, everyday topics requiring basic vocabulary and short sentences",
  intermediate: "moderately engaging topics requiring some descriptive language",
  advanced: "thought-provoking topics requiring complex vocabulary and opinions",
};

export async function POST(request: NextRequest) {
  try {
    const limited = await withRateLimit(request);
    if (limited) return limited;

    const { userId } = await auth();
    if (!userId) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse("Invalid input", 400);

    const { category, difficulty } = parsed.data;

    const prompt = `Generate exactly 3 conversation topic ideas for an English learner.
Category: "${category}"
Level: ${difficulty} — topics should be ${difficultyGuide[difficulty]}

Rules:
- Each topic must start with a relevant emoji, followed by the topic (max 8 words)
- Topics must feel natural and relatable for an Indian user
- Return ONLY a JSON array of 3 strings, nothing else, no markdown
- Example: ["☀️ Your morning chai ritual", "🏠 Chores you hate doing", "📱 Apps you use daily"]`;

    const result = await geminiFlash.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const topics = JSON.parse(clean);

    if (!Array.isArray(topics) || topics.length !== 3) {
      return errorResponse("Failed to generate topics", 500);
    }

    return successResponse({ topics });
  } catch (err) {
    console.error("Topics error:", err);
    return errorResponse("Internal server error", 500);
  }
}
