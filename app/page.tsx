import type { CSSProperties } from "react";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import ScrollReveal from "./ScrollReveal";
import AccountAccess from "./AccountAccess";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Sky fade: the top of the photo melts into the white page
const fade: CSSProperties = {
  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 7.51%, rgba(0,0,0,0.25) 15.03%, rgba(0,0,0,0.5) 22.54%, rgba(0,0,0,0.8) 30.05%, #000 37.57%)",
  maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 7.51%, rgba(0,0,0,0.25) 15.03%, rgba(0,0,0,0.5) 22.54%, rgba(0,0,0,0.8) 30.05%, #000 37.57%)",
};

const links = [
  { label: "About us", href: "#features" },
  { label: "Products", href: "#collections" },
  { label: "Vendors", href: "/vendors" },
  { label: "Shop eGifts", href: "#collections" },
  { label: "Save recipient contacts", href: "/recipients" },
];

const fields = [
  { label: "Occasion", value: "Birthday | Anniversary | Holiday | Onboarding" },
  { label: "Budget", value: "Enter an amount per person" },
];

const features = [
  {
    icon: "gift",
    title: "Thousands of gifts, one vendor of record",
    description:
      "Shop our business gift marketplace. We handle all sourcing, vetting, and compliance for you.",
    tone: "bg-[#fce8ef] text-[#a33c60]",
  },
  {
    icon: "boxes",
    title: "Send to hundreds of recipients at once",
    description:
      "Our multi-recipient checkout makes it easy to send gifts in bulk.",
    tone: "bg-[#eff9c5] text-[#526b14]",
  },
  {
    icon: "inventory",
    title: "Full-scale inventory management",
    description:
      "Buy and store your goods with us, then manage them online in your virtual swag closet.",
    tone: "bg-[#ffead8] text-[#a95f24]",
  },
  {
    icon: "automation",
    title: "Easily automate employee gifting",
    description:
      "Set up gift workflows, milestones, and triggers once, then let gifts go out automatically.",
    tone: "bg-[#dff8e5] text-[#287440]",
  },
  {
    icon: "team",
    title: "Enterprise gifting platforms for teams",
    description:
      "Manage users, budgets, and permissions to enable gifting across your entire organization.",
    tone: "bg-[#eee5ff] text-[#6744a0]",
  },
  {
    icon: "store",
    title: "Sell merch on your company store",
    description:
      "Sell company swag online and manage it all through your virtual swag closet.",
    tone: "bg-[#f9e3f5] text-[#91447f]",
  },
] as const;

const collections = [
  {
    title: "Onboarding gifts",
    image: "/IMAGES/Gift_voucher_templates___Premium_Vector-removebg-preview.png",
    alt: "Red corporate gift voucher designs",
    size: "lg:row-span-2",
  },
  {
    title: "Desk and office essentials",
    image: "/IMAGES/DESKTOPANDOFFICE.png",
    alt: "Branded notebooks and pens",
    size: "",
  },
  {
    title: "Gift hampers",
    image: "/IMAGES/HAMPER.png",
    alt: "Assorted gift hamper",
    size: "",
  },
  {
    title: "Everyday backpacks",
    image: "/IMAGES/bagpack1.png",
    alt: "Black backpack",
    size: "",
  },
  {
    title: "Power banks",
    image: "/IMAGES/powerbank1.png",
    alt: "Black portable power bank",
    size: "",
  },
  {
    title: "Drinkware",
    image: "/IMAGES/waterbottle.png",
    alt: "Green branded water bottle",
    size: "",
  },
  {
    title: "Work backpacks",
    image: "/IMAGES/bagpack2.png",
    alt: "Blue work backpack",
    size: "",
  },
  {
    title: "Corporate gifting",
    image: "/IMAGES/brandels.jpeg",
    alt: "Colleagues exchanging a corporate gift",
    size: "lg:col-span-2",
  },
] as const;

type FeatureIconName = (typeof features)[number]["icon"];

