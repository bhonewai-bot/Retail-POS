import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

const handler = toNextJsHandler(auth);

export function GET(request: NextRequest) {
  return handler.GET(request as unknown as Request);
}

export function POST(request: NextRequest) {
  return handler.POST(request as unknown as Request);
}
