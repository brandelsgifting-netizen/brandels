import type { Metadata } from "next";
import RecipientContacts from "./RecipientContacts";

export const metadata: Metadata = {
  title: "Recipient contacts | Brandels",
  description: "Save and organize your gift recipients with Brandels.",
};

export default function RecipientsPage() {
  return <RecipientContacts />;
}
