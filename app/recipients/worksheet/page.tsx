import type { Metadata } from "next";
import RecipientWorksheet from "./RecipientWorksheet";

export const metadata: Metadata = {
  title: "Recipient worksheet | Brandels",
  description: "Manage your saved recipient contacts.",
};

export default function RecipientWorksheetPage() {
  return <RecipientWorksheet />;
}
