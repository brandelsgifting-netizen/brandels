"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type AccountMode = "login" | "signup";

const inputBaseClassName =
  "w-full border border-[#c9c9c9] px-4 py-3 text-sm text-[#202020] outline-none transition focus:border-[#13875f] focus:ring-2 focus:ring-[#13875f]/15";
const inputClassName = `mt-2 ${inputBaseClassName}`;

export default function AccountAccess() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AccountMode>("login");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"error" | "success">("error");
  const [signupPassword, setSignupPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [navMessage, setNavMessage] = useState("");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    let subscription: ReturnType<
      ReturnType<typeof createClient>["auth"]["onAuthStateChange"]
    >["data"]["subscription"] | undefined;
    const timeoutId = window.setTimeout(() => {
      try {
        const supabase = createClient();
        subscription = supabase.auth.onAuthStateChange((_event, session) => {
          setUserEmail(session?.user.email ?? null);
          window.dispatchEvent(new Event("brandels:auth-state-change"));
        }).data.subscription;
        void supabase.auth.getUser().then(({ data, error }) => {
          if (error) {
            console.error("Could not load the current Supabase user.", error);
            return;
          }
          setUserEmail(data.user?.email ?? null);
        });
      } catch (error) {
        console.error("Supabase account access is not configured.", error);
        setMessage("Account sign-in is unavailable. Check the Supabase environment settings.");
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  function openDrawer(nextMode: AccountMode, opener: HTMLButtonElement) {
    const target = document.getElementById("overlay-root");
    if (!target) {
      throw new Error("The account drawer portal root is missing.");
    }

    openerRef.current = opener;
    setPortalTarget(target);
    setMode(nextMode);
    setMessage("");
    setMessageKind("error");
    setEmail("");
    setSignupPassword("");
    window.requestAnimationFrame(() => setIsOpen(true));
  }

  function closeDrawer() {
    setIsOpen(false);
    openerRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageKind("error");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const emailAddress = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();
      if (mode === "signup") {
        const firstName = String(formData.get("firstName") ?? "").trim();
        const lastName = String(formData.get("lastName") ?? "").trim();
        const { data, error } = await supabase.auth.signUp({
          email: emailAddress,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName },
            emailRedirectTo: new URL("/auth/callback?next=/", window.location.origin).toString(),
          },
        });
        if (error) throw error;

        if (!data.session) {
          setMessageKind("success");
          setMessage("Check your email for a confirmation link to finish creating your account.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailAddress,
          password,
        });
        if (error) throw error;
      }

      setMessage("");
      closeDrawer();
    } catch (error) {
      console.error("Supabase email authentication failed.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn’t complete sign-in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setMessage("");
    setMessageKind("error");
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: new URL("/auth/callback?next=/", window.location.origin).toString(),
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google sign-in could not be started.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Google sign-in could not start. Check that Google is enabled in Supabase.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setMessage("");
    setMessageKind("error");
    if (!email.trim()) {
      setMessage("Enter your email address above, then choose Forgot password.");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: new URL(
          "/auth/callback?next=/account/update-password",
          window.location.origin,
        ).toString(),
      });
      if (error) throw error;
      setMessageKind("success");
      setMessage("If an account exists for that email, a password reset link is on its way.");
    } catch (error) {
      console.error("Supabase password reset could not be requested.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn’t request a password reset. Please try again.",
      );
    }
  }

  async function handleSignOut() {
    setNavMessage("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Supabase sign-out failed.", error);
      setNavMessage(
        error instanceof Error ? error.message : "We couldn’t sign out. Please try again.",
      );
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-[1.4cqw] text-[1.1cqw] font-medium max-[700px]:gap-2 max-[700px]:text-[12px]">
        {userEmail ? (
          <>
            <span className="hidden max-w-36 truncate text-xs text-[#52645a] sm:inline">
              {userEmail}
            </span>
            <button type="button" onClick={() => void handleSignOut()} className="whitespace-nowrap hover:text-[#14785e]">
              Sign out
            </button>
          </>
        ) : (
          <>
        <button
          type="button"
          onClick={(event) => openDrawer("login", event.currentTarget)}
          className="whitespace-nowrap hover:text-[#14785e]"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={(event) => openDrawer("signup", event.currentTarget)}
          className="whitespace-nowrap font-semibold text-[#14785e] hover:text-[#0e5e49]"
        >
          Sign up
        </button>
          </>
        )}
        <a
          href="#workflows"
          className="whitespace-nowrap rounded-full bg-[#0e3b31] px-[1.6cqw] py-[0.75cqw] font-semibold text-white transition-colors hover:bg-[#145542] max-[700px]:px-2.5 max-[700px]:py-2"
        >
          Talk to sales
        </a>
        {navMessage && (
          <span role="alert" className="max-w-48 text-xs text-red-700">
            {navMessage}
          </span>
        )}
      </div>

      {portalTarget &&
        createPortal(
          <div
            className={`fixed inset-0 z-[100] ${isOpen ? "" : "pointer-events-none"}`}
            aria-hidden={!isOpen}
          >
            <button
              type="button"
              tabIndex={isOpen ? 0 : -1}
              aria-label="Close account panel"
              onClick={closeDrawer}
              className={`absolute inset-0 h-full w-full bg-black/45 transition-opacity duration-300 ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="account-panel-title"
              inert={!isOpen}
              className={`absolute right-0 top-0 flex h-full w-full ${
                mode === "signup" ? "max-w-[760px]" : "max-w-[680px]"
              } flex-col overflow-y-auto bg-white px-7 pb-10 pt-7 shadow-2xl transition-transform duration-300 ease-out sm:px-12 sm:pt-10 ${
                isOpen ? "translate-x-0" : "translate-x-full"
              }`}
              >
                <div className="flex justify-end">
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={closeDrawer}
                    aria-label="Close account panel"
                    className="grid h-10 w-10 place-items-center rounded-full text-3xl leading-none text-[#737373] transition-colors hover:bg-[#f2f4f2] hover:text-[#202020]"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>

                <div
                  className={`mx-auto mt-5 w-full ${
                    mode === "signup" ? "max-w-[650px]" : "max-w-[430px]"
                  }`}
                >
                  <h2 id="account-panel-title" className="sr-only">
                    {mode === "login" ? "Log in" : "Create an account"}
                  </h2>
                  <div className="flex border-b border-[#e1e4e2]">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setMessage("");
                        setMessageKind("error");
                      }}
                      aria-current={mode === "login" ? "page" : undefined}
                      className={`border-b-[3px] px-1 pb-3 text-sm font-semibold transition-colors ${
                        mode === "login"
                          ? "border-[#13875f] text-[#13875f]"
                          : "border-transparent text-[#727772] hover:text-[#202020]"
                      }`}
                    >
                      LOG IN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setMessage("");
                        setMessageKind("error");
                        setSignupPassword("");
                      }}
                      aria-current={mode === "signup" ? "page" : undefined}
                      className={`ml-7 border-b-[3px] px-1 pb-3 text-sm font-semibold transition-colors ${
                        mode === "signup"
                          ? "border-[#13875f] text-[#13875f]"
                          : "border-transparent text-[#727772] hover:text-[#202020]"
                      }`}
                    >
                      CREATE AN ACCOUNT
                    </button>
                  </div>

                  <div className="py-8">
                    {mode === "signup" ? (
                      <div className="mb-6">
                        <p className="text-sm text-[#292d2a]">
                          Creating an account benefits you:
                        </p>
                        <ul className="mt-4 list-inside list-disc space-y-1 text-sm leading-5 text-[#292d2a]">
                          <li>Browse and save ideas to wish lists</li>
                          <li>Track deliveries and order status</li>
                          <li>Expedite check out</li>
                          <li>Manage eGifts and more</li>
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-[#666b67]">
                        Welcome back. Enter your details to log in.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleGoogleSignIn()}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#4285f4] px-5 py-3 text-sm font-semibold text-[#4285f4] transition-colors hover:bg-[#f5f8ff]"
                    >
                      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.62 5.91c4.45-4.11 7.14-10.17 7.14-17.56Z" />
                        <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.89.93 7.59 2.56 10.78l7.97-6.19Z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.62-5.91c-2.12 1.42-4.84 2.26-8.29 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                      </svg>
                      {mode === "login" ? "Log in with Google" : "Sign up with Google"}
                    </button>

                    <div className="my-7 flex items-center gap-3 text-xs text-[#9a9e9b]">
                      <span className="h-px flex-1 bg-[#e5e7e5]" />
                      Or
                      <span className="h-px flex-1 bg-[#e5e7e5]" />
                    </div>

                    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
                      {mode === "signup" && (
                        <fieldset>
                          <legend className="text-sm font-medium text-[#292d2a]">
                            Full name
                          </legend>
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            <input
                              autoComplete="given-name"
                              className={inputBaseClassName}
                              name="firstName"
                              placeholder="First name"
                              required
                              aria-label="First name"
                            />
                            <input
                              autoComplete="family-name"
                              className={inputBaseClassName}
                              name="lastName"
                              placeholder="Last name"
                              required
                              aria-label="Last name"
                            />
                          </div>
                        </fieldset>
                      )}

                      <label className="block text-sm font-medium text-[#292d2a]">
                        Email address
                        <input
                          autoComplete="email"
                          className={inputClassName}
                          name="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder={mode === "signup" ? "Email" : "Enter your email address"}
                          required
                          type="email"
                        />
                      </label>

                      {mode === "signup" ? (
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-end">
                          <label className="block text-sm font-medium text-[#292d2a]">
                            Password
                            <input
                              autoComplete="new-password"
                              className={inputClassName}
                              name="password"
                              placeholder="Create your password"
                              required
                              minLength={10}
                              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{10,}"
                              title="Use at least 10 characters, including lowercase, uppercase, a number, and a special character."
                              type="password"
                              value={signupPassword}
                              onChange={(event) => setSignupPassword(event.target.value)}
                            />
                          </label>
                          <ul className="space-y-2 pb-1 text-xs text-[#8a8e8b]">
                            {[
                              {
                                label: "10 characters minimum",
                                met: signupPassword.length >= 10,
                              },
                              {
                                label: "One lowercase character",
                                met: /[a-z]/.test(signupPassword),
                              },
                              {
                                label: "One uppercase character",
                                met: /[A-Z]/.test(signupPassword),
                              },
                              {
                                label: "One special character",
                                met: /[^A-Za-z0-9]/.test(signupPassword),
                              },
                              {
                                label: "One number",
                                met: /[0-9]/.test(signupPassword),
                              },
                            ].map((requirement) => (
                              <li
                                key={requirement.label}
                                className={`flex items-center gap-2 ${
                                  requirement.met ? "text-[#13875f]" : ""
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                                    requirement.met
                                      ? "border-[#13875f] bg-[#13875f] text-white"
                                      : "border-[#aeb3af]"
                                  }`}
                                >
                                  {requirement.met ? "✓" : ""}
                                </span>
                                {requirement.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <label className="block text-sm font-medium text-[#292d2a]">
                          Password
                          <input
                            autoComplete="current-password"
                            className={inputClassName}
                            name="password"
                            placeholder="Enter your password"
                            required
                            minLength={8}
                            type="password"
                          />
                        </label>
                      )}

                      {message && (
                        <p
                          role="status"
                          className={`text-sm leading-6 ${
                            messageKind === "success" ? "text-[#13875f]" : "text-[#a33d32]"
                          }`}
                        >
                          {message}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#252525] disabled:cursor-wait disabled:opacity-60"
                      >
                        {isSubmitting
                          ? "Please wait…"
                          : mode === "login"
                            ? "Log in"
                            : "Create an account"}
                      </button>
                    </form>

                    {mode === "signup" ? (
                      <p className="mt-5 text-xs italic leading-6 text-[#858a86]">
                        By clicking the “CREATE AN ACCOUNT” button, you are
                        creating a Brandels account and agree to our{" "}
                        <a href="#footer" className="text-[#13875f] underline">
                          Terms of Use
                        </a>{" "}
                        and{" "}
                        <a href="#footer" className="text-[#13875f] underline">
                          Privacy Policy
                        </a>
                        .
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handlePasswordReset()}
                        className="mt-5 text-sm font-medium text-[#13875f] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                </div>
            </aside>
          </div>,
          portalTarget,
        )}
    </>
  );
}
