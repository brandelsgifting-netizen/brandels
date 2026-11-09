import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RecipientInput = {
  name: string;
  number: string;
  email: string;
  worker_type: string;
};

type RecipientGroupInput = {
  groupId: string | null;
  groupName: string;
  recipients: RecipientInput[];
};

const fieldLimits: Record<keyof RecipientInput, number> = {
  name: 160,
  number: 40,
  email: 254,
  worker_type: 120,
};

const groupIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseRecipients(value: unknown): RecipientInput[] | null {
  if (!Array.isArray(value) || value.length > 1000) return null;
  const parsed: RecipientInput[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const record = item as Record<string, unknown>;
    const recipient = {
      name: record.name,
      number: record.number,
      email: record.email,
      worker_type: record.worker_type,
    };

    if (
      Object.entries(fieldLimits).some(
        ([field, maxLength]) =>
          typeof recipient[field as keyof RecipientInput] !== "string" ||
          (recipient[field as keyof RecipientInput] as string).length > maxLength,
      )
    ) {
      return null;
    }

    const normalized = Object.fromEntries(
      Object.entries(recipient).map(([field, text]) => [
        field,
        (text as string).trim(),
      ]),
    ) as RecipientInput;

    if (Object.values(normalized).some(Boolean)) parsed.push(normalized);
  }
  return parsed;
}

function parseRecipientGroup(value: unknown): RecipientGroupInput | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.groupName !== "string" ||
    record.groupName.trim().length === 0 ||
    record.groupName.trim().length > 120 ||
    (record.groupId !== null &&
      (typeof record.groupId !== "string" ||
        !groupIdPattern.test(record.groupId)))
  ) {
    return null;
  }

  const recipients = parseRecipients(record.recipients);
  if (!recipients || recipients.length === 0) return null;

  return {
    groupId: record.groupId as string | null,
    groupName: record.groupName.trim(),
    recipients,
  };
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { supabase, user, error };
}

export async function GET() {
  const { supabase, user, error: userError } = await getAuthenticatedClient();
  if (userError) {
    console.error("Could not verify recipient contacts session.", userError);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to access your recipient contacts." }, { status: 401 });
  }

  const [groupsResult, contactsResult] = await Promise.all([
    supabase
      .from("recipient_groups")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("recipient_contacts")
      .select("id, group_id, name, number, email, worker_type, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (groupsResult.error || contactsResult.error) {
    console.error(
      "Could not load recipient groups.",
      groupsResult.error ?? contactsResult.error,
    );
    return NextResponse.json({ error: "Could not load your recipient contacts." }, { status: 500 });
  }

  const contactsByGroup = new Map<string, typeof contactsResult.data>();
  for (const contact of contactsResult.data) {
    const groupContacts = contactsByGroup.get(contact.group_id) ?? [];
    groupContacts.push(contact);
    contactsByGroup.set(contact.group_id, groupContacts);
  }

  return NextResponse.json({
    groups: groupsResult.data.map((group) => ({
      ...group,
      recipients: contactsByGroup.get(group.id) ?? [],
    })),
  });
}

export async function PUT(request: NextRequest) {
  const { supabase, user, error: userError } = await getAuthenticatedClient();
  if (userError) {
    console.error("Could not verify recipient contacts session.", userError);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to save recipient contacts." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const group = parseRecipientGroup(payload);
  if (!group) {
    return NextResponse.json({ error: "Recipient group details are invalid or exceed the allowed size." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("save_recipient_group", {
    p_group_id: group.groupId,
    p_group_name: group.groupName,
    p_recipients: group.recipients,
  });
  if (error) {
    console.error("Could not save recipient group.", error);
    return NextResponse.json({ error: "Could not save recipient contacts." }, { status: 500 });
  }
  return NextResponse.json(data);
}
