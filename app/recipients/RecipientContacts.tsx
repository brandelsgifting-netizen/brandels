"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Recipient = {
  name: string;
  number: string;
  email: string;
  workerType: string;
};

const importKey = "brandels-recipient-import";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseRecipientCsv(text: string): Recipient[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) =>
    header.toLowerCase().replace(/[^a-z]/g, ""),
  );
  const findColumn = (aliases: string[]) =>
    headers.findIndex((header) => aliases.includes(header));
  const nameColumn = findColumn(["name", "fullname", "recipientname"]);
  const numberColumn = findColumn(["number", "phone", "phonenumber", "mobile"]);
  const emailColumn = findColumn(["email", "emailaddress"]);
  const workerTypeColumn = findColumn([
    "typeofworker",
    "workertype",
    "worker",
    "employeetype",
    "recipienttype",
    "type",
  ]);
  const hasHeader =
    nameColumn >= 0 ||
    numberColumn >= 0 ||
    emailColumn >= 0 ||
    workerTypeColumn >= 0;
  const columns = hasHeader
    ? [nameColumn, numberColumn, emailColumn, workerTypeColumn]
    : [0, 1, 2, 3];
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line) => {
    const cells = parseCsvLine(line);
    return {
      name: cells[columns[0]] ?? "",
      number: cells[columns[1]] ?? "",
      email: cells[columns[2]] ?? "",
      workerType: cells[columns[3]] ?? "",
    };
  });
}

export default function RecipientContacts() {
  const [savedMessage, setSavedMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleCsvUpload(file?: File) {
    if (!file) return;
    try {
      const imported = parseRecipientCsv(await file.text());
      if (imported.length === 0) {
        setSavedMessage("No recipient rows were found in that CSV.");
        return;
      }
      window.localStorage.setItem(importKey, JSON.stringify(imported));
      router.push("/recipients/worksheet");
    } catch (error) {
      console.error("Could not read the recipient CSV.", error);
      setSavedMessage("We couldn’t import that file. Please upload a valid CSV.");
    }
  }

  return (
    <main className="relative isolate min-h-svh bg-[#00885f] text-[#17251e]">
      <section className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden px-5 py-16">
        <Image
          src="/IMAGES/vendor-onboarding-background.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#00885f]/90" />
        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <Link
            href="/"
            className="mb-9 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
          >
            <span aria-hidden="true">←</span> Brandels home
          </Link>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[6.5rem]">
            Save recipient
            <br />
            contacts
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/95 sm:mt-8 sm:text-lg sm:leading-8">
            Keep your recipient details in one place. Upload a CSV or enter
            contacts in a simple worksheet, ready for your next gift.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-lg bg-white px-7 text-base font-semibold text-[#17251e] transition-colors hover:bg-[#eff8f4] sm:w-auto"
            >
              Upload Recipient CSV <span aria-hidden="true">↑</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Upload recipient CSV file"
              onChange={(event) => {
                void handleCsvUpload(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <Link
              href="/recipients/worksheet"
              className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-lg border-2 border-white px-7 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Enter recipient details <span aria-hidden="true">→</span>
            </Link>
          </div>
          {savedMessage && (
            <p className="mx-auto mt-5 max-w-xl text-sm font-medium text-white" role="status">
              {savedMessage}
            </p>
          )}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-20 bg-gradient-to-b from-transparent via-white/35 to-white sm:h-28"
        />
      </section>

    </main>
  );
}
