import { auth } from "@clerk/nextjs/server";
import { geminiFlash } from "@/lib/gemini";
import { withRateLimit } from "@/lib/with-ratelimit";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "ai"]),
    content: z.string(),
  })),
  topic: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  isFirst: z.boolean().optional(),
});

const difficultyInstructions: Record<string, string> = {
  beginner: `Use very simple English. Short sentences. Common words only.
Ask only one simple question at a time.
If the user makes a grammar mistake, gently use the correct form naturally in your reply without explicitly pointing it out.`,
  intermediate: `Use clear conversational English. Medium length sentences.
Ask one follow-up question. Occasionally introduce a new vocabulary word naturally in context.`,
  advanced: `Use natural fluent English with varied vocabulary.
Challenge the user with nuanced questions. Introduce idioms and complex sentence structures naturally.`,
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

    const { messages, topic, difficulty, isFirst } = parsed.data;

    const systemPrompt = `You are SpeakUp AI, a warm and encouraging English conversation coach.
You are having a spoken conversation with an Indian English learner about: ${topic}.
Difficulty level: ${difficulty.toUpperCase()}

Instructions:
${difficultyInstructions[difficulty]}

Personality:
- Be warm, patient, and encouraging
- Keep responses conversational and natural (2-4 sentences max)
- Never say you are an AI or mention you are a language model
- Never give long lectures, keep it like a real conversation
- End every response with exactly one question to keep the conversation going`;

    if (isFirst) {
      const result = await geminiFlash.generateContent({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: `Start the conversation about: ${topic}. Greet me warmly and ask an opening question.` }] }],
      });
      return successResponse({ message: result.response.text().trim() });
    }

    // Build history — must start with user, alternate user/model
    const history = messages.slice(0, -1);
    const geminiHistory = [];
    for (const msg of history) {
      if (geminiHistory.length === 0 && msg.role === "ai") continue; // skip leading AI messages
      geminiHistory.push({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    const lastUserMessage = messages[messages.length - 1]?.content ?? "";

    const chat = geminiFlash.startChat({
      history: geminiHistory,
      systemInstruction: { parts: [{ text: systemPrompt }] },
    });

    const result = await chat.sendMessage(lastUserMessage);
    return successResponse({ message: result.response.text().trim() });
  } catch (err) {
    console.error("Conversation error:", err);
    return errorResponse("Internal server error", 500);
  }
}
