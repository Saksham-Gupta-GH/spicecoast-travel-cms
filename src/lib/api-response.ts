import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export function internalServerError(context: string, error: unknown) {
  const requestId = randomUUID();
  console.error(`[${requestId}] ${context}`, error);
  return NextResponse.json(
    { success: false, error: "An unexpected server error occurred", request_id: requestId },
    { status: 500 }
  );
}
