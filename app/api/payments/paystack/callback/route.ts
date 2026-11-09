import { NextResponse, type NextRequest } from "next/server";
import { processSuccessfulPaystackPayment } from "@/lib/paystack";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference || reference.length > 200) {
    return NextResponse.redirect(new URL("/products?payment=invalid", request.url));
  }

  try {
    const result = await processSuccessfulPaystackPayment(reference);
    const payment =
      result === "paid" || result === "already_paid"
        ? "success"
        : result === "payment_review"
          ? "review"
          : "failed";
    return NextResponse.redirect(new URL(`/products?payment=${payment}`, request.url));
  } catch (error) {
    console.error("Could not verify Paystack checkout callback.", error);
    return NextResponse.redirect(new URL("/products?payment=failed", request.url));
  }
}
