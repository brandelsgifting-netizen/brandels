import type { Metadata } from "next";
import Link from "next/link";
import AccountAccess from "../../AccountAccess";

export const metadata: Metadata = {
  title: "Start selling | Brandels",
  description: "Sign in to manage your Brandels product catalogue.",
};

export default function VendorRegistrationPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7f9f7] px-5 text-[#17251e]">
      <section className="w-full max-w-xl rounded-3xl border border-[#e3e9e4] bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#14785e]">
          Vendor catalogue
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          Start listing your products
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#68716b]">
          Sign in to manage your catalogue. There’s no application or approval
          step; your products are saved to your account.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/vendors/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#0e3b31] px-6 text-sm font-semibold text-white hover:bg-[#145542]"
          >
            Open vendor dashboard
          </Link>
          <AccountAccess />
        </div>
      </section>
    </main>
  );
}
