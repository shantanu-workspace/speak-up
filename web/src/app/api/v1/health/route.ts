import { successResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return successResponse({
    status: "ok",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
}
