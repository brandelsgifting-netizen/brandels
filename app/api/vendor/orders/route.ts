import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OrderAsset = "design_path" | "logo_path";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && userError.name !== "AuthSessionMissingError" && userError.status !== 401) {
    console.error("Could not verify vendor orders session.", userError);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your orders." }, { status: 401 });
  }

  const { data: orders, error } = await supabase
    .from("vendor_orders")
    .select(
      "id, product_name, quantity, branded, unit_price_minor_units, total_minor_units, currency, buyer_name, buyer_email, buyer_phone, shipping_address, design_path, logo_path, status, paid_at, created_at",
    )
    .eq("vendor_user_id", user.id)
    .in("status", ["paid", "payment_review", "processing", "shipped"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load vendor orders.", error);
    return NextResponse.json({ error: "Could not load your orders." }, { status: 500 });
  }

  const withSignedAssets = await Promise.all(
    orders.map(async (order) => {
      const signedAssets: Partial<Record<OrderAsset, string>> = {};
      for (const field of ["design_path", "logo_path"] as const) {
        const path = order[field];
        if (!path) continue;
        const { data, error: signedUrlError } = await supabase.storage
          .from("vendor-order-assets")
          .createSignedUrl(path, 60 * 60);
        if (signedUrlError) {
          console.error("Could not create a signed order-asset URL.", signedUrlError);
          throw new Error("Could not load order files.");
        }
        signedAssets[field] = data.signedUrl;
      }
      return {
        ...order,
        design_url: signedAssets.design_path ?? null,
        logo_url: signedAssets.logo_path ?? null,
      };
    }),
  ).catch((assetError: unknown) => {
    console.error("Could not sign vendor order assets.", assetError);
    return null;
  });

  if (!withSignedAssets) {
    return NextResponse.json({ error: "Could not load order files." }, { status: 500 });
  }

  return NextResponse.json({ orders: withSignedAssets });
}
