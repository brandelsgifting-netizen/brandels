import type { Metadata } from "next";
import UpdatePassword from "./UpdatePassword";

export const metadata: Metadata = {
  title: "Update password | Brandels",
  description: "Choose a new password for your Brandels account.",
};

export default function UpdatePasswordPage() {
  return <UpdatePassword />;
}