function FeatureIcon({ name }: { name: FeatureIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      {name === "gift" && (
        <>
          <path d="M3 10h18v4H3zM5 14v7h14v-7M12 10v11" />
          <path d="M12 10H7.5a2.5 2.5 0 1 1 2.5-2.5V10Zm0 0h4.5a2.5 2.5 0 1 0-2.5-2.5V10Z" />
        </>
      )}
      {name === "boxes" && (
        <>
          <path d="m12 2 8 4-8 4-8-4 8-4Z" />
          <path d="M4 6v8l8 4 8-4V6M12 10v8" />
          <path d="m4 14-2 1v6l6 3 4-2m0-5v7m8-10 2 1v6l-6 3-4-2" />
        </>
      )}
      {name === "inventory" && (
        <>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M9 5V3h6v2m-3 5v4l2.5 1.5" />
          <path d="m15 18 2 2 4-4" />
        </>
      )}
      {name === "automation" && (
        <>
          <path d="M20 7V3m0 0h-4m4 0-4 4a8 8 0 0 0-13 5" />
          <path d="M4 17v4m0 0h4m-4 0 4-4a8 8 0 0 0 13-5" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
      {name === "team" && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1H3Zm12-12a3 3 0 1 1 0 6m2 2a5 5 0 0 1 4 5h-3" />
        </>
      )}
      {name === "store" && (
        <>
          <path d="M3 10h18l-2-6H5l-2 6Zm2 0v10h14V10" />
          <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-5h6v5" />
        </>
      )}
    </svg>
  );
}

function Features() {
  return (
    <section
      id="features"
      className="bg-[#fafbf9] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#14785e]">
              Gifting, made easier
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#202522] sm:text-5xl lg:text-6xl">
              Designed for frequent gifters
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#606963] sm:text-lg sm:leading-8">
              Our gifting platform makes recurring gifting as simple as
              clicking a button. We take care of planning, sourcing,
              customizing, budgeting, storage, and logistics so you can focus on
              appreciation.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 90}>
              <article
                className="h-full rounded-2xl border border-[#e9ede9] bg-white p-7 transition-shadow hover:shadow-[0_12px_36px_rgba(25,55,40,0.07)] sm:p-8"
              >
                <div
                  className={`mb-7 grid h-12 w-12 place-items-center rounded-2xl ${feature.tone}`}
                >
                  <FeatureIcon name={feature.icon} />
                </div>
                <h3 className="max-w-xs text-xl font-semibold leading-snug tracking-[-0.025em] text-[#242925] sm:text-2xl">
                  {feature.title}
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-[#68716b]">
                  {feature.description}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Collections() {
  return (
    <section
      id="collections"
      className="bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#202522] sm:text-4xl lg:text-5xl">
              Shop our most popular collections
            </h2>
            <a
              href="/products"
              className="group inline-flex w-fit shrink-0 items-center gap-3 text-sm font-semibold text-[#14785e] hover:text-[#0e5e49] sm:text-base"
            >
              Go to products page
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 animate-[arrow-nudge_1s_ease-in-out_infinite] transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </a>
          </div>
        </ScrollReveal>

        <div className="mt-9 grid auto-rows-[220px] grid-cols-2 gap-4 sm:gap-5 lg:auto-rows-[230px] lg:grid-cols-4 lg:gap-6">
          {collections.map((collection, index) => (
            <ScrollReveal
              key={collection.title}
              delay={(index % 4) * 70}
              className={collection.size}
            >
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#edf0ed] bg-white p-3 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(27,52,39,0.14)] sm:p-4">
                <div className="group/image relative min-h-0 flex-1">
                  <Image
                    src={collection.image}
                    alt={collection.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover/image:opacity-100"
                  />
                </div>
                <h3 className="px-2 pb-2 pt-3 text-sm font-semibold text-[#29332d] sm:text-base">
                  {collection.title}
                </h3>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const workflows = [
  {
    title: "Send to hundreds of recipients at once",
    description:
      "Add your recipients in one go and make bulk gifting simple, whether you are celebrating a team or thanking your clients.",
  },
  {
    title: "Seamless system integrations",
    description:
      "Bring your existing tools into your gifting workflow to keep recipient details, budgets, and delivery organized.",
  },
  {
    title: "Preschedule milestone gifts",
    description:
      "Plan birthdays, work anniversaries, and other special moments ahead of time so every gift arrives when it matters.",
  },
] as const;

function ImportIcon({ kind }: { kind: "upload" | "contacts" | "edit" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {kind === "upload" && (
        <>
          <path d="M12 16V4m0 0L8 8m4-4 4 4" />
          <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
        </>
      )}
      {kind === "contacts" && (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="10" cy="9" r="2" />
          <path d="M7 16a3 3 0 0 1 6 0m2-6h2m-2 4h2" />
        </>
      )}
      {kind === "edit" && (
        <>
          <path d="m4 16.5-.8 4.3 4.3-.8L19.7 7.8a2.1 2.1 0 0 0-3-3L4 16.5Z" />
          <path d="m14.8 6.7 3 3" />
        </>
      )}
    </svg>
  );
}

function WorkflowImportPreview() {
  const methods = [
    {
      icon: "upload",
      label: "Upload a .csv file, or copy/paste from a spreadsheet or table",
      action: "Import from file",
      tone: "bg-[#fff7d9] text-[#7b6514]",
    },
    {
      icon: "contacts",
      label: "Add from saved recipient groups or individual contacts",
      action: "Select from contacts",
      tone: "bg-[#e6f8f5] text-[#247467]",
    },
    {
      icon: "edit",
      label: "Enter names and addresses directly into the checkout form",
      action: "Enter manually",
      tone: "bg-[#eeeafd] text-[#66539a]",
    },
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#eeedf5] bg-white shadow-[0_24px_70px_rgba(74,67,133,0.12)]">
      <div className="flex h-10 items-center gap-2 border-b border-[#eeedf5] bg-[#fbfaff] px-4">
        <span className="h-2.5 w-2.5 rounded-full border border-[#d9d7e5]" />
        <span className="h-2.5 w-2.5 rounded-full border border-[#d9d7e5]" />
        <span className="h-2.5 w-2.5 rounded-full border border-[#d9d7e5]" />
      </div>
      <div className="p-5 sm:p-7 lg:p-8">
        <h3 className="text-center text-xl font-medium leading-snug tracking-[-0.03em] text-[#27262b] sm:text-2xl">
          How would you like to import your recipients?
        </h3>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {methods.map((method) => (
            <div
              key={method.action}
              className="flex min-h-[190px] flex-col items-center rounded-xl border border-[#eeedf1] bg-white px-3 py-5 text-center shadow-[0_2px_8px_rgba(34,30,50,0.04)] sm:min-h-[210px] sm:px-2"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-full ${method.tone}`}>
                <ImportIcon kind={method.icon} />
              </span>
              <p className="mt-4 flex-1 text-xs leading-5 text-[#4c4a50] sm:text-[13px]">
                {method.label}
              </p>
              <span className="mt-4 rounded-full border border-[#424047] px-3 py-1.5 text-[11px] font-semibold text-[#302f34] sm:px-4 sm:text-xs">
                {method.action}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Workflows() {
  return (
    <section
      id="workflows"
      className="overflow-hidden bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-0 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <ScrollReveal>
          <div className="relative lg:-ml-12">
            <div
              aria-hidden="true"
              className="absolute -inset-8 -z-10 rounded-[40px] bg-[#f7f6ff] blur-2xl"
            />
            <WorkflowImportPreview />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div>
            <h2 className="max-w-lg text-4xl font-extrabold leading-[1.08] tracking-[-0.05em] text-[#202020] sm:text-5xl lg:text-6xl">
              Streamline workflows
            </h2>
            <div className="mt-7 border-t border-[#d8d6d3]">
              {workflows.map((workflow) => (
                <details
                  key={workflow.title}
                  className="group border-b border-[#d8d6d3]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-base font-semibold text-[#202020] marker:hidden sm:py-7 sm:text-lg [&::-webkit-details-marker]:hidden">
                    {workflow.title}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="h-6 w-6 shrink-0 transition-transform duration-200 group-open:rotate-45"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="max-w-xl pb-6 pr-10 text-sm leading-6 text-[#656565] sm:text-base">
                    {workflow.description}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

const reviews = [
  {
    quote:
      "Flexible, affordable, high quality products, responsive, superior customer service. They are the BEST.",
    name: "Kim",
    role: "SVP Global Client Services",
    company: "IntouchCX",
    initials: "K",
  },
  {
    quote:
      "CorporateGift was a no-brainer for us. The functionality of the platform was much better, as was the breadth and quality of gifts in the native marketplace.",
    name: "Jennifer",
    role: "Director of Strategic Programs",
    company: "SAP",
    initials: "J",
  },
] as const;

function Reviews() {
  return (
    <section
      id="reviews"
      className="bg-[#e8f7ed] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-4xl font-medium tracking-[-0.045em] text-[#202522] sm:text-5xl lg:text-6xl">
            Our <strong className="font-extrabold">Reviews</strong>
          </h2>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {reviews.map((review, index) => (
            <ScrollReveal key={review.name} delay={index * 100}>
              <article className="h-full rounded-[28px] bg-white p-7 shadow-sm sm:p-9 lg:p-10">
                <div
                  aria-label="5 out of 5 stars"
                  className="flex items-center gap-1 text-2xl leading-none text-[#13875f]"
                >
                  <span className="mr-2 grid h-9 w-9 place-items-center rounded-full bg-[#13875f] text-sm font-bold text-white">
                    B
                  </span>
                  <span aria-hidden="true">★★★★★</span>
                </div>
                <blockquote className="mt-8 min-h-20 text-base leading-7 text-[#303330] sm:text-lg sm:leading-8">
                  “{review.quote}”
                </blockquote>
                <div className="mt-8 flex items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#b8ecd0] text-lg font-bold text-[#116344]">
                    {review.initials}
                  </span>
                  <div>
                    <p className="text-sm text-[#303330] sm:text-base">
                      <strong className="font-bold">{review.name}</strong>, {review.role}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#13875f]">
                      {review.company}
                    </p>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const articles = [
  "The Best Holiday Gifts for Employees in 2026",
  "What's Trending in Corporate Gifting for 2026",
  "2026 Client Gift Ideas: Elevated Gifts for Every Budget",
] as const;

function Updates() {
  return (
    <section
      id="updates"
      className="bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-4xl font-medium tracking-[-0.045em] text-[#202522] sm:text-5xl lg:text-6xl">
            Updates and <strong className="font-extrabold">inspiration</strong>
          </h2>
        </ScrollReveal>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {articles.map((title, index) => (
            <ScrollReveal key={title} delay={index * 100}>
              <article className="group">
                <div
                  role="img"
                  aria-label={`Image placeholder for: ${title}`}
                  className="grid aspect-[1.55] place-items-center overflow-hidden rounded-2xl border border-dashed border-[#cbd5ce] bg-[#f5f8f5] transition-colors group-hover:bg-[#eef5ef]"
                >
                  <div className="text-center text-[#738078]">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto h-9 w-9"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    <span className="mt-2 block text-sm">Image placeholder</span>
                  </div>
                </div>
                <h3 className="mt-5 text-xl font-semibold leading-snug tracking-[-0.025em] text-[#262a27] transition-colors group-hover:text-[#14785e] sm:text-2xl">
                  {title}
                </h3>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const footerGroups = [
  {
    title: "Company",
    links: [
      { label: "About Brandels", href: "#features" },
      { label: "Updates and inspiration", href: "#updates" },
    ],
  },
  {
    title: "Pricing",
    links: [{ label: "Talk to sales", href: "#workflows" }],
  },
  {
    title: "Offerings",
    links: [
      { label: "Gift collections", href: "#collections" },
      { label: "Bulk gifting", href: "#workflows" },
      { label: "Gift automation", href: "#features" },
      { label: "Team gifting", href: "#features" },
      { label: "Corporate gifting", href: "#reviews" },
    ],
  },
  {
    title: "Popular links",
    links: [
      { label: "Holiday gift ideas", href: "#updates" },
      { label: "Client gift ideas", href: "#updates" },
      { label: "Onboarding gifts", href: "#collections" },
      { label: "Browse all collections", href: "#collections" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQs", href: "#workflows" },
      { label: "Contact sales", href: "#workflows" },
      { label: "Become a seller", href: "#collections" },
    ],
  },
] as const;

function Footer() {
  return (
    <footer id="footer" className="bg-[#f8f9f8] px-5 pb-6 pt-14 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-10">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#292e2b]">
                {group.title}
              </h2>
              <ul className="mt-5 space-y-3.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm leading-6 text-[#707772] transition-colors hover:text-[#14785e]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#e4e8e5] pt-5 text-sm text-[#707772] sm:flex-row sm:items-center sm:justify-between">
          <a href="#" className="flex w-fit items-center gap-2 font-bold text-[#202522]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0e3b31] text-xs text-white">
              B
            </span>
            Brandels
          </a>
          <p>© 2026 Brandels. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function Hero() {
  return (
    <section className="relative h-[max(100svh,calc(0.34*min(100vw,1280px)_+_32vw))] w-full overflow-hidden bg-white max-[700px]:flex max-[700px]:h-auto max-[700px]:min-h-svh max-[700px]:flex-col">
      {/* Text area: centred box, text sizes scale with its width */}
      <div className="relative z-10 mx-auto w-full max-w-[1280px] [container-type:inline-size] max-[700px]:[container-type:normal]">
        {/* Light, minimal navigation */}
        <nav
          className="relative z-10 mx-auto flex w-full items-center justify-between gap-[2cqw] border-b border-[#eeeeee] bg-white/90 px-[4cqw] py-[1.2cqw] text-[#171717]
                     max-[700px]:gap-3 max-[700px]:px-4 max-[700px]:py-3"
        >
          <div className="flex shrink-0 items-center gap-[0.8cqw] text-[1.55cqw] font-bold max-[700px]:gap-2 max-[700px]:text-[17px]">
            <span className="grid h-[2.4cqw] w-[2.4cqw] place-items-center rounded-full bg-[#0e3b31] text-[1.2cqw] font-bold text-white max-[700px]:h-[26px] max-[700px]:w-[26px] max-[700px]:text-[13px]">
              B
            </span>
            Brandels
          </div>

          <div className="mx-auto flex gap-[2cqw] text-[1.1cqw] font-medium text-[#252525] max-[700px]:hidden">
            {links.map((link) => (
              <a key={link.label} href={link.href} className="whitespace-nowrap hover:text-[#b66b2b]">
                {link.label}
              </a>
            ))}
          </div>

          <AccountAccess />
        </nav>

        {/* Headline */}
        <div className="relative z-10 mx-auto max-w-[72cqw] px-[2cqw] pt-[3cqw] text-center max-[700px]:max-w-none max-[700px]:px-5 max-[700px]:pt-9">
          <h1 className="text-[4.3cqw] font-extrabold leading-[1.08] tracking-[-0.025em] text-[#0b1f1a] max-[700px]:text-[30px]">
            Send Corporate eGifts &amp; <span className="text-[#1DCF9F]">Let Them Choose</span>
          </h1>
          <p className="mx-auto mt-[1.4cqw] max-w-[54cqw] text-[1.4cqw] leading-[1.55] text-[#4b5b56] max-[700px]:mt-3.5 max-[700px]:max-w-none max-[700px]:text-sm">
            Create a gift collection, send it in seconds, and let your staff and clients pick what they love.
            One simple platform, built for Nigerian businesses.
          </p>
        </div>

        {/* Search pill */}
        <div
          className="relative z-10 mx-auto mt-[2.2cqw] flex w-[62cqw] items-center rounded-full bg-white py-[0.9cqw] pl-[2.6cqw] pr-[1cqw] shadow-[0_0.6cqw_2.6cqw_rgba(0,0,0,0.1)]
                     max-[700px]:mt-[22px] max-[700px]:w-[calc(100%-32px)] max-[700px]:py-2 max-[700px]:pl-[18px] max-[700px]:pr-2"
        >
          {fields.map((f, i) => (
            <div
              key={f.label}
              className={`min-w-0 flex-1 ${i > 0 ? "ml-[2.2cqw] border-l border-[#d9e3df] pl-[2.2cqw] max-[700px]:ml-3 max-[700px]:pl-3" : ""}`}
            >
              <small className="mb-[0.3cqw] block text-[1.1cqw] text-[#4b5b56] max-[700px]:text-[11px]">{f.label}</small>
              <span className="block truncate text-[1.1cqw] font-medium text-[#0b1f1a] max-[700px]:text-[11px]">{f.value}</span>
            </div>
          ))}
          <button
            aria-label="Find eGifts"
            className="ml-[1.4cqw] grid h-[4.4cqw] w-[4.4cqw] shrink-0 place-items-center rounded-full bg-[#1DCF9F] text-[#06382b] max-[700px]:ml-2.5 max-[700px]:h-[42px] max-[700px]:w-[42px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-[42%] w-[42%]">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </div>

      </div>

      {/* Photo: full width of the screen, pinned to the bottom */}
      <Image
        src="/IMAGES/bradels2.jpg"
        alt="Two colleagues sharing a gift box"
        width={1581}
        height={826}
        priority
        sizes="100vw"
        style={fade}
        className="absolute bottom-0 left-0 h-auto w-full max-[700px]:relative max-[700px]:mt-auto max-[700px]:h-[340px] max-[700px]:object-cover max-[700px]:object-[60%_bottom]"
      />
    </section>
  );
}

export default function Home() {
  return (
    <main className={`${jakarta.className} min-h-svh bg-white antialiased`}>
      <Hero />
      <Features />
      <Collections />
      <Workflows />
      <Reviews />
      <Updates />
      <Footer />
    </main>
  );
}