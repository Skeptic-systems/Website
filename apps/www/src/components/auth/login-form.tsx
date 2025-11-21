"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

type FeedbackState = {
  tone: "error" | "success";
  text: string;
};

export function LoginForm() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const session = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAuthenticated = Boolean(session.data?.user);
  const isDisabled = isPending || session.isPending;

  const resetFields = () => {
    setEmail("");
    setPassword("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isDisabled) {
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
      router.push("/");
      router.refresh();
    });
  };

  const handleSignOut = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await authClient.signOut();

      if (result.error) {
        setFeedback({ tone: "error", text: t("feedback.signOutError") });
        return;
      }

      setFeedback({ tone: "success", text: t("feedback.signOutSuccess") });
      router.refresh();
    });
  };

  const heading = isAuthenticated ? t("titleAuthenticated") : t("title");

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-8 rounded-[32px] border border-neutral-200/70 bg-white/80 p-8 text-neutral-900 shadow-xl backdrop-blur-md transition dark:border-neutral-800/70 dark:bg-neutral-900/70 dark:text-neutral-100">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-500/80">{t("accent")}</p>
        <h1 className="text-3xl font-semibold">{heading}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{t("description")}</p>
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
              disabled={isDisabled}
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
              disabled={isDisabled}
              required
            />
          </label>

          <Button type="submit" disabled={isDisabled}>
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
    </div>
  );
}




