import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
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
    console.error("Could not verify product image upload session.", userError);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload product images." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI image cleanup is not configured. Add OPENAI_API_KEY to the server environment." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload must be a valid multipart form." }, { status: 400 });
  }
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Upload a JPG, PNG, or WebP image." },
      { status: 415 },
    );
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const imageDataUrl = `data:${file.type};base64,${inputBuffer.toString("base64")}`;
  let openAiResponse: Response;
  try {
    openAiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2.5-sunburst",
        images: [{ image_url: imageDataUrl }],
        prompt:
          "Prepare this exact item for a premium ecommerce product listing. Preserve the real product's shape, color, materials, details, labels, and logos without adding or removing product features. Remove the original background and distracting objects, place the product centered on a clean soft-white studio background with a subtle natural shadow, and use even professional lighting. Do not add text, props, packaging, or a watermark.",
        output_format: "png",
        size: "1024x1024",
        n: 1,
        moderation: "auto",
      }),
    });
  } catch (error) {
    console.error("Could not reach OpenAI for product image cleanup.", error);
    return NextResponse.json(
      { error: "Could not reach the image cleanup service. Try again later." },
      { status: 502 },
    );
  }

  if (!openAiResponse.ok) {
    const errorDetail = await openAiResponse.text();
    console.error("OpenAI product image cleanup failed.", {
      status: openAiResponse.status,
      detail: errorDetail.slice(0, 1000),
    });
    return NextResponse.json(
      { error: "AI image cleanup failed. Try another image or try again later." },
      { status: 502 },
    );
  }

  let result: unknown;
  try {
    result = await openAiResponse.json();
  } catch (error) {
    console.error("Could not read OpenAI product image cleanup response.", error);
    return NextResponse.json(
      { error: "Could not read the cleaned image response." },
      { status: 502 },
    );
  }
  if (typeof result !== "object" || result === null || !("data" in result)) {
    console.error("OpenAI returned an invalid product image cleanup response.");
    return NextResponse.json({ error: "AI returned an invalid image response." }, { status: 502 });
  }
  const imageResult = result.data;
  if (
    !Array.isArray(imageResult) ||
    typeof imageResult[0] !== "object" ||
    imageResult[0] === null ||
    !("b64_json" in imageResult[0]) ||
    typeof imageResult[0].b64_json !== "string"
  ) {
    console.error("OpenAI product image cleanup response did not contain an image.");
    return NextResponse.json({ error: "AI did not return a cleaned image." }, { status: 502 });
  }

  const cleanedImage = Buffer.from(imageResult[0].b64_json, "base64");
  if (cleanedImage.length === 0 || cleanedImage.length > 20 * 1024 * 1024) {
    console.error("OpenAI returned an invalid product image size.");
    return NextResponse.json({ error: "AI returned an invalid image size." }, { status: 502 });
  }

  const objectPath = `${user.id}/${crypto.randomUUID()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("vendor-product-images")
    .upload(objectPath, cleanedImage, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error("Could not store cleaned vendor product image.", uploadError);
    return NextResponse.json({ error: "Could not save the cleaned image." }, { status: 500 });
  }

  const { data } = supabase.storage.from("vendor-product-images").getPublicUrl(objectPath);
  return NextResponse.json({ imageUrl: data.publicUrl });
}
