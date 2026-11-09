import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type StoreState = {
  collections: string[];
  collectionProducts: Record<string, string[]>;
  savedProducts: string[];
  cart: Record<string, number>;
};

function isStringList(value: unknown, maximum: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maximum &&
    value.every(
      (item) => typeof item === "string" && item.trim().length > 0 && item.length <= 160,
    )
  );
}

function parseStoreState(value: unknown): StoreState | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    !isStringList(record.collections, 500) ||
    !isStringList(record.savedProducts, 2000) ||
    typeof record.collectionProducts !== "object" ||
    record.collectionProducts === null ||
    Array.isArray(record.collectionProducts) ||
    typeof record.cart !== "object" ||
    record.cart === null ||
    Array.isArray(record.cart)
  ) {
    return null;
  }

  const collectionProducts: Record<string, string[]> = {};
  for (const [collection, items] of Object.entries(record.collectionProducts)) {
    if (
      collection.length > 120 ||
      !record.collections.includes(collection) ||
      !isStringList(items, 2000)
    ) {
      return null;
    }
    collectionProducts[collection] = items;
  }

  const cart: Record<string, number> = {};
  for (const [product, quantity] of Object.entries(record.cart)) {
    if (
      product.length === 0 ||
      product.length > 160 ||
      !Number.isInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > 999
    ) {
      return null;
    }
    cart[product] = quantity as number;
  }

  return {
    collections: record.collections.map((name) => name.trim()),
    collectionProducts,
    savedProducts: record.savedProducts.map((name) => name.trim()),
    cart,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Could not verify customer store session.", userError);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to sync your saved items and cart." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("customer_store_state")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not load customer store state.", error);
    return NextResponse.json({ error: "Could not load saved collections and cart." }, { status: 500 });
  }
  return NextResponse.json({ state: data?.state ?? null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Could not verify customer store session.", userError);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to sync your saved items and cart." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const state = parseStoreState(payload);
  if (!state) {
    return NextResponse.json({ error: "Your saved collections or cart have invalid data." }, { status: 400 });
  }

  const { error } = await supabase.from("customer_store_state").upsert(
    { user_id: user.id, state, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("Could not save customer store state.", error);
    return NextResponse.json({ error: "Could not save your cart and collections." }, { status: 500 });
  }
  return NextResponse.json({ saved: true });
}
