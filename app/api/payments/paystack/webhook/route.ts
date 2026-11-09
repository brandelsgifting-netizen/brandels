import { NextResponse, type NextRequest } from "next/server";
import {
  processSuccessfulPaystackPayment,
  verifyPaystackWebhookSignature,
} from "@/lib/paystack";

export async function POST(request: NextRequest) {
  const body = Buffer.from(await request.arrayBuffer());
  if (
    !verifyPaystackWebhookSignature(
      body,
      request.headers.get("paystack-signature"),
      request.headers.get("x-paystack-signature"),
    )
  ) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(body.toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (typeof event !== "object" || event === null || !("event" in event)) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }
  if (
    !("data" in event) ||
    typeof event.data !== "object" ||
    event.data === null ||
    !("reference" in event.data) ||
    typeof event.data.reference !== "string"
  ) {
    return NextResponse.json({ error: "Webhook transaction reference is missing." }, { status: 400 });
  }

  try {
    await processSuccessfulPaystackPayment(event.data.reference);
  } catch (error) {
    console.error("Could not process Paystack success webhook.", error);
    return NextResponse.json({ error: "Could not process payment event." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
