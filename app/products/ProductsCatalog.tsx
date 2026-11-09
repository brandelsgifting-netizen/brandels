"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AccountAccess from "../AccountAccess";

type Product = {
  id?: string;
  name: string;
  image: string;
  alt: string;
  category: string;
  parent: string;
  price?: number;
  description?: string;
  inventory?: number;
};

type CustomerStoreState = {
  collections: string[];
  collectionProducts: Record<string, string[]>;
  savedProducts: string[];
  cart: Record<string, number>;
};

function isCustomerStoreState(value: unknown): value is CustomerStoreState {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.collections) &&
    record.collections.every((item) => typeof item === "string") &&
    Array.isArray(record.savedProducts) &&
    record.savedProducts.every((item) => typeof item === "string") &&
    typeof record.collectionProducts === "object" &&
    record.collectionProducts !== null &&
    typeof record.cart === "object" &&
    record.cart !== null
  );
}

const categories = [
  {
    title: "Gift Baskets & Sets",
    items: ["Flowers & Plants", "Gift Baskets & Towers", "Gift Boxes, Kits & Sets"],
  },
  {
    title: "Home",
    items: ["Bar Accessories", "BBQ and Grilling", "Blankets & Throws", "Kitchen & Dining", "Plants"],
  },
  {
    title: "Outdoor & Leisure",
    items: ["Golf", "Home Fitness", "Outdoor Living", "Sunglasses", "Umbrellas"],
  },
  {
    title: "Wine & Liquor",
    items: ["Champagne & Bubbly", "Cocktail Kits", "Liquor", "Wine"],
  },
  {
    title: "Office",
    items: ["Awards", "Desk Plants", "Desktop Accessories", "Pens", "Stationery"],
  },
  {
    title: "Food & Candy",
    items: ["Candy", "Chocolate", "Coffee, Tea, & Beverages", "Cookies & Baking", "Savory Gourmet"],
  },
  {
    title: "Tech",
    items: ["Audio", "Power & Charging", "Smart Home", "Tech Sets & Kits"],
  },
  {
    title: "Drinkware",
    items: ["Barware", "Coffee Mugs", "Drinkware Sets", "Mug & Snack Sets", "Travel Mugs & Tumblers", "Water Bottles"],
  },
  {
    title: "Bags & Luggage",
    items: ["Backpacks", "Business Bags", "Cooler Bags", "Luggage & Travel", "Tote Bags"],
  },
  {
    title: "Apparel",
    items: ["Accessories", "Headwear", "Hoodies & Pullovers", "Outerwear & Fleece", "Scrubs", "T-Shirts"],
  },
  {
    title: "Health & Wellness",
    items: ["Bath & Body", "Candles & Aromatherapy", "Massagers", "Personal Care"],
  },
] as const;

const featuredProducts: Product[] = [
  {
    name: "Corporate Gift Hamper",
    image: "/IMAGES/HAMPER.png",
    alt: "Assorted corporate gift hamper",
    category: "Gift Baskets & Towers",
    parent: "Gift Baskets & Sets",
  },
  {
    name: "Gift Voucher Set",
    image: "/IMAGES/Gift_voucher_templates___Premium_Vector-removebg-preview.png",
    alt: "Red gift voucher set",
    category: "Gift Boxes, Kits & Sets",
    parent: "Gift Baskets & Sets",
  },
  {
    name: "Executive Notebook Set",
    image: "/IMAGES/DESKTOPANDOFFICE.png",
    alt: "Executive notebooks and pens",
    category: "Stationery",
    parent: "Office",
  },
  {
    name: "Everyday Work Backpack",
    image: "/IMAGES/bagpack1.png",
    alt: "Black work backpack",
    category: "Backpacks",
    parent: "Bags & Luggage",
  },
  {
    name: "Classic Travel Backpack",
    image: "/IMAGES/bagpack2.png",
    alt: "Blue travel backpack",
    category: "Backpacks",
    parent: "Bags & Luggage",
  },
  {
    name: "Portable Power Bank",
    image: "/IMAGES/powerbank1.png",
    alt: "Black portable power bank",
    category: "Power & Charging",
    parent: "Tech",
  },
  {
    name: "Branded Water Bottle",
    image: "/IMAGES/waterbottle.png",
    alt: "Green branded water bottle",
    category: "Water Bottles",
    parent: "Drinkware",
  },
] as const;

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

