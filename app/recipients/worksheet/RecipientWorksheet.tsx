"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import AccountAccess from "../../AccountAccess";

type Recipient = {
  name: string;
  number: string;
  email: string;
  workerType: string;
};

type RecipientGroup = {
  id: string;
  name: string;
  created_at: string;
  recipients: Array<{
    name: string;
    number: string;
    email: string;
    worker_type: string;
  }>;
};

const importKey = "brandels-recipient-import";

const emptyRecipient = (): Recipient => ({
  name: "",
  number: "",
  email: "",
  workerType: "",
});

function readRecipientList(value: string | null): Recipient[] {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved recipient data must be a list.");
  }
  return parsed.map((item: unknown) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("A recipient entry is invalid.");
    }
    const record = item as Record<string, unknown>;
    return {
      name: typeof record.name === "string" ? record.name : "",
      number: typeof record.number === "string" ? record.number : "",
      email: typeof record.email === "string" ? record.email : "",
      workerType:
        typeof record.workerType === "string" ? record.workerType : "",
    };
  });
}

export default function RecipientWorksheet() {
  const [recipients, setRecipients] = useState<Recipient[]>([emptyRecipient()]);
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRecipients() {
      try {
        const response = await fetch("/api/recipients");
        const result: {
          groups?: RecipientGroup[];
          error?: string;
        } = await response.json();
        if (response.status === 401) {
          if (active) {
            setGroups([]);
            setSelectedGroupId(null);
            setGroupName("");
            setRecipients([emptyRecipient()]);
            setSavedMessage("Sign in to load and save your recipient contacts.");
            setStorageReady(true);
          }
          return;
        }
        if (!response.ok) {
          throw new Error(result.error ?? "Could not load recipient contacts.");
        }
        if (!Array.isArray(result.groups)) {
          throw new Error("The recipient groups response has an invalid format.");
        }
        const imported = readRecipientList(window.localStorage.getItem(importKey));
        if (!active) return;
        setGroups(result.groups);
        setSelectedGroupId(null);
        setGroupName("");
        setRecipients(imported.length > 0 ? imported : [emptyRecipient()]);
        if (imported.length > 0) {
          setSavedMessage(
            `${imported.length} recipient rows imported. Review and save them.`,
          );
        } else {
          setSavedMessage("");
        }
      } catch (error) {
        console.error("Could not load recipient contacts.", error);
        if (active) {
          setSavedMessage(
            error instanceof Error ? error.message : "Could not load recipient contacts.",
          );
        }
      } finally {
        if (active) setStorageReady(true);
      }
    }

    void loadRecipients();
    window.addEventListener("brandels:auth-state-change", loadRecipients);

    return () => {
      active = false;
      window.removeEventListener("brandels:auth-state-change", loadRecipients);
    };
  }, []);

  function startNewGroup() {
    setSelectedGroupId(null);
    setGroupName("");
    setRecipients([emptyRecipient()]);
    setSavedMessage("");
  }

  function selectGroup(groupId: string) {
    const group = groups.find((candidate) => candidate.id === groupId);
    if (!group) {
      startNewGroup();
      return;
    }

    setSelectedGroupId(group.id);
    setGroupName(group.name);
    setRecipients(
      group.recipients.length > 0
        ? group.recipients.map((recipient) => ({
            name: recipient.name,
            number: recipient.number,
            email: recipient.email,
            workerType: recipient.worker_type,
          }))
        : [emptyRecipient()],
    );
    setSavedMessage("");
  }

  function updateRecipient(index: number, field: keyof Recipient, value: string) {
    setRecipients((current) =>
      current.map((recipient, rowIndex) =>
        rowIndex === index ? { ...recipient, [field]: value } : recipient,
      ),
    );
    setSavedMessage("");
  }

  async function saveRecipients() {
    const completeRecipients = recipients.filter((recipient) =>
      Object.values(recipient).some((value) => value.trim()),
    );
    if (!groupName.trim()) {
      setSavedMessage("Enter a name for this recipient group before saving.");
      return;
    }
    if (completeRecipients.length === 0) {
      setSavedMessage("Add at least one recipient before saving this group.");
      return;
    }

    try {
      const response = await fetch("/api/recipients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            groupId: selectedGroupId,
            groupName: groupName.trim(),
            recipients: completeRecipients.map((recipient) => ({
              name: recipient.name,
              number: recipient.number,
              email: recipient.email,
              worker_type: recipient.workerType,
            })),
          },
        ),
      });
      const result: {
        groupId?: string;
        groupName?: string;
        savedCount?: number;
        error?: string;
      } = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Could not save recipient contacts.");
      }
      if (!result.groupId || !result.groupName) {
        throw new Error("The saved recipient group response has an invalid format.");
      }
      window.localStorage.removeItem(importKey);
      const savedGroup: RecipientGroup = {
        id: result.groupId,
        name: result.groupName,
        created_at: new Date().toISOString(),
        recipients: completeRecipients.map((recipient) => ({
          name: recipient.name,
          number: recipient.number,
          email: recipient.email,
          worker_type: recipient.workerType,
        })),
      };
      setGroups((current) => {
        const existingIndex = current.findIndex(
          (group) => group.id === savedGroup.id,
        );
        if (existingIndex < 0) return [...current, savedGroup];
        return current.map((group) =>
          group.id === savedGroup.id ? savedGroup : group,
        );
      });
      setSelectedGroupId(savedGroup.id);
      setGroupName(savedGroup.name);
      setRecipients(completeRecipients);
      setSavedMessage(
        `“${savedGroup.name}” saved with ${result.savedCount ?? completeRecipients.length} recipient${result.savedCount === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      console.error("Could not save recipient contacts.", error);
      setSavedMessage(
        error instanceof Error ? error.message : "We couldn’t save your contacts. Please try again.",
      );
    }
  }

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#f7f9f7] px-4 py-8 text-[#17251e] sm:px-8 sm:py-12">
      <Image
        src="/IMAGES/vendor-onboarding-background.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none fixed inset-0 -z-10 object-cover opacity-25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-white/70"
      />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-9 flex items-center justify-between">
          <Link href="/recipients" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0e3b31] text-sm text-white">
              B
            </span>
            Brandels
          </Link>
          <div className="flex items-center gap-4">
            <AccountAccess />
            <Link
              href="/recipients"
              className="hidden text-sm font-medium text-[#68716b] hover:text-[#14785e] sm:inline"
            >
              Back
            </Link>
          </div>
        </header>

        <section aria-labelledby="worksheet-title">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#14785e]">
                Recipient contacts
              </p>
              <h1
                id="worksheet-title"
                className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
              >
                Contact worksheet
              </h1>
              <p className="mt-2 text-sm text-[#68716b]">
                Name each group so you can find and reuse it later.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!storageReady}
                onClick={startNewGroup}
                className="min-h-11 rounded-lg border border-[#d6e0d8] bg-white px-4 text-sm font-semibold text-[#173c2c] hover:bg-[#f1f6f2] disabled:opacity-50"
              >
                + New group
              </button>
              <button
                type="button"
                onClick={() => setRecipients((current) => [...current, emptyRecipient()])}
                className="min-h-11 rounded-lg border border-[#d6e0d8] bg-white px-4 text-sm font-semibold text-[#173c2c] hover:bg-[#f1f6f2]"
              >
                + Add row
              </button>
              <button
                type="button"
                disabled={!storageReady}
                onClick={() => void saveRecipients()}
                className="min-h-11 rounded-lg bg-[#0e3b31] px-5 text-sm font-semibold text-white hover:bg-[#145542] disabled:opacity-50"
              >
                {selectedGroupId ? "Save group changes" : "Save group"}
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 rounded-xl border border-[#dce4de] bg-white p-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="saved-recipient-group"
                className="mb-2 block text-sm font-semibold text-[#45554b]"
              >
                Open a saved group
              </label>
              <select
                id="saved-recipient-group"
                value={selectedGroupId ?? ""}
                onChange={(event) => selectGroup(event.target.value)}
                disabled={!storageReady || groups.length === 0}
                className="h-11 w-full rounded-lg border border-[#d6e0d8] bg-white px-3 text-sm disabled:opacity-60"
              >
                <option value="">New recipient group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="recipient-group-name"
                className="mb-2 block text-sm font-semibold text-[#45554b]"
              >
                Group name
              </label>
              <input
                id="recipient-group-name"
                type="text"
                maxLength={120}
                required
                value={groupName}
                onChange={(event) => {
                  setGroupName(event.target.value);
                  setSavedMessage("");
                }}
                placeholder="e.g. November client gifts"
                className="h-11 w-full rounded-lg border border-[#d6e0d8] px-3 text-sm outline-none focus:border-[#15936c] focus:ring-2 focus:ring-[#15936c]/20"
              />
            </div>
          </div>

          {savedMessage && (
            <p className="mb-4 text-sm font-medium text-[#14785e]" role="status">
              {savedMessage}
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-[#dce4de] bg-white shadow-sm">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#edf3ee] text-xs font-semibold uppercase tracking-[0.08em] text-[#45554b]">
                  <th scope="col" className="w-12 border-b border-r border-[#dce4de] px-3 py-3 text-center">#</th>
                  <th scope="col" className="border-b border-r border-[#dce4de] px-4 py-3">Name</th>
                  <th scope="col" className="border-b border-r border-[#dce4de] px-4 py-3">Number</th>
                  <th scope="col" className="border-b border-r border-[#dce4de] px-4 py-3">Email</th>
                  <th scope="col" className="border-b border-[#dce4de] px-4 py-3">Type of worker</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient, index) => (
                  <tr key={index}>
                    <td className="border-b border-r border-[#e7ece8] bg-[#f7f9f7] px-3 py-1 text-center text-xs text-[#87918a]">
                      {index + 1}
                    </td>
                    {(
                      [
                        ["name", "Name"],
                        ["number", "Number"],
                        ["email", "Email"],
                        ["workerType", "Type of worker"],
                      ] as const
                    ).map(([field, label]) => (
                      <td
                        key={field}
                        className="border-b border-r border-[#e7ece8] p-0 last:border-r-0"
                      >
                        <label className="sr-only" htmlFor={`recipient-${index}-${field}`}>
                          {label}, row {index + 1}
                        </label>
                        <input
                          id={`recipient-${index}-${field}`}
                          type={field === "email" ? "email" : "text"}
                          inputMode={field === "number" ? "tel" : undefined}
                          value={recipient[field]}
                          onChange={(event) =>
                            updateRecipient(index, field, event.target.value)
                          }
                          placeholder={label}
                          className="h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-[#b2bbb5] focus:bg-[#f3faf5] focus:ring-2 focus:ring-inset focus:ring-[#15936c]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-[#7b857e]">
            Saving a selected group replaces its saved contacts. Start a new group to keep a separate list.
          </p>
        </section>
      </div>
    </main>
  );
}
