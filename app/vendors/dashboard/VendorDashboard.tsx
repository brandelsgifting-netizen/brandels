"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import AccountAccess from "../../AccountAccess";

type VendorAccount = {
  businessName: string;
  email: string;
};

type DashboardSection = "Overview" | "Products" | "Orders" | "Payouts" | "Store settings";
type VendorProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  price_minor_units: number;
  compare_at_price_minor_units: number | null;
  currency: string;
  inventory: number;
  sku: string;
  tags: string[];
  image_url: string;
  image_urls: string[];
  status: "draft" | "pending_review" | "active" | "rejected" | "archived";
};

const sections: DashboardSection[] = [
  "Overview",
  "Products",
  "Orders",
  "Payouts",
  "Store settings",
];

function SectionIcon({ section }: { section: DashboardSection }) {
  const iconPath: Record<DashboardSection, string> = {
    Overview: "M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z",
    Products: "M4 5h16v15H4zM8 5V3h8v2M8 10h8M8 14h5",
    Orders: "M4 4h16v16H4zM8 9h8M8 13h8M8 17h5",
    Payouts: "M3 6h18v13H3zM3 10h18M7 15h4",
    "Store settings": "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 12l-2-1 2-4 2 1 2-2-1-2 4-2 1 2h3l1-2 4 2-1 2 2 2 2-1 2 4-2 1v3l2 1-2 4-2-1-2 2 1 2-4 2-1-2h-3l-1 2-4-2 1-2-2-2-2 1-2-4 2-1z",
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d={iconPath[section]} />
    </svg>
  );
}

