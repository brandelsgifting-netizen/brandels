import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function metadataText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError" && error.status !== 401) {
    console.error("Could not verify vendor account session.", error);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage your vendor products." }, { status: 401 });
  }

  const metadata = user.user_metadata ?? {};
  const fullName = [
    metadataText(metadata.first_name),
    metadataText(metadata.last_name),
  ]
    .filter(Boolean)
    .join(" ");
  const email = user.email ?? "";

  return NextResponse.json({
    account: {
      businessName:
        metadataText(metadata.business_name) ||
        metadataText(metadata.company_name) ||
        fullName ||
        email.split("@")[0] ||
        "My store",
      email,
    },
  });
}
