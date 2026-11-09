import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

type PaystackVerification = {
  status: boolean;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    id?: number | string;
  };
};

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerification> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack server credentials are not configured.");

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  const result: unknown = await response.json();
  if (
    !response.ok ||
    typeof result !== "object" ||
    result === null ||
    !("status" in result) ||
    typeof result.status !== "boolean"
  ) {
    throw new Error("Paystack could not verify the transaction.");
  }
  return result as PaystackVerification;
}

export async function markVendorOrderPaid(
  reference: string,
  transactionId: number | string,
  amount: number,
  currency: string,
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("complete_vendor_order", {
    p_reference: reference,
    p_transaction_id: String(transactionId),
    p_amount: amount,
    p_currency: currency,
  });
  if (error) {
    console.error("Could not complete the paid vendor order.", error);
    throw new Error("Could not update the order after payment verification.");
  }
  if (typeof data !== "string") {
    throw new Error("The order completion response was invalid.");
  }
  return data;
}

function matchesHmac(body: Buffer, signature: string, key: string, prefix = "") {
  const expected = createHmac("sha512", key).update(prefix).update(body).digest();
  if (!/^[0-9a-f]{128}$/i.test(signature)) return false;
  const actual = Buffer.from(signature, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyPaystackWebhookSignature(
  body: Buffer,
  signature: string | null,
  legacySignature: string | null,
): boolean {
  if (signature) {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!secret) return false;

    let timestamp: number | null = null;
    const candidates: string[] = [];
    for (const part of signature.split(",")) {
      const separator = part.indexOf("=");
      if (separator < 0) continue;
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (key === "t" && /^\d+$/.test(value)) timestamp = Number(value);
      if (key === "v1") {
        const colon = value.indexOf(":");
        candidates.push(colon < 0 ? value : value.slice(colon + 1));
      }
    }

    const now = Math.floor(Date.now() / 1000);
    if (timestamp === null || Math.abs(now - timestamp) > 300) return false;
    return candidates.some((candidate) =>
      matchesHmac(body, candidate, secret, `${timestamp}.`),
    );
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(
    legacySignature &&
      secret &&
      matchesHmac(body, legacySignature, secret),
  );
}

export async function processSuccessfulPaystackPayment(
  reference: string,
): Promise<string> {
  const verified = await verifyPaystackTransaction(reference);
  const transaction = verified.data;
  if (
    verified.status !== true ||
    transaction?.status !== "success" ||
    transaction.reference !== reference ||
    typeof transaction.amount !== "number" ||
    typeof transaction.currency !== "string" ||
    (typeof transaction.id !== "number" && typeof transaction.id !== "string")
  ) {
    throw new Error("Paystack did not confirm a successful matching payment.");
  }
  return markVendorOrderPaid(
    reference,
    transaction.id,
    transaction.amount,
    transaction.currency,
  );
}
