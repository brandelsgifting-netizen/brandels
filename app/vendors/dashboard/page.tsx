import type { Metadata } from "next";
import VendorDashboard from "./VendorDashboard";

export const metadata: Metadata = {
  title: "Vendor dashboard | Brandels",
  description: "Manage your Brandels vendor account.",
};

export default function VendorDashboardPage() {
  return <VendorDashboard />;
}
