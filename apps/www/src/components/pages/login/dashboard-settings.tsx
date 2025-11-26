"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { DashboardFeedback } from "./dashboard-feedback";
import type { AuthenticatedProfile } from "@/lib/auth/types";
import type { CreateUserInput, FeedbackState } from "@/components/login/dashboard-types";

type UsersState = {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  users: AuthenticatedProfile[];
  refetch: () => Promise<unknown>;
};

type DashboardSettingsSectionProps = {
  canAdministrate: boolean;
  userFeedback: FeedbackState;
  userForm: CreateUserInput;
  onUserFormChange: (field: keyof CreateUserInput, value: string) => void;
  onUserFormSubmit: () => void;
  isSubmitting: boolean;
  usersState: UsersState;
  formatTimestamp: (value: string) => string;
};

export function DashboardSettingsSection({
  canAdministrate,
  userFeedback,
  userForm,
  onUserFormChange,
  onUserFormSubmit,
  isSubmitting,
  usersState,
  formatTimestamp,
}: DashboardSettingsSectionProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onUserFormSubmit();
  };

  const renderUserList = () => {
    if (usersState.isLoading) {
      return <p className="text-sm text-neutral-500">{tCommon("loading")}</p>;
    }

    if (usersState.isError) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-500">{t("users.list.error")}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => usersState.refetch()}
            disabled={usersState.isFetching}
          >
            {usersState.isFetching ? t("users.form.submitting") : t("users.actions.refresh")}
          </Button>
        </div>
      );
    }

    if (usersState.users.length === 0) {
      return <p className="text-sm text-neutral-500">{t("users.list.empty")}</p>;
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
          <thead className="bg-neutral-50 dark:bg-neutral-900/40">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
                {t("users.list.columns.name")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
                {t("users.list.columns.email")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
                {t("users.list.columns.role")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500 dark:text-neutral-400">
                {t("users.list.columns.created")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {usersState.users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-sm">{user.name}</td>
                <td className="px-4 py-3 text-sm">{user.email}</td>
                <td className="px-4 py-3 text-sm capitalize">{t(`users.form.roles.${user.role}`)}</td>
                <td className="px-4 py-3 text-sm">{formatTimestamp(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="rounded-[32px] border border-neutral-200/70 bg-white/90 p-8 shadow-xl backdrop-blur-lg transition dark:border-neutral-800/70 dark:bg-neutral-900/80">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--accent))] opacity-90">
            {t("users.accent")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{t("users.title")}</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{t("users.description")}</p>
        </div>
        {canAdministrate ? (
          <>
            <DashboardFeedback feedback={userFeedback} />
            <form
              className="grid gap-4 rounded-2xl border border-neutral-200/70 bg-white/60 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/50 md:grid-cols-2"
              onSubmit={handleSubmit}
            >
              {(["firstName", "lastName", "email", "password"] as const).map((field, index) => (
                <label key={field} className={`flex flex-col gap-2 text-left ${index < 2 ? "" : "md:col-span-2"}`}>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                    {t(`users.form.${field}`)}
                  </span>
                  <input
                    type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                    value={userForm[field]}
                    onChange={(event) => onUserFormChange(field, event.target.value)}
                    className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
                    required
                  />
                </label>
              ))}

              <label className="flex flex-col gap-2 text-left">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
                  {t("users.form.role")}
                </span>
                <select
                  value={userForm.role}
                  onChange={(event) => onUserFormChange("role", event.target.value)}
                  className="w-full rounded-2xl border border-neutral-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30"
                >
                  <option value="admin">{t("users.form.roles.admin")}</option>
                  <option value="member">{t("users.form.roles.member")}</option>
                </select>
              </label>

              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("users.form.submitting") : t("users.form.submit")}
                </Button>
              </div>
            </form>
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-semibold">{t("users.list.heading")}</h3>
              {renderUserList()}
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("access.forbidden")}</p>
        )}
      </div>
    </section>
  );
}

