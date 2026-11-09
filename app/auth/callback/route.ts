import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");
  const isRecovery = nextPath === "/account/update-password";
  const safeNextPath =
    nextPath?.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/";

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=missing_code", request.url),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Could not exchange the Supabase auth callback code.", error);
    return NextResponse.redirect(new URL("/auth/error?reason=callback_failed", request.url));
  }

  return NextResponse.redirect(
    new URL(isRecovery ? "/account/update-password" : safeNextPath, request.url),
  );
}
