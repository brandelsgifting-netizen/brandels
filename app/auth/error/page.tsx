import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7f9f7] px-5 py-12 text-[#17251e]">
      <section className="w-full max-w-lg rounded-3xl border border-[#e3e9e4] bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#14785e]">
          Account sign-in
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
          We couldn’t complete sign-in
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#68716b]">
          The authentication link may be incomplete or expired, or the provider
          settings may need attention. Request a fresh link or try signing in again.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#0e3b31] px-6 text-sm font-semibold text-white hover:bg-[#145542]"
        >
          Return to Brandels
        </Link>
      </section>
    </main>
  );
}
