import { auth } from "@clerk/nextjs/server";
import { rateLimiter } from "./ratelimit";
import { rateLimitResponse, errorResponse } from "./api-response";
import { NextRequest } from "next/server";

export async function withRateLimit(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return errorResponse("Unauthorized", 401);

  const identifier = `user_${userId}`;
  const { success } = await rateLimiter.limit(identifier);

  if (!success) return rateLimitResponse();
  return null;
}