export default function ProductsCatalog() {
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [catalogLoadError, setCatalogLoadError] = useState("");
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeProductMenu, setActiveProductMenu] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"all" | "saved">("all");
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionProducts, setCollectionProducts] = useState<Record<string, string[]>>({});
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [productForNewCollection, setProductForNewCollection] = useState<Product | null>(null);
  const [createdCollection, setCreatedCollection] = useState<string | null>(null);
  const [hasCollectionDraft, setHasCollectionDraft] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showSavedCollections, setShowSavedCollections] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [branded, setBranded] = useState(false);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCollectionChoices, setShowCollectionChoices] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingRegion, setShippingRegion] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("Nigeria");
  const collectionDrawerRef = useRef<HTMLElement>(null);
  const [storeSync, setStoreSync] = useState<
    "loading" | "ready" | "signed-out" | "error"
  >("loading");
  const [storeSyncMessage, setStoreSyncMessage] = useState("");
  const products = useMemo(
    () => [...vendorProducts, ...featuredProducts],
    [vendorProducts],
  );

  useEffect(() => {
    let active = true;
    async function loadVendorProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const result: {
          products?: Array<{
            id: string;
            vendor_user_id: string;
            name: string;
            description: string;
            category: string;
            price_minor_units: number;
            inventory: number;
            image_url: string;
            image_urls: string[];
          }>;
          error?: string;
        } = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "Could not load vendor products.");
        }
        if (!Array.isArray(result.products)) {
          throw new Error("The published product response has an invalid format.");
        }
        const published = result.products
          .filter(
            (product) =>
              typeof product.id === "string" &&
              typeof product.name === "string" &&
              typeof product.category === "string" &&
              typeof product.price_minor_units === "number",
          )
          .map((product) => ({
            id: product.id,
            name: product.name,
            image: product.image_urls?.[0] || product.image_url || "/IMAGES/HAMPER.png",
            alt: product.name,
            category: product.category,
            parent: product.category,
            price: product.price_minor_units / 100,
            description: product.description,
            inventory: product.inventory,
          }));
        if (active) setVendorProducts(published);
      } catch (error) {
        console.error("Could not load published vendor products.", error);
        if (active) {
          setCatalogLoadError(
            error instanceof Error ? error.message : "Could not load vendor products.",
          );
        }
      }
    }

    void loadVendorProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadStoreState() {
      try {
        const response = await fetch("/api/customer/store-state");
        const result: { state?: unknown; error?: string } = await response.json();
        if (response.status === 401) {
          if (active) setStoreSync("signed-out");
          return;
        }
        if (!response.ok) {
          throw new Error(result.error ?? "Could not load your saved store data.");
        }
        if (result.state !== null && !isCustomerStoreState(result.state)) {
          throw new Error("Your saved collections or cart have an invalid format.");
        }
        if (active && result.state) {
          setCollections(result.state.collections);
          setCollectionProducts(result.state.collectionProducts);
          setSavedProducts(result.state.savedProducts);
          setCart(result.state.cart);
        }
        if (active) {
          setStoreSync("ready");
          setStoreSyncMessage("");
        }
      } catch (error) {
        console.error("Could not load customer collections and cart.", error);
        if (active) {
          setStoreSync("error");
          setStoreSyncMessage(
            error instanceof Error ? error.message : "Could not load saved store data.",
          );
        }
      }
    }

    void loadStoreState();
    window.addEventListener("brandels:auth-state-change", loadStoreState);
    return () => {
      active = false;
      window.removeEventListener("brandels:auth-state-change", loadStoreState);
    };
  }, []);

  useEffect(() => {
    if (storeSync !== "ready") return;
    const timeoutId = window.setTimeout(() => {
      void fetch("/api/customer/store-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collections, collectionProducts, savedProducts, cart }),
      })
        .then(async (response) => {
          const result: { error?: string } = await response.json();
          if (!response.ok) {
            if (response.status === 401) {
              setStoreSync("signed-out");
              return;
            }
            throw new Error(result.error ?? "Could not sync your collections and cart.");
          }
          setStoreSyncMessage("");
        })
        .catch((error: unknown) => {
          console.error("Could not sync customer collections and cart.", error);
          setStoreSyncMessage(
            error instanceof Error ? error.message : "Could not sync saved store data.",
          );
        });
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [cart, collectionProducts, collections, savedProducts, storeSync]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === null ||
        product.category === activeCategory ||
        product.parent === activeCategory;
      const matchesSearch =
        query.length === 0 ||
        `${product.name} ${product.category} ${product.parent}`.toLowerCase().includes(query);
      const matchesSaved = activeView !== "saved" || savedProducts.includes(product.name);
      const matchesCollection =
        selectedCollection === null ||
        (collectionProducts[selectedCollection] ?? []).includes(product.name);
      return matchesCategory && matchesSearch && matchesSaved && matchesCollection;
    });
  }, [activeCategory, collectionProducts, products, savedProducts, search, selectedCollection, activeView]);

  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartProducts = products.filter((product) => cart[product.name]);
  const minimumOrderQuantity = branded ? 50 : 1;
  const availableQuantity = selectedProduct?.inventory ?? 999;
  const quantityLimit = Math.max(
    minimumOrderQuantity,
    Math.min(availableQuantity, 999),
  );
  const orderTotal = (selectedProduct?.price ?? 0) * quantity;

  useEffect(() => {
    const paymentStatus = new URLSearchParams(window.location.search).get("payment");
    if (!paymentStatus) return;
    const timer = window.setTimeout(() => {
      setCheckoutMessage(
        paymentStatus === "success"
          ? "Payment confirmed. Your order has been sent to the vendor."
          : paymentStatus === "review"
            ? "Payment was received, but stock needs review. Please contact Brandels support."
            : "Payment could not be confirmed. Check your orders or try again.",
      );
    }, 0);
    window.history.replaceState({}, "", window.location.pathname);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showCreateCollection) return;

    function dismissOnOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !collectionDrawerRef.current?.contains(event.target)
      ) {
        setShowCreateCollection(false);
      }
    }

    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", dismissOnOutsidePointer);
  }, [showCreateCollection]);

  function addToCart(product: Product) {
    setCart((current) => ({
      ...current,
      [product.name]: (current[product.name] ?? 0) + 1,
    }));
    setActiveProductMenu(null);
  }

  function saveToCollection(product: Product, collection: string) {
    setCollectionProducts((current) => {
      const existing = current[collection] ?? [];
      return {
        ...current,
        [collection]: existing.includes(product.name)
          ? existing
          : [...existing, product.name],
      };
    });
    setActiveProductMenu(null);
  }

  function openCreateCollection(product: Product | null = null) {
    setProductForNewCollection(product);
    setCollectionName("");
    setCreatedCollection(null);
    setHasCollectionDraft(true);
    setShowCreateCollection(true);
    setActiveProductMenu(null);
    setSelectedProduct(null);
    setShowCollectionChoices(false);
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setQuantity(1);
    setBranded(false);
    setDesignFile(null);
    setLogoFile(null);
    setShowCheckout(false);
    setShowCollectionChoices(false);
    setCheckoutError("");
  }

  function chooseBranded(isBranded: boolean) {
    setBranded(isBranded);
    if (isBranded && quantity < 50) setQuantity(50);
    if (!isBranded && quantity < 1) setQuantity(1);
  }

  async function beginPurchase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct?.id) {
      setCheckoutError("This sample item is not available for online checkout yet.");
      return;
    }

    setCheckoutError("");
    setCheckoutBusy(true);
    try {
      const formData = new FormData();
      formData.set("productId", selectedProduct.id);
      formData.set("quantity", String(quantity));
      formData.set("branded", String(branded));
      formData.set("buyerName", buyerName);
      formData.set("email", buyerEmail);
      formData.set("phone", buyerPhone);
      formData.set("address", shippingAddress);
      formData.set("city", shippingCity);
      formData.set("region", shippingRegion);
      formData.set("postalCode", shippingPostalCode);
      formData.set("country", shippingCountry);
      if (designFile) formData.set("design", designFile);
      if (logoFile) formData.set("logo", logoFile);

      const response = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });
      const result: { authorizationUrl?: string; error?: string } =
        await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Could not start checkout.");
      }
      if (!result.authorizationUrl) {
        throw new Error("The checkout response did not include a payment link.");
      }
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      console.error("Could not start product checkout.", error);
      setCheckoutError(
        error instanceof Error ? error.message : "Could not start checkout.",
      );
      setCheckoutBusy(false);
    }
  }

  function closeCreateCollection() {
    setShowCreateCollection(false);
  }

  function proceedToCheckout() {
    if (!createdCollection) return;
    setCart((current) => {
      const next = { ...current };
      for (const productName of collectionProducts[createdCollection] ?? []) {
        next[productName] = (next[productName] ?? 0) + 1;
      }
      return next;
    });
    setShowCreateCollection(false);
    setShowCart(true);
  }

  function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = collectionName.trim();
    if (
      !name ||
      collections.some(
        (collection) => collection.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return;
    }
    setCollections((current) => [...current, name]);
    setCollectionProducts((current) => ({
      ...current,
      [name]: productForNewCollection ? [productForNewCollection.name] : [],
    }));
    setCreatedCollection(name);
  }

  function saveCreatedCollection() {
    if (!createdCollection) return;
    const itemsToSave = collectionProducts[createdCollection] ?? [];
    setSavedProducts((current) =>
      Array.from(new Set([...current, ...itemsToSave])),
    );
    setHasCollectionDraft(false);
    closeCreateCollection();
  }

  function showAllProducts() {
    setActiveView("all");
    setSelectedCollection(null);
    setActiveCategory(null);
    setSearch("");
  }

  function toggleCategory(title: string) {
    setOpenCategories((current) =>
      current.includes(title)
        ? current.filter((category) => category !== title)
        : [...current, title],
    );
    setActiveCategory((current) => (current === title ? null : current));
  }

  return (
    <main className="min-h-svh bg-[#fbfcfb] text-[#202522]">
      <header className="border-b border-[#e7ebe8] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-5 py-4 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-12">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold lg:justify-self-start">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0e3b31] text-sm text-white">
              B
            </span>
            Brandels
          </Link>
          <nav aria-label="Products navigation" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-sm font-medium text-[#57625b] lg:col-start-2 lg:row-start-1">
            <button type="button" onClick={() => { setActiveView("saved"); setSelectedCollection(null); }} className="hover:text-[#14785e]">
              Saved{savedProducts.length > 0 ? ` (${savedProducts.length})` : ""}
            </button>
            <button type="button" onClick={() => openCreateCollection()} className="hover:text-[#14785e]">
              Create a collection
            </button>
            <button type="button" onClick={() => setShowSavedCollections(true)} className="hover:text-[#14785e]">
              Saved collections
            </button>
            <button type="button" onClick={() => setShowCart(true)} className="hover:text-[#14785e]">
              Cart{cartCount > 0 ? ` (${cartCount})` : ""}
            </button>
            <Link href="/#workflows" className="hover:text-[#14785e]">Contact us</Link>
            <Link href="/#collections" className="hover:text-[#14785e]">Branded collections</Link>
          </nav>
          <div className="lg:col-start-3 lg:row-start-1 lg:justify-self-end">
            <AccountAccess />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        <div className="mb-8">
          <p className="text-sm text-[#747d77]">
            <Link href="/" className="hover:text-[#14785e]">Home</Link>
            <span className="mx-2">/</span>
            Products
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Gift products
          </h1>
          <p className="mt-2 text-sm text-[#68716b] sm:text-base">
            Thoughtful gifts for your team, clients, and every occasion.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
          <aside aria-label="Product categories">
            <div className="sticky top-6">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory(null);
                  setActiveView("all");
                  setSelectedCollection(null);
                }}
                className={`mb-4 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  activeCategory === null
                    ? "bg-[#eaf5ee] text-[#116344]"
                    : "text-[#4f5953] hover:bg-[#f0f3f1]"
                }`}
              >
                All products
              </button>

              <div className="border-t border-[#e3e8e4]">
                {categories.map((category) => {
                  const expanded = openCategories.includes(category.title);
                  const selected = activeCategory === category.title;

                  return (
                    <section key={category.title} className="border-b border-[#e3e8e4]">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => toggleCategory(category.title)}
                        className={`flex w-full items-center justify-between gap-3 py-3 text-left text-xs font-bold uppercase tracking-[0.07em] transition-colors ${
                          selected ? "text-[#14785e]" : "text-[#313a34] hover:text-[#14785e]"
                        }`}
                      >
                        {category.title}
                        <Chevron expanded={expanded} />
                      </button>
                      {expanded && (
                        <ul className="space-y-1 pb-3 pl-2">
                          {category.items.map((item) => (
                            <li key={item}>
                              <button
                                type="button"
                                onClick={() => setActiveCategory(item)}
                                aria-pressed={activeCategory === item}
                                className={`w-full rounded-md px-2 py-2 text-left text-sm transition-colors ${
                                  activeCategory === item
                                    ? "bg-[#eaf5ee] font-medium text-[#116344]"
                                    : "text-[#68716b] hover:bg-[#f0f3f1] hover:text-[#202522]"
                                }`}
                              >
                                {item}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </aside>

          <section aria-label="Products">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#68716b]" aria-live="polite">
                {visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}
                {activeCategory ? ` in ${activeCategory}` : ""}
                {activeView === "saved" ? " · Saved items" : ""}
                {selectedCollection ? ` · ${selectedCollection}` : ""}
              </p>
              <p
                className={`text-xs ${
                  storeSyncMessage ? "text-red-700" : "text-[#7b857e]"
                }`}
                role={storeSyncMessage ? "status" : undefined}
              >
                {storeSyncMessage ||
                  (storeSync === "signed-out"
                    ? "Sign in to sync your cart and collections"
                    : storeSync === "ready"
                      ? "Cart and collections sync to your account"
                      : "")}
              </p>
              {checkoutMessage && (
                <p className="w-full rounded-lg bg-[#eaf5ee] px-4 py-3 text-sm text-[#116344]" role="status">
                  {checkoutMessage}
                </p>
              )}
              <div className="w-full sm:w-72">
                {!showCreateCollection && hasCollectionDraft && (
                  <button
                    type="button"
                    onClick={() => setShowCreateCollection(true)}
                    className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-[#14785e]/25 bg-[#eaf5ee] px-4 py-3 text-left text-sm font-semibold text-[#0e3b31] shadow-sm transition-colors hover:bg-[#dff0e5]"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#1a9a62]"
                      />
                      Collection is still open
                    </span>
                    <span aria-hidden="true" className="text-lg leading-none">
                      ›
                    </span>
                  </button>
                )}
                <label className="block">
                  <span className="sr-only">Search products</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products"
                    className="w-full rounded-lg border border-[#dce2dd] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#14785e] focus:ring-2 focus:ring-[#14785e]/15"
                  />
                </label>
              </div>
            </div>

            {visibleProducts.length > 0 ? (
              <>
              {catalogLoadError && (
                <p className="mb-4 rounded-lg bg-[#fff9eb] p-3 text-sm text-[#765b24]" role="status">
                  Vendor products could not be loaded. {catalogLoadError}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <article
                    key={product.id ?? product.name}
                    className="group relative rounded-xl border border-[#e8ede9] bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(27,52,39,0.1)]"
                  >
                    <button
                      type="button"
                      onClick={() => openProduct(product)}
                      aria-label={`View ${product.name} details`}
                      className="relative block aspect-square w-full overflow-hidden rounded-t-xl bg-[#f7f9f7] text-left"
                    >
                      <Image
                        src={product.image}
                        alt={product.alt}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 40vw, 50vw"
                        unoptimized
                        className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    </button>
                    <div className="absolute right-3 top-3">
                      <button
                        type="button"
                        aria-label={`Add ${product.name} to cart or save it`}
                        aria-expanded={activeProductMenu === product.name}
                        onClick={() =>
                          setActiveProductMenu((current) =>
                            current === product.name ? null : product.name,
                          )
                        }
                        className="grid h-10 w-10 place-items-center rounded-full bg-white text-2xl text-[#173c2c] shadow-md transition-transform hover:scale-105"
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                      {activeProductMenu === product.name && (
                        <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-[#e2e8e3] bg-white p-2 shadow-xl">
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f1f6f2]"
                          >
                            Add to cart
                          </button>
                            <button
                              type="button"
                              onClick={() => openCreateCollection(product)}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f1f6f2]"
                            >
                              Create a collection
                            </button>
                            <div className="mt-1 border-t border-[#e9ede9] pt-1">
                              <p className="px-3 py-1 text-xs font-semibold text-[#747d77]">
                                Add to collection
                              </p>
                              {collections.length > 0 ? (
                                collections.map((collection) => (
                                  <button
                                    key={collection}
                                    type="button"
                                    onClick={() => saveToCollection(product, collection)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f1f6f2]"
                                  >
                                    <span aria-hidden="true" className="text-base leading-none text-[#14785e]">+</span>
                                    <span className="truncate">Add to {collection}</span>
                                  </button>
                                ))
                              ) : (
                                <p className="px-3 py-2 text-xs text-[#7b857e]">
                                  Create a collection first
                                </p>
                              )}
                            </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-medium text-[#7b857e]">
                        {product.category}
                      </p>
                      <button
                        type="button"
                        onClick={() => openProduct(product)}
                        className="mt-1 text-left text-sm font-semibold leading-5 text-[#29332d] hover:text-[#14785e] sm:text-base"
                      >
                        {product.name}
                      </button>
                      <p className="mt-3 text-xs font-semibold text-[#14785e]">
                        {product.price === undefined
                          ? "Contact us for pricing"
                          : new Intl.NumberFormat("en-NG", {
                              style: "currency",
                              currency: "NGN",
                            }).format(product.price)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[#dce2dd] bg-white px-6 py-16 text-center">
                <h2 className="text-lg font-semibold text-[#29332d]">
                  No products here just yet
                </h2>
                <p className="mt-2 text-sm text-[#68716b]">
                  Try another category or search all products.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    showAllProducts();
                  }}
                  className="mt-5 rounded-full bg-[#0e3b31] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#145542]"
                >
                  Show all products
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedProduct(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
            className="relative max-h-[94svh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close product details"
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-2xl text-[#59625d] shadow hover:bg-[#f1f4f1]"
            >
              &times;
            </button>
            <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="relative min-h-64 bg-[#f7f9f7] sm:min-h-96">
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.alt}
                  fill
                  sizes="(min-width: 768px) 45vw, 100vw"
                  unoptimized
                  className="object-contain p-8 sm:p-12"
                />
              </div>
              <div className="p-5 sm:p-8">
                <p className="text-sm font-medium text-[#68716b]">
                  {selectedProduct.category}
                </p>
                <h2
                  id="product-detail-title"
                  className="mt-2 pr-10 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl"
                >
                  {selectedProduct.name}
                </h2>
                {selectedProduct.price !== undefined ? (
                  <p className="mt-4 text-2xl font-bold text-[#173c2c]">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(selectedProduct.price)}
                    <span className="ml-2 text-sm font-normal text-[#68716b]">
                      per item
                    </span>
                  </p>
                ) : (
                  <p className="mt-4 text-lg font-semibold text-[#14785e]">
                    Contact us for pricing
                  </p>
                )}
                {selectedProduct.description && (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#59625d]">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="mt-6 rounded-xl border border-[#e4eae5] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="order-quantity" className="text-sm font-semibold">
                      Quantity
                    </label>
                    <output htmlFor="order-quantity" className="text-lg font-bold text-[#14785e]">
                      {quantity} items
                    </output>
                  </div>
                  <input
                    id="order-quantity"
                    type="range"
                    min={minimumOrderQuantity}
                    max={quantityLimit}
                    step="1"
                    value={Math.min(quantityLimit, Math.max(minimumOrderQuantity, quantity))}
                    disabled={!selectedProduct.id || availableQuantity < minimumOrderQuantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    className="mt-4 w-full accent-[#14785e] disabled:opacity-40"
                  />
                  <div className="mt-1 flex justify-between text-xs text-[#87918a]">
                    <span>{minimumOrderQuantity}</span>
                    <span>{quantityLimit}</span>
                  </div>
                  {selectedProduct.inventory !== undefined && (
                    <p className="mt-3 text-xs text-[#68716b]">
                      {selectedProduct.inventory} available
                    </p>
                  )}
                  <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-[#e8ede9] pt-4 text-sm">
                    <input
                      type="checkbox"
                      checked={branded}
                      disabled={
                        !selectedProduct.id ||
                        (selectedProduct.inventory !== undefined &&
                          selectedProduct.inventory < 50)
                      }
                      onChange={(event) => chooseBranded(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#14785e]"
                    />
                    <span>
                      <span className="font-semibold">Branded</span>
                      <span className="mt-1 block text-xs leading-5 text-[#68716b]">
                        Minimum order: 50 items. Add your design and logo below if you have them.
                      </span>
                    </span>
                  </label>
                  {selectedProduct.price !== undefined && (
                    <div className="mt-4 flex items-center justify-between border-t border-[#e8ede9] pt-4">
                      <span className="text-sm font-medium">Estimated total</span>
                      <strong className="text-xl">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                        }).format(orderTotal)}
                      </strong>
                    </div>
                  )}
                </div>

                {showCheckout ? (
                  <form onSubmit={(event) => void beginPurchase(event)} className="mt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Delivery details</h3>
                      <p className="mt-1 text-xs leading-5 text-[#68716b]">
                        Brandels collects payment and coordinates vendor settlement. Delivery charges are not included in this item total.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium sm:col-span-2">
                        Full name
                        <input required maxLength={160} autoComplete="name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 text-sm" />
                      </label>
                      <label className="text-sm font-medium">
                        Email
                        <input required type="email" maxLength={254} autoComplete="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 text-sm" />
                      </label>
                      <label className="text-sm font-medium">
                        Phone
                        <input required type="tel" maxLength={40} autoComplete="tel" value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 text-sm" />
                      </label>
                      <label className="text-sm font-medium sm:col-span-2">
                        Delivery address
                        <input required maxLength={500} autoComplete="street-address" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 text-sm" />
                      </label>
                      <label className="text-sm font-medium">
                        City
                        <input required maxLength={120} autoComplete="address-level2" value={shippingCity} onChange={(event) => setShippingCity(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 text-sm" />
                      </label>
                      <label className="text-sm font-medium">
                        State / region
                        <input required maxLength={120} autoComplete="address-level1" value={shippingRegion} onChange={(event) => setShippingRegion(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 text-sm" />
                      </label>
                      <label className="text-sm font-medium">
                        Postal code <span className="font-normal text-[#87918a]">(optional)</span>
                        <input maxLength={30} autoComplete="postal-code" value={shippingPostalCode} onChange={(event) => setShippingPostalCode(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 text-sm" />
                      </label>
                      <label className="text-sm font-medium">
                        Country
                        <input required maxLength={120} autoComplete="country-name" value={shippingCountry} onChange={(event) => setShippingCountry(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dce4de] px-3 py-2.5 text-sm" />
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Design file <span className="font-normal text-[#87918a]">(optional)</span>
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp"
                          onChange={(event) => setDesignFile(event.target.files?.[0] ?? null)}
                          className="mt-1.5 block w-full text-xs text-[#59625d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eaf5ee] file:px-3 file:py-2 file:font-semibold file:text-[#116344]"
                        />
                        {designFile && <span className="mt-1 block truncate text-xs text-[#68716b]">{designFile.name}</span>}
                      </label>
                      <label className="text-sm font-medium">
                        Logo image <span className="font-normal text-[#87918a]">(optional)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                          className="mt-1.5 block w-full text-xs text-[#59625d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eaf5ee] file:px-3 file:py-2 file:font-semibold file:text-[#116344]"
                        />
                        {logoFile && <span className="mt-1 block truncate text-xs text-[#68716b]">{logoFile.name}</span>}
                      </label>
                    </div>
                    <p className="text-xs text-[#87918a]">
                      PDF/JPG/PNG/WebP design and logo files up to 10 MB each. Artwork is shared privately with the buyer and assigned vendor.
                    </p>
                    {checkoutError && (
                      <p className="rounded-lg bg-[#fff5f4] p-3 text-sm text-red-700" role="alert">
                        {checkoutError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={checkoutBusy}
                        onClick={() => {
                          setShowCheckout(false);
                          setCheckoutError("");
                        }}
                        className="min-h-11 rounded-lg border border-[#d6e0d8] px-4 text-sm font-semibold text-[#173c2c] disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={
                          checkoutBusy ||
                          !selectedProduct.id ||
                          quantity < minimumOrderQuantity ||
                          quantity > availableQuantity
                        }
                        className="min-h-11 flex-1 rounded-lg bg-[#0e3b31] px-5 text-sm font-semibold text-white hover:bg-[#145542] disabled:opacity-50"
                      >
                        {checkoutBusy ? "Starting secure payment…" : `Continue to Paystack · ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(orderTotal)}`}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-6 space-y-3">
                    {!selectedProduct.id && (
                      <p className="text-xs leading-5 text-[#7b857e]">
                        Online checkout is available for products listed by signed-in vendors.
                      </p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => openCreateCollection(selectedProduct)}
                        className="min-h-11 rounded-lg border border-[#d6e0d8] px-3 text-sm font-semibold text-[#173c2c] hover:bg-[#f1f6f2]"
                      >
                        Create a collection
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (collections.length === 0) {
                            openCreateCollection(selectedProduct);
                          } else {
                            setShowCollectionChoices((current) => !current);
                          }
                        }}
                        className="min-h-11 rounded-lg border border-[#d6e0d8] px-3 text-sm font-semibold text-[#173c2c] hover:bg-[#f1f6f2]"
                      >
                        Add to a collection
                      </button>
                      <button
                        type="button"
                        disabled={
                          !selectedProduct.id ||
                          selectedProduct.price === undefined ||
                          !selectedProduct.inventory ||
                          availableQuantity < minimumOrderQuantity
                        }
                        onClick={() => {
                          setShowCheckout(true);
                          setCheckoutError("");
                        }}
                        className="min-h-11 rounded-lg bg-[#0e3b31] px-3 text-sm font-semibold text-white hover:bg-[#145542] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Purchase
                      </button>
                    </div>
                    {showCollectionChoices && (
                      <div className="rounded-xl border border-[#e2e8e3] bg-[#f7f9f7] p-3">
                        <p className="mb-2 text-xs font-semibold text-[#68716b]">
                          Choose a collection
                        </p>
                        {collections.map((collection) => (
                          <button
                            key={collection}
                            type="button"
                            onClick={() => {
                              saveToCollection(selectedProduct, collection);
                              setSelectedProduct(null);
                            }}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white"
                          >
                            {collection}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {showCreateCollection && (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex justify-end"
          role="presentation"
        >
          <div className="pointer-events-none absolute inset-0 bg-black/30" />
          <aside
            ref={collectionDrawerRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby="create-collection-title"
            className="pointer-events-auto relative h-full w-full max-w-md animate-[slide-in-right_300ms_ease-out_both] overflow-y-auto bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 id="create-collection-title" className="text-xl font-semibold">
                Create a collection
              </h2>
              <button
                type="button"
                aria-label="Close create collection panel"
                onClick={closeCreateCollection}
                className="rounded-full px-3 py-1 text-2xl text-[#69716c] hover:bg-[#f1f4f1]"
              >
                &times;
              </button>
            </div>
            <p className="mt-2 text-sm text-[#68716b]">
              {createdCollection
                ? `Your collection “${createdCollection}” is ready.`
                : productForNewCollection
                ? "Name your collection. The selected item below will be added when you create it."
                : "Organize gifts you want to save together."}
            </p>
            {createdCollection ? (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-[#29362f]">
                  Items in this collection
                </h3>
                {(collectionProducts[createdCollection] ?? []).length > 0 ? (
                  <ul className="space-y-3">
                    {(collectionProducts[createdCollection] ?? []).map((productName) => {
                      const product = products.find((item) => item.name === productName);
                      if (!product) return null;
                      return (
                        <li
                          key={product.name}
                          className="flex items-center gap-4 rounded-xl border border-[#e2e8e3] bg-[#f7f9f7] p-3"
                        >
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                            <Image
                              src={product.image}
                              alt={product.alt}
                              fill
                              sizes="80px"
                              className="object-contain p-2"
                            />
                          </div>
                          <p className="font-medium text-[#173c2c]">{product.name}</p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="rounded-xl bg-[#f7f9f7] p-4 text-sm text-[#68716b]">
                    No items have been added yet.
                  </p>
                )}
              </div>
            ) : productForNewCollection && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-[#29362f]">
                  Item being added
                </p>
                <div className="flex items-center gap-4 rounded-xl border border-[#e2e8e3] bg-[#f7f9f7] p-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image
                      src={productForNewCollection.image}
                      alt={productForNewCollection.alt}
                      fill
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-[#173c2c]">
                      {productForNewCollection.name}
                    </p>
                    <p className="mt-1 text-xs text-[#68716b]">
                      Will be included in this collection
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!createdCollection && <form onSubmit={createCollection} className="mt-6">
              <label className="block text-sm font-medium">
                Collection name
                <input
                  autoFocus
                  required
                  value={collectionName}
                  onChange={(event) => setCollectionName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#dce2dd] px-4 py-3 text-sm outline-none focus:border-[#14785e] focus:ring-2 focus:ring-[#14785e]/15"
                  placeholder="e.g. Client thank-you gifts"
                />
              </label>
              {collections.some(
                (collection) =>
                  collection.toLowerCase() === collectionName.trim().toLowerCase(),
              ) && (
                <p className="mt-2 text-sm text-red-700">
                  A collection with this name already exists.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateCollection}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#59625d] hover:bg-[#f2f4f2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !collectionName.trim() ||
                    collections.some(
                      (collection) =>
                        collection.toLowerCase() === collectionName.trim().toLowerCase(),
                    )
                  }
                  className="rounded-full bg-[#0e3b31] px-5 py-2 text-sm font-semibold text-white hover:bg-[#145542] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create collection
                </button>
              </div>
            </form>}
            {createdCollection && (
              <div className="sticky bottom-0 mt-8 flex gap-3 border-t border-[#e6ebe7] bg-white py-4">
                <button
                  type="button"
                  onClick={saveCreatedCollection}
                  className="flex-1 rounded-full border border-[#dce2dd] px-4 py-3 text-sm font-semibold text-[#173c2c] hover:bg-[#f7f9f7]"
                >
                  Save collection
                </button>
                <button
                  type="button"
                  onClick={proceedToCheckout}
                  disabled={(collectionProducts[createdCollection] ?? []).length === 0}
                  className="flex-1 rounded-full bg-[#0e3b31] px-4 py-3 text-sm font-semibold text-white hover:bg-[#145542] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Proceed to checkout
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {showSavedCollections && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowSavedCollections(false);
        }}>
          <aside role="dialog" aria-modal="true" aria-labelledby="saved-collections-title" className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="saved-collections-title" className="text-xl font-semibold">Saved collections</h2>
              <button type="button" aria-label="Close saved collections" onClick={() => setShowSavedCollections(false)} className="rounded-full px-3 py-1 text-2xl text-[#69716c] hover:bg-[#f1f4f1]">&times;</button>
            </div>
            {collections.length === 0 ? (
              <div className="mt-8 rounded-xl bg-[#f7f9f7] p-5">
                <p className="text-sm text-[#68716b]">You haven’t created any collections yet.</p>
                <button type="button" onClick={() => { setShowSavedCollections(false); openCreateCollection(); }} className="mt-4 text-sm font-semibold text-[#14785e] hover:underline">
                  Create your first collection
                </button>
              </div>
            ) : (
              <ul className="mt-6 space-y-2">
                {collections.map((collection) => (
                  <li key={collection}>
                    <button type="button" onClick={() => { setSelectedCollection(collection); setActiveView("all"); setShowSavedCollections(false); }} className="flex w-full items-center justify-between rounded-xl border border-[#e6ebe7] p-4 text-left hover:bg-[#f7f9f7]">
                      <span className="font-medium">{collection}</span>
                      <span className="text-sm text-[#68716b]">{(collectionProducts[collection] ?? []).length} items</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowCart(false);
        }}>
          <aside role="dialog" aria-modal="true" aria-labelledby="cart-title" className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="cart-title" className="text-xl font-semibold">Cart ({cartCount})</h2>
              <button type="button" aria-label="Close cart" onClick={() => setShowCart(false)} className="rounded-full px-3 py-1 text-2xl text-[#69716c] hover:bg-[#f1f4f1]">&times;</button>
            </div>
            {cartProducts.length === 0 ? (
              <p className="mt-8 rounded-xl bg-[#f7f9f7] p-5 text-sm text-[#68716b]">Your cart is empty. Add products with the + button.</p>
            ) : (
              <ul className="mt-6 divide-y divide-[#e7ebe8]">
                {cartProducts.map((product) => (
                  <li key={product.name} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="mt-1 text-sm text-[#68716b]">Quantity: {cart[product.name]}</p>
                    </div>
                    <button type="button" onClick={() => setCart((current) => {
                      const next = { ...current };
                      if (next[product.name] <= 1) delete next[product.name];
                      else next[product.name] -= 1;
                      return next;
                    })} className="rounded-full border border-[#dce2dd] px-3 py-1.5 text-sm hover:bg-[#f7f9f7]">
                      Remove one
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
