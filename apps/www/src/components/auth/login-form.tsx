"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { apiBaseUrl } from "@/lib/api";
import { authClient } from "@/lib/auth/client";

type FeedbackState = {
  tone: "error" | "success";
  text: string;
};

const ownerBootstrapEndpoint = `${apiBaseUrl}/auth/bootstrap-owner`;

type OwnerStateResponse = {
  ownerExists: boolean;
};

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const session = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerFeedback, setOwnerFeedback] = useState<FeedbackState | null>(null);
  const [ownerState, setOwnerState] = useState<OwnerStateResponse | null>(null);
  const [isOwnerStateLoading, setIsOwnerStateLoading] = useState(true);
  const [isOwnerPending, startOwnerTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    const loadOwnerState = async () => {
      try {
        const response = await fetch(ownerBootstrapEndpoint, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load owner state (${response.status})`);
        }

        const data = (await response.json()) as OwnerStateResponse;
        setOwnerState(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setOwnerState({ ownerExists: true });

        if (process.env.NODE_ENV === "development") {
          console.warn("[login] Failed to fetch owner state", error);
        }
      } finally {
        setIsOwnerStateLoading(false);
      }
    };

    void loadOwnerState();

    return () => {
      controller.abort();
    };
  }, []);

  const isAuthenticated = Boolean(session.data?.user);
  const ownerUnavailable = ownerState?.ownerExists === false;
  const showOwnerStatusLoader = ownerState === null && isOwnerStateLoading;
  const shouldShowOwnerForm = ownerState?.ownerExists === false;
  const isSignInBusy = isPending || session.isPending;
  const isSignInDisabled = isSignInBusy || ownerUnavailable || showOwnerStatusLoader;

  const resetFields = () => {
    setEmail("");
    setPassword("");
  };

  const resetOwnerFields = () => {
    setFirstName("");
    setLastName("");
    setOwnerEmail("");
    setOwnerPassword("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSignInDisabled) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (trimmedEmail.length === 0 || trimmedPassword.length === 0) {
      setFeedback({ tone: "error", text: t("feedback.required") });
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await authClient.signIn.email({
          email: trimmedEmail,
          password: trimmedPassword,
          rememberMe: true,
        });

        if (result.error) {
          const status = result.error.status;

          if (status === 400 || status === 401) {
            setFeedback({ tone: "error", text: t("feedback.invalid") });
          } else {
            setFeedback({ tone: "error", text: t("feedback.error") });
          }

          return;
        }

        resetFields();
        setFeedback({ tone: "success", text: t("feedback.success") });
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[login] Sign-in request failed", error);
        }
        setFeedback({ tone: "error", text: t("feedback.error") });
      }
    });
  };

  const handleSignOut = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await authClient.signOut();

        if (result.error) {
          setFeedback({ tone: "error", text: t("feedback.signOutError") });
          return;
        }

        setFeedback({ tone: "success", text: t("feedback.signOutSuccess") });
        router.refresh();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[login] Sign-out request failed", error);
        }
        setFeedback({ tone: "error", text: t("feedback.signOutError") });
      }
    });
  };

  const handleOwnerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isOwnerPending || ownerState?.ownerExists) {
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = ownerEmail.trim();
    const trimmedPassword = ownerPassword.trim();

    if (
      trimmedFirstName.length === 0 ||
      trimmedLastName.length === 0 ||
      trimmedEmail.length === 0 ||
      trimmedPassword.length === 0
    ) {
      setOwnerFeedback({ tone: "error", text: t("owner.feedback.required") });
      return;
    }

    setOwnerFeedback(null);

    startOwnerTransition(async () => {
      try {
        const response = await fetch(ownerBootstrapEndpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            email: trimmedEmail,
            password: trimmedPassword,
          }),
        });

        if (!response.ok) {
          if (response.status === 409) {
            setOwnerFeedback({ tone: "error", text: t("owner.feedback.exists") });
            setOwnerState({ ownerExists: true });
            return;
          }

          const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
          const message = errorPayload?.error ?? t("owner.feedback.error");
          setOwnerFeedback({ tone: "error", text: message });
          return;
        }

        resetOwnerFields();
        setOwnerFeedback({ tone: "success", text: t("owner.feedback.success") });
        setOwnerState({ ownerExists: true });
        router.push("/dashboard");
        router.refresh();
      } catch {
        setOwnerFeedback({ tone: "error", text: t("owner.feedback.error") });
      }
    });
  };

  const heading = isAuthenticated ? t("titleAuthenticated") : t("title");

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-8 rounded-[32px] border border-neutral-200/70 bg-white/80 p-8 text-neutral-900 shadow-xl backdrop-blur-md transition dark:border-neutral-800/70 dark:bg-neutral-900/70 dark:text-neutral-100">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-500/80">{t("accent")}</p>
        <h1 className="text-3xl font-semibold">{heading}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("description")}</p>
        {showOwnerStatusLoader ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">
            {tCommon("loading")}
          </p>
        ) : null}
      </div>

      {feedback ? (
        <div
          className={`w-full rounded-2xl border p-3 text-sm ${
            feedback.tone === "error"
              ? "border-red-300/60 bg-red-50/80 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
              : "border-emerald-300/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      {!isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
          {ownerUnavailable ? (
            <p className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
              {t("owner.locked")}
            </p>
          ) : null}
          <label className="flex flex-col gap-2 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
              {t("fields.email.label")}
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("fields.email.placeholder")}
              className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
              disabled={isSignInDisabled}
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
              {t("fields.password.label")}
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("fields.password.placeholder")}
              className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
              disabled={isSignInDisabled}
              required
            />
          </label>

          <Button type="submit" disabled={isSignInDisabled}>
            {isPending ? t("actions.submitting") : t("actions.submit")}
          </Button>
        </form>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("signedInDescription")}</p>
          <Button onClick={handleSignOut} disabled={isPending}>
            {isPending ? t("actions.signingOut") : t("actions.signOut")}
          </Button>
        </div>
      )}

      {shouldShowOwnerForm ? (
        <div className="w-full rounded-2xl border border-neutral-200/70 bg-white/70 p-6 text-left dark:border-neutral-800/60 dark:bg-neutral-900/60">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
              {t("owner.accent")}
            </p>
            <h2 className="text-2xl font-semibold">{t("owner.title")}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("owner.description")}</p>
          </div>

          {ownerFeedback ? (
            <div
              className={`mt-4 w-full rounded-2xl border p-3 text-sm ${
                ownerFeedback.tone === "error"
                  ? "border-red-300/60 bg-red-50/80 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
                  : "border-emerald-300/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
              }`}
            >
              {ownerFeedback.text}
            </div>
          ) : null}

          <form onSubmit={handleOwnerSubmit} className="mt-6 grid w-full gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
                {t("owner.fields.firstName.label")}
              </span>
              <input
                type="text"
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder={t("owner.fields.firstName.placeholder")}
                className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
                disabled={isOwnerPending}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
                {t("owner.fields.lastName.label")}
              </span>
              <input
                type="text"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder={t("owner.fields.lastName.placeholder")}
                className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
                disabled={isOwnerPending}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-left md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
                {t("owner.fields.email.label")}
              </span>
              <input
                type="email"
                name="ownerEmail"
                autoComplete="email"
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                placeholder={t("owner.fields.email.placeholder")}
                className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
                disabled={isOwnerPending}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-left md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
                {t("owner.fields.password.label")}
              </span>
              <input
                type="password"
                name="ownerPassword"
                autoComplete="new-password"
                value={ownerPassword}
                onChange={(event) => setOwnerPassword(event.target.value)}
                placeholder={t("owner.fields.password.placeholder")}
                className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
                disabled={isOwnerPending}
                required
              />
            </label>

            <div className="md:col-span-2">
              <Button type="submit" disabled={isOwnerPending} className="w-full">
                {isOwnerPending ? t("owner.actions.submitting") : t("owner.actions.submit")}
              </Button>
            </div>
          </form>

          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">{t("owner.ctaSignInLocked")}</p>
        </div>
      ) : null}
    </div>
  );
}