export default function VendorDashboard() {
  const [activeSection, setActiveSection] = useState<DashboardSection>("Overview");
  const [account, setAccount] = useState<VendorAccount | null>(null);
  const [accountState, setAccountState] = useState<"loading" | "ready" | "signed-out" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAccount() {
      try {
        const response = await fetch("/api/vendor/account");
        const result: { account?: VendorAccount; error?: string } = await response.json();
        if (response.status === 401) {
          if (active) {
            setAccount(null);
            setLoadError("Sign in to manage your vendor products.");
            setAccountState("signed-out");
          }
          return;
        }
        if (!response.ok) {
          throw new Error(result.error ?? "Could not load your account.");
        }
        if (
          !result.account ||
          typeof result.account.businessName !== "string" ||
          typeof result.account.email !== "string"
        ) {
          throw new Error("The account response has an invalid format.");
        }
        if (active) {
          setAccount(result.account);
          setAccountState("ready");
          setLoadError("");
        }
      } catch (error) {
        console.error("Could not load vendor account.", error);
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load your account.");
          setAccountState("error");
        }
      }
    }

    void loadAccount();
    window.addEventListener("brandels:auth-state-change", loadAccount);
    return () => {
      active = false;
      window.removeEventListener("brandels:auth-state-change", loadAccount);
    };
  }, []);

  const businessName = account?.businessName || "Your business";

  return (
    <main className="flex min-h-svh bg-[#f7f9f7] text-[#17251e]">
      <aside className="hidden w-64 shrink-0 border-r border-[#e3e9e4] bg-white lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-2 border-b border-[#edf0ed] px-6 py-5 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0e3b31] text-sm text-white">
            B
          </span>
          Brandels
        </Link>
        <div className="px-4 py-5">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#909a92]">
            Vendor portal
          </p>
          <nav aria-label="Vendor dashboard" className="mt-3 space-y-1">
            {sections.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                aria-current={activeSection === section ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
                  activeSection === section
                    ? "bg-[#eaf5ee] text-[#0e6b4d]"
                    : "text-[#5d6961] hover:bg-[#f5f7f5] hover:text-[#173c2c]"
                }`}
              >
                <SectionIcon section={section} />
                {section}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-[#edf0ed] p-5">
          <p className="truncate text-sm font-semibold">{businessName}</p>
          <p className="mt-1 truncate text-xs text-[#78837b]">
            {account?.email ?? "Vendor account"}
          </p>
          <Link href="/vendors" className="mt-4 inline-block text-xs font-medium text-[#14785e] hover:underline">
            Vendor help
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between border-b border-[#e3e9e4] bg-white px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-base font-bold lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0e3b31] text-xs text-white">B</span>
            Brandels
          </Link>
          <p className="hidden text-sm font-medium text-[#68716b] lg:block">
            Vendor portal / <span className="text-[#17251e]">{activeSection}</span>
          </p>
          <div className="flex items-center gap-3">
            <AccountAccess />
          </div>
        </header>

        <nav
          aria-label="Vendor sections"
          className="flex gap-1 overflow-x-auto border-b border-[#e3e9e4] bg-white px-4 py-2 lg:hidden"
        >
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                activeSection === section
                  ? "bg-[#eaf5ee] text-[#0e6b4d]"
                  : "text-[#5d6961]"
              }`}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          {accountState === "loading" ? (
            <p className="text-sm text-[#68716b]" role="status">Loading your vendor portal…</p>
          ) : accountState !== "ready" ? (
            <section className="rounded-2xl border border-[#e3e9e4] bg-white p-8">
              <h1 className="text-2xl font-semibold">
                {accountState === "signed-out" ? "Sign in to manage products" : "Vendor portal unavailable"}
              </h1>
              <p className="mt-2 text-sm text-[#68716b]">
                {loadError || "Try again in a moment."}
              </p>
              {accountState === "error" && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-5 inline-flex rounded-lg bg-[#0e3b31] px-5 py-3 text-sm font-semibold text-white hover:bg-[#145542]"
                >
                  Reload vendor portal
                </button>
              )}
            </section>
          ) : activeSection === "Overview" ? (
            <DashboardOverview
              account={account}
              businessName={businessName}
              onOpenProducts={() => setActiveSection("Products")}
            />
          ) : activeSection === "Products" ? (
            <VendorProducts />
          ) : activeSection === "Orders" ? (
            <VendorOrders />
          ) : (
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#14785e]">
                Vendor portal
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
                {activeSection}
              </h1>
              <div className="mt-6 rounded-2xl border border-[#e3e9e4] bg-white p-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eaf5ee] text-[#14785e]">
                  <SectionIcon section={activeSection} />
                </div>
                <h2 className="mt-5 text-lg font-semibold">
                  {activeSection} will appear here
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#68716b]">
                  This area will show your vendor activity when the relevant backend
                  workflow is connected.
                </p>
                <span className="mt-5 inline-flex rounded-full bg-[#f1f3f1] px-3 py-1.5 text-xs font-medium text-[#68716b]">
                  Coming soon
                </span>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function DashboardOverview({
  account,
  businessName,
  onOpenProducts,
}: {
  account: VendorAccount | null;
  businessName: string;
  onOpenProducts: () => void;
}) {
  const stats = [
    { label: "Total orders", value: "—", note: "Orders are not connected yet" },
    { label: "Products listed", value: "—", note: "Manage listings in Products" },
    { label: "Store visits", value: "—", note: "Insights are not connected yet" },
  ];

  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#14785e]">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Welcome to your store
          </h1>
          <p className="mt-2 text-sm text-[#68716b]">
            Here’s what’s happening with {businessName}.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenProducts}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0e3b31] px-5 text-sm font-semibold text-white hover:bg-[#145542]"
        >
          View products <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-[#cfe6d7] bg-[#f0f8f2] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold">Your store is ready</p>
          <p className="mt-1 text-sm leading-6 text-[#68716b]">
            Add products to your catalogue and publish them to the marketplace when ready.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-[#e3e9e4] bg-white p-5">
            <p className="text-sm font-medium text-[#68716b]">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-2 text-xs text-[#87918a]">{stat.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <section className="rounded-2xl border border-[#e3e9e4] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent orders</h2>
              <p className="mt-1 text-sm text-[#68716b]">Your latest customer orders</p>
            </div>
            <span className="rounded-full bg-[#f1f3f1] px-3 py-1.5 text-xs font-medium text-[#68716b]">
              No orders yet
            </span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead>
                <tr className="border-y border-[#edf0ed] text-xs uppercase tracking-wide text-[#87918a]">
                  <th className="py-3 font-medium">Order</th>
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-[#87918a]">
                    Orders will show here when your store is active.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e3e9e4] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Store details</h2>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs font-medium text-[#87918a]">Business</dt>
              <dd className="mt-1 text-sm font-medium">{businessName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#87918a]">Account</dt>
              <dd className="mt-1 text-sm">{account?.email || "Signed-in account"}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-xl bg-[#f7f9f7] p-4 text-sm leading-6 text-[#68716b]">
            Your product listings are saved to this account. Orders, inventory synchronization,
            and payouts are not connected yet.
          </div>
        </section>
      </div>
    </>
  );
}

type VendorOrder = {
  id: string;
  product_name: string;
  quantity: number;
  branded: boolean;
  unit_price_minor_units: number;
  total_minor_units: number;
  currency: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  shipping_address: {
    address: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  design_url: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
};

function VendorOrders() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        const response = await fetch("/api/vendor/orders");
        const result: { orders?: VendorOrder[]; error?: string } = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "Could not load your orders.");
        }
        if (!Array.isArray(result.orders)) {
          throw new Error("The orders response has an invalid format.");
        }
        if (active) setOrders(result.orders);
      } catch (error) {
        console.error("Could not load vendor orders.", error);
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load your orders.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadOrders();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#14785e]">
        Vendor portal
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Orders</h1>
      <p className="mt-2 text-sm text-[#68716b]">
        Paid orders placed for your products.
      </p>
      {loadError && (
        <p className="mt-5 rounded-xl bg-[#fff5f4] p-4 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}
      {isLoading ? (
        <p className="mt-6 text-sm text-[#68716b]" role="status">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[#d6e0d8] bg-white p-8 text-center text-sm text-[#68716b]">
          You don’t have any paid orders yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-[#e3e9e4] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{order.product_name}</h2>
                  <p className="mt-1 text-sm text-[#68716b]">
                    Order {order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-[#eaf5ee] px-3 py-1.5 text-xs font-semibold capitalize text-[#116344]">
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-[#87918a]">Buyer</dt>
                  <dd className="mt-1 font-medium">{order.buyer_name}</dd>
                  <dd>{order.buyer_email}</dd>
                  <dd>{order.buyer_phone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#87918a]">Delivery address</dt>
                  <dd className="mt-1">
                    {order.shipping_address.address}, {order.shipping_address.city},{" "}
                    {order.shipping_address.region}, {order.shipping_address.postalCode},{" "}
                    {order.shipping_address.country}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#87918a]">Order total</dt>
                  <dd className="mt-1 font-semibold">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: order.currency,
                    }).format(order.total_minor_units / 100)}
                  </dd>
                  <dd>
                    {order.quantity} items{order.branded ? " · Branded" : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[#87918a]">Artwork</dt>
                  <dd className="mt-1 flex gap-4">
                    {order.design_url ? (
                      <a href={order.design_url} target="_blank" rel="noreferrer" className="font-medium text-[#14785e] underline">
                        Download design
                      </a>
                    ) : (
                      <span>No design supplied</span>
                    )}
                    {order.logo_url && (
                      <a href={order.logo_url} target="_blank" rel="noreferrer" className="font-medium text-[#14785e] underline">
                        View logo
                      </a>
                    )}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function VendorProducts() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCleaningImages, setIsCleaningImages] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [sku, setSku] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);

  function resetForm() {
    setEditingProductId(null);
    setName("");
    setDescription("");
    setCategory("");
    setPrice("");
    setCompareAtPrice("");
    setInventory("");
    setSku("");
    setTags("");
    setImageUrls([]);
    setIsPublished(true);
    setMessage("");
    setMessageIsError(false);
  }

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch("/api/vendor/products");
        const result: {
          products?: VendorProduct[];
          error?: string;
        } = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "Could not load products.");
        }
        if (
          !Array.isArray(result.products) ||
          !result.products.every(
            (product) =>
              typeof product.id === "string" &&
              typeof product.name === "string" &&
              typeof product.price_minor_units === "number",
          )
        ) {
          throw new Error("The product list response has an invalid format.");
        }
        if (active) setProducts(result.products);
      } catch (error) {
        console.error("Could not load vendor products.", error);
        if (active) {
          setMessageIsError(true);
          setMessage(
            error instanceof Error ? error.message : "Could not load vendor products.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  async function cleanImages(files: FileList | null) {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    if (imageUrls.length + selectedFiles.length > 10) {
      setMessageIsError(true);
      setMessage("A product can have up to 10 images.");
      return;
    }
    setMessage("");
    setMessageIsError(false);
    setIsCleaningImages(true);
    try {
      for (const file of selectedFiles) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Choose JPG, PNG, or WebP images.");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Each image must be 10 MB or smaller.");
        }
        const body = new FormData();
        body.set("image", file);
        const response = await fetch("/api/vendor/products/clean-image", {
          method: "POST",
          body,
        });
        const result: { imageUrl?: string; error?: string } = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? `Could not clean ${file.name}.`);
        }
        if (typeof result.imageUrl !== "string") {
          throw new Error("The image cleanup response was invalid.");
        }
        setImageUrls((current) => [...current, result.imageUrl!]);
      }
      setMessage("Images cleaned and ready for your product listing.");
    } catch (error) {
      console.error("Could not clean vendor product images.", error);
      setMessageIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not clean product images.");
    } finally {
      setIsCleaningImages(false);
    }
  }

  function startEditing(product: VendorProduct) {
    setEditingProductId(product.id);
    setName(product.name);
    setDescription(product.description);
    setCategory(product.category);
    setPrice((product.price_minor_units / 100).toFixed(2));
    setCompareAtPrice(
      product.compare_at_price_minor_units === null
        ? ""
        : (product.compare_at_price_minor_units / 100).toFixed(2),
    );
    setInventory(String(product.inventory));
    setSku(product.sku ?? "");
    setTags((product.tags ?? []).join(", "));
    setImageUrls(product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : []);
    setIsPublished(product.status === "active");
    setMessage("");
    setMessageIsError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageIsError(false);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/vendor/products", {
        method: editingProductId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingProductId ? { id: editingProductId } : {}),
          name,
          description,
          category,
          price: Number(price),
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
          inventory: Number(inventory),
          sku,
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          imageUrls,
          status: isPublished ? "active" : "draft",
        }),
      });
      const result: { product?: VendorProduct; error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Could not save this product.");
      }
      const savedProduct = result.product;
      if (!savedProduct) {
        throw new Error("The product save response was incomplete.");
      }
      setProducts((current) =>
        editingProductId
          ? current.map((item) => item.id === savedProduct.id ? savedProduct : item)
          : [savedProduct, ...current],
      );
      resetForm();
      setMessage(savedProduct.status === "active" ? "Product published." : "Draft saved.");
    } catch (error) {
      console.error("Could not save vendor product.", error);
      setMessageIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Could not save this product.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#14785e]">
            Vendor catalogue
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Products</h1>
          <p className="mt-2 text-sm text-[#68716b]">
            Manage product details, pricing, images, and availability.
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#f1f3f1] px-3 py-1.5 text-xs font-medium text-[#68716b]">
          {products.length} {products.length === 1 ? "product" : "products"}
        </span>
      </div>

      <form
          onSubmit={(event) => void submitProduct(event)}
          className="mt-6 rounded-2xl border border-[#e3e9e4] bg-white p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {editingProductId ? "Edit product" : "Add a product"}
            </h2>
            {editingProductId && (
              <button type="button" onClick={resetForm} className="text-sm font-medium text-[#14785e] hover:underline">
                Cancel editing
              </button>
            )}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium sm:col-span-2">
              Title
              <input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 outline-none focus:border-[#14785e]" placeholder="Product title" />
            </label>
            <label className="text-sm font-medium">
              Product type
              <input required maxLength={120} value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 outline-none focus:border-[#14785e]" placeholder="e.g. Drinkware" />
            </label>
            <label className="text-sm font-medium">
              SKU
              <input maxLength={100} value={sku} onChange={(event) => setSku(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 outline-none focus:border-[#14785e]" placeholder="Optional stock code" />
            </label>
            <label className="text-sm font-medium">
              Price (NGN)
              <input required type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 outline-none focus:border-[#14785e]" />
            </label>
            <label className="text-sm font-medium">
              Compare-at price (NGN)
              <input type="number" min="0" step="0.01" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 outline-none focus:border-[#14785e]" placeholder="Optional" />
            </label>
            <label className="text-sm font-medium">
              Available inventory
              <input required type="number" min="0" step="1" value={inventory} onChange={(event) => setInventory(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 outline-none focus:border-[#14785e]" />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Tags <span className="font-normal text-[#87918a]">(comma-separated)</span>
              <input value={tags} onChange={(event) => setTags(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 outline-none focus:border-[#14785e]" placeholder="corporate gift, wellness" />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Description
              <textarea rows={5} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 outline-none focus:border-[#14785e]" placeholder="Describe the product and its key details" />
            </label>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium">Media</p>
              <p className="mt-1 text-xs leading-5 text-[#68716b]">
                Upload up to 10 JPG, PNG, or WebP images (10 MB each). OpenAI will clean
                each image and save it to your product media library.
              </p>
              <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#b8c9bd] bg-[#f7f9f7] px-4 text-center text-sm font-medium text-[#14785e] hover:bg-[#eff8f2]">
                {isCleaningImages ? "Cleaning and saving images…" : "Choose product images"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={isCleaningImages || imageUrls.length >= 10}
                  onChange={(event) => {
                    void cleanImages(event.target.files);
                    event.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>
              {imageUrls.length > 0 && (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {imageUrls.map((url, index) => (
                    <li key={url} className="relative overflow-hidden rounded-xl border border-[#e3e9e4]">
                      <Image
                        src={url}
                        alt={`Cleaned product image ${index + 1}`}
                        width={400}
                        height={400}
                        unoptimized
                        className="aspect-square w-full bg-[#f7f9f7] object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrls((current) => current.filter((item) => item !== url))}
                        aria-label={`Remove product image ${index + 1}`}
                        className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs shadow"
                      >
                        Remove
                      </button>
                      {index === 0 && <span className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold">Cover</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <label className="flex items-start gap-3 text-sm sm:col-span-2">
              <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#14785e]" />
              <span>
                <span className="font-medium">Publish to the Brandels catalog</span>
                <span className="mt-1 block text-xs leading-5 text-[#68716b]">
                  Published products are visible to shoppers immediately. Unchecked products are saved as drafts.
                </span>
              </span>
            </label>
          </div>
          {message && (
            <p
              className={`mt-4 text-sm ${messageIsError ? "text-red-700" : "text-[#14785e]"}`}
              role={messageIsError ? "alert" : "status"}
            >
              {message}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={isSubmitting || isCleaningImages} className="min-h-11 rounded-lg bg-[#0e3b31] px-5 text-sm font-semibold text-white hover:bg-[#145542] disabled:opacity-50">
              {isSubmitting ? "Saving…" : editingProductId ? "Update product" : isPublished ? "Save and publish" : "Save draft"}
            </button>
          </div>
      </form>

      <div className="mt-7">
        <h2 className="text-lg font-semibold">Your product listings</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-[#68716b]" role="status">Loading products…</p>
        ) : products.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#d6e0d8] bg-white p-8 text-center text-sm text-[#68716b]">
            You haven’t listed any products yet.
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <li key={product.id} className="rounded-2xl border border-[#e3e9e4] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-1 text-xs text-[#68716b]">{product.category}</p>
                  </div>
                  <span className="rounded-full bg-[#fff4df] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#8a5a08]">
                    {product.status.replace("_", " ")}
                  </span>
                </div>
                {(product.image_urls?.[0] || product.image_url) && (
                  <Image
                    src={product.image_urls?.[0] || product.image_url}
                    alt={product.name}
                    width={600}
                    height={450}
                    unoptimized
                    className="mt-4 aspect-[4/3] w-full rounded-lg bg-[#f7f9f7] object-contain p-3"
                  />
                )}
                <p className="mt-4 text-sm font-semibold">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: product.currency,
                  }).format(product.price_minor_units / 100)}
                </p>
                <p className="mt-1 text-xs text-[#68716b]">
                  SKU: {product.sku || "—"} · Inventory: {product.inventory}
                </p>
                {product.tags?.length > 0 && (
                  <p className="mt-2 text-xs text-[#68716b]">{product.tags.join(", ")}</p>
                )}
                <button
                  type="button"
                  onClick={() => startEditing(product)}
                  className="mt-4 text-sm font-semibold text-[#14785e] hover:underline"
                >
                  Edit product
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
