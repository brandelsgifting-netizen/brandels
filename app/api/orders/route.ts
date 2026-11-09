import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DESIGN_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isText(value: FormDataEntryValue | null, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

function validUpload(
  value: FormDataEntryValue | null,
  acceptedTypes: Set<string>,
): value is File | null {
  if (value === null) return true;
  return (
    value instanceof File &&
    value.size > 0 &&
    value.size <= MAX_FILE_SIZE &&
    acceptedTypes.has(value.type)
  );
}

function fileExtension(file: File): string {
  switch (file.type) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Unsupported order attachment type.");
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && userError.name !== "AuthSessionMissingError" && userError.status !== 401) {
    console.error("Could not verify order checkout session.", userError);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in before placing an order." }, { status: 401 });
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json(
      { error: "Paystack checkout is not configured on the server." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Checkout details are invalid." }, { status: 400 });
  }

  const productId = formData.get("productId");
  const quantityValue = formData.get("quantity");
  const brandedValue = formData.get("branded");
  const buyerName = formData.get("buyerName");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const address = formData.get("address");
  const city = formData.get("city");
  const region = formData.get("region");
  const postalCode = formData.get("postalCode");
  const country = formData.get("country");
  const design = formData.get("design");
  const logo = formData.get("logo");

  if (
    !isText(productId, 80) ||
    typeof quantityValue !== "string" ||
    !/^[1-9]\d{0,5}$/.test(quantityValue) ||
    (brandedValue !== "true" && brandedValue !== "false") ||
    !isText(buyerName, 160) ||
    !isText(email, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    !isText(phone, 40) ||
    !isText(address, 500) ||
    !isText(city, 120) ||
    !isText(region, 120) ||
    (typeof postalCode !== "string" || postalCode.length > 30) ||
    !isText(country, 120) ||
    !validUpload(design, DESIGN_TYPES) ||
    !validUpload(logo, IMAGE_TYPES)
  ) {
    return NextResponse.json(
      { error: "Complete the required checkout details and use supported files up to 10 MB." },
      { status: 400 },
    );
  }

  const quantity = Number(quantityValue);
  const branded = brandedValue === "true";
  if (branded && quantity < 50) {
    return NextResponse.json(
      { error: "Branded orders require a minimum of 50 items." },
      { status: 400 },
    );
  }

  const { data: product, error: productError } = await supabase
    .from("vendor_products")
    .select("id, name, vendor_user_id, price_minor_units, currency, inventory, status")
    .eq("id", productId)
    .eq("status", "active")
    .maybeSingle();

  if (productError) {
    console.error("Could not load product for checkout.", productError);
    return NextResponse.json({ error: "Could not load this product." }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: "This product is no longer available." }, { status: 404 });
  }
  if (quantity > product.inventory) {
    return NextResponse.json(
      { error: `Only ${product.inventory} items are currently available.` },
      { status: 409 },
    );
  }

  const totalMinorUnits = product.price_minor_units * quantity;
  if (!Number.isSafeInteger(totalMinorUnits) || totalMinorUnits <= 0) {
    return NextResponse.json({ error: "The order total is invalid." }, { status: 400 });
  }

  const reference = `brandels-${crypto.randomUUID()}`;
  const { data: order, error: orderError } = await supabase
    .from("vendor_orders")
    .insert({
      buyer_user_id: user.id,
      vendor_user_id: product.vendor_user_id,
      product_id: product.id,
      product_name: product.name,
      quantity,
      branded,
      unit_price_minor_units: product.price_minor_units,
      total_minor_units: totalMinorUnits,
      currency: product.currency,
      buyer_name: buyerName.trim(),
      buyer_email: email.trim().toLowerCase(),
      buyer_phone: phone.trim(),
      shipping_address: {
        address: address.trim(),
        city: city.trim(),
        region: region.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      },
      paystack_reference: reference,
      status: "pending_payment",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Could not create vendor order.", orderError);
    return NextResponse.json({ error: "Could not create this order." }, { status: 500 });
  }

  const uploadedPaths: { designPath?: string; logoPath?: string } = {};
  for (const [file, kind] of [
    [design, "design"],
    [logo, "logo"],
  ] as const) {
    if (!file) continue;
    const path = `${order.id}/${kind}-${crypto.randomUUID()}.${fileExtension(file)}`;
    const { error } = await supabase.storage
      .from("vendor-order-assets")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error(`Could not upload order ${kind} file.`, error);
      return NextResponse.json(
        { error: `Could not save your ${kind} file. The order was not sent for payment.` },
        { status: 500 },
      );
    }
    if (kind === "design") uploadedPaths.designPath = path;
    else uploadedPaths.logoPath = path;
  }

  if (uploadedPaths.designPath || uploadedPaths.logoPath) {
    const { error } = await supabase
      .from("vendor_orders")
      .update(uploadedPaths)
      .eq("id", order.id)
      .eq("buyer_user_id", user.id);
    if (error) {
      console.error("Could not attach order artwork to the order.", error);
      return NextResponse.json(
        { error: "Could not attach your files to the order. The order was not sent for payment." },
        { status: 500 },
      );
    }
  }

  let paystackResponse: Response;
  try {
    paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        amount: totalMinorUnits,
        currency: product.currency,
        reference,
        callback_url: new URL("/api/payments/paystack/callback", request.nextUrl.origin).toString(),
        metadata: { order_id: order.id, product_id: product.id },
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("Could not reach Paystack to initialize checkout.", error);
    return NextResponse.json(
      { error: "Could not reach Paystack. Please try again later." },
      { status: 502 },
    );
  }

  let payment: unknown;
  try {
    payment = await paystackResponse.json();
  } catch (error) {
    console.error("Could not read the Paystack initialization response.", error);
    return NextResponse.json({ error: "Paystack returned an invalid response." }, { status: 502 });
  }

  if (
    !paystackResponse.ok ||
    typeof payment !== "object" ||
    payment === null ||
    !("status" in payment) ||
    payment.status !== true ||
    !("data" in payment) ||
    typeof payment.data !== "object" ||
    payment.data === null ||
    !("authorization_url" in payment.data) ||
    typeof payment.data.authorization_url !== "string" ||
    !payment.data.authorization_url.startsWith("https://checkout.paystack.com/")
  ) {
    console.error("Paystack could not initialize checkout.", payment);
    return NextResponse.json({ error: "Paystack could not start checkout." }, { status: 502 });
  }

  return NextResponse.json({
    orderId: order.id,
    authorizationUrl: payment.data.authorization_url,
  });
}
