import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type VendorProductInput = {
  name: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  inventory: number;
  sku: string;
  tags: string[];
  imageUrls: string[];
  status: "draft" | "active";
};

const PRODUCT_SELECT =
  "id, name, description, category, price_minor_units, compare_at_price_minor_units, currency, inventory, sku, tags, image_url, image_urls, status, created_at, updated_at";

function parseProduct(value: unknown): VendorProductInput | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.name !== "string" ||
    record.name.trim().length === 0 ||
    record.name.trim().length > 160 ||
    typeof record.description !== "string" ||
    record.description.length > 5000 ||
    typeof record.category !== "string" ||
    record.category.trim().length === 0 ||
    record.category.trim().length > 120 ||
    typeof record.price !== "number" ||
    !Number.isFinite(record.price) ||
    record.price < 0 ||
    record.price > 100_000_000 ||
    (record.compareAtPrice !== null &&
      (typeof record.compareAtPrice !== "number" ||
        !Number.isFinite(record.compareAtPrice) ||
        record.compareAtPrice < record.price ||
        record.compareAtPrice > 100_000_000)) ||
    typeof record.inventory !== "number" ||
    !Number.isInteger(record.inventory) ||
    record.inventory < 0 ||
    record.inventory > 1_000_000 ||
    typeof record.sku !== "string" ||
    record.sku.trim().length > 100 ||
    !Array.isArray(record.tags) ||
    record.tags.length > 30 ||
    !record.tags.every((tag) => typeof tag === "string" && tag.trim().length <= 50) ||
    !Array.isArray(record.imageUrls) ||
    record.imageUrls.length > 10 ||
    !record.imageUrls.every((url) => {
      if (typeof url !== "string" || url.length > 2048) return false;
      try {
        return new URL(url).protocol === "https:";
      } catch {
        return false;
      }
    }) ||
    (record.status !== "draft" && record.status !== "active")
  ) {
    return null;
  }

  return {
    name: record.name.trim(),
    description: record.description.trim(),
    category: record.category.trim(),
    price: record.price,
    compareAtPrice: record.compareAtPrice as number | null,
    inventory: record.inventory,
    sku: record.sku.trim(),
    tags: record.tags.map((tag: string) => tag.trim()).filter(Boolean),
    imageUrls: record.imageUrls as string[],
    status: record.status,
  };
}

function toDatabaseProduct(product: VendorProductInput) {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    price_minor_units: Math.round(product.price * 100),
    compare_at_price_minor_units:
      product.compareAtPrice === null ? null : Math.round(product.compareAtPrice * 100),
    currency: "NGN",
    inventory: product.inventory,
    sku: product.sku,
    tags: product.tags,
    image_url: product.imageUrls[0] ?? "",
    image_urls: product.imageUrls,
    status: product.status,
  };
}

async function getVendorAccount() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError &&
    userError.name !== "AuthSessionMissingError" &&
    userError.status !== 401
  ) {
    console.error("Could not verify vendor products session.", userError);
    return {
      response: NextResponse.json({ error: "Could not verify your session." }, { status: 500 }),
    };
  }
  if (!user) {
    return {
      response: NextResponse.json({ error: "Sign in to manage vendor products." }, { status: 401 }),
    };
  }

  return { supabase, user };
}

export async function GET() {
  const vendor = await getVendorAccount();
  if ("response" in vendor) return vendor.response;

  const { data: products, error } = await vendor.supabase
    .from("vendor_products")
    .select(PRODUCT_SELECT)
    .eq("vendor_user_id", vendor.user.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load vendor products.", error);
    return NextResponse.json({ error: "Could not load your products." }, { status: 500 });
  }
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const vendor = await getVendorAccount();
  if ("response" in vendor) return vendor.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const product = parseProduct(payload);
  if (!product) {
    return NextResponse.json({ error: "Product details are invalid." }, { status: 400 });
  }

  const { data, error } = await vendor.supabase
    .from("vendor_products")
    .insert({
      vendor_user_id: vendor.user.id,
      ...toDatabaseProduct(product),
    })
    .select(PRODUCT_SELECT)
    .single();

  if (error) {
    console.error("Could not create vendor product.", error);
    return NextResponse.json({ error: "Could not create this product." }, { status: 500 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const vendor = await getVendorAccount();
  if ("response" in vendor) return vendor.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Product details are invalid." }, { status: 400 });
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.id !== "string") {
    return NextResponse.json({ error: "A product ID is required." }, { status: 400 });
  }
  const product = parseProduct(record);
  if (!product) {
    return NextResponse.json({ error: "Product details are invalid." }, { status: 400 });
  }

  const { data, error } = await vendor.supabase
    .from("vendor_products")
    .update({ ...toDatabaseProduct(product), updated_at: new Date().toISOString() })
    .eq("id", record.id)
    .eq("vendor_user_id", vendor.user.id)
    .select(PRODUCT_SELECT)
    .maybeSingle();

  if (error) {
    console.error("Could not update vendor product.", error);
    return NextResponse.json({ error: "Could not update this product." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ product: data });
}
