import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_products")
    .select("id, vendor_user_id, name, description, category, price_minor_units, currency, inventory, image_url, image_urls")
    .eq("status", "active")
    .gt("inventory", 0)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load published vendor products.", error);
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }
  return NextResponse.json({ products: data });
}
