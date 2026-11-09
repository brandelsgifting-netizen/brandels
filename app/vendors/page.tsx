import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Vendor | Brandels",
  description:
    "Bring your products to more businesses with the Brandels corporate gifting marketplace.",
};

const steps = [
  {
    number: "01",
    title: "Sign in to your account",
    description:
      "Use your account to keep your vendor products and catalogue details together.",
  },
  {
    number: "02",
    title: "Add your products",
    description:
      "Add categories, product details, pricing, inventory, and cleaned product photos.",
  },
  {
    number: "03",
    title: "Publish to the catalogue",
    description:
      "Publish in-stock products for teams shopping for thoughtful gifts.",
  },
];

export default function VendorsPage() {
  return (
    <main className="min-h-svh bg-white text-[#17251e]">
      <section className="relative isolate flex h-svh min-h-svh w-full items-center justify-center overflow-hidden bg-[#00885f]">
        <Image
          src="/IMAGES/landscapeview3.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[#00885f]/90" />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 text-center sm:px-8">
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[6.5rem]">
            Grow your
            <br />
            business
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/95 sm:mt-8 sm:text-lg sm:leading-8">
            Bring your products to more businesses with Brandels. Join our vendor
            network and help teams find gifts their people will love.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/vendors/dashboard"
              className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-lg bg-white px-7 text-base font-semibold text-[#17251e] transition-colors hover:bg-[#eff8f4] sm:w-auto"
            >
              Start selling with Brandels
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/#workflows"
              className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-lg border-2 border-white px-7 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Talk to our team
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24 bg-gradient-to-b from-transparent via-white/35 to-white sm:h-32"
        />
      </section>

      <section id="how-it-works" className="scroll-mt-8 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#14785e]">
              Getting started
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              A clear path from product to present.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#68716b]">
              Sign in, build your catalogue, and publish products directly to the
              Brandels marketplace.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-[#e5ebe6] bg-[#fbfcfb] p-7"
              >
                <span className="text-sm font-bold tracking-widest text-[#15936c]">
                  {step.number}
                </span>
                <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#68716b]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#eaf5ee] p-7 sm:flex-row sm:items-center sm:p-9">
            <div>
              <h3 className="text-xl font-semibold">Ready to list your products?</h3>
              <p className="mt-2 text-sm leading-6 text-[#59675f]">
                Sign in to your account and start building your catalogue.
              </p>
            </div>
            <Link
              href="/vendors/dashboard"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#0e3b31] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#145542]"
            >
              Open vendor dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
