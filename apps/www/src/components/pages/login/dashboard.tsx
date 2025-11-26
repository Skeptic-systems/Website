"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowCircleDown, ChartLineUp, Gauge, GearSix, TerminalWindow } from "phosphor-react";

import { Button } from "@/components/ui/button";
import { apiBaseUrl } from "@/lib/api";
import { authClient } from "@/lib/auth/client";
import type { AuthenticatedProfile } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

import { DashboardDownloadsSection } from "./dashboard-downloads";
import { DashboardMetricsSection } from "./dashboard-metrics";
import { DashboardOverviewSection } from "./dashboard-overview";
import { DashboardSettingsSection } from "./dashboard-settings";
import { DashboardTerminalSection } from "./dashboard-terminal";
import type {
  CreateUserInput,
  DashboardSection,
  FeedbackState,
  ProfileResponse,
  ReportReason,
  SidebarItem,
  TerminalFormState,
  TerminalMessage,
  TerminalMessagesResponse,
  UserListResponse,
} from "@/components/login/dashboard-types";

const profileEndpoint = `${apiBaseUrl}/auth/me`;
const usersEndpoint = `${apiBaseUrl}/auth/users`;
const terminalAdminEndpoint = `${apiBaseUrl}/terminal/admin/messages`;

async function fetchAuthedJson<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    const message = payload?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

type DashboardPageProps = {
  initialProfile: AuthenticatedProfile;
};

export function DashboardPage({ initialProfile }: DashboardPageProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const reportReasonLabels = useMemo(() => {
    return t.raw("terminal.reports.reasons") as Record<ReportReason, string>;
  }, [t]);
  const router = useRouter();
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const [isSigningOut, startSignOut] = useTransition();
  const isAuthenticated = Boolean(session.data?.user) || Boolean(initialProfile);

  const [editingMessage, setEditingMessage] = useState<TerminalMessage | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [terminalForm, setTerminalForm] = useState<TerminalFormState>({
    textDefault: "",
    textEn: "",
    textDe: "",
  });
  const [terminalFeedback, setTerminalFeedback] = useState<FeedbackState>(null);
  const [userFeedback, setUserFeedback] = useState<FeedbackState>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<CreateUserInput>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "member",
  });
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");

  const handleTerminalFormChange = (field: keyof TerminalFormState, value: string) => {
    setTerminalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUserFormChange = (field: keyof CreateUserInput, value: string) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDashboardSignOut = () => {
    setSignOutError(null);
    startSignOut(async () => {
      const result = await authClient.signOut();

      if (result.error) {
        setSignOutError(t("actions.signOutError"));
        return;
      }

      router.push("/login");
      router.refresh();
    });
  };

  const profileQuery = useQuery({
    queryKey: ["dashboard", "profile"],
    queryFn: async () => fetchAuthedJson<ProfileResponse>(profileEndpoint),
    enabled: isAuthenticated,
    retry: 1,
    initialData: initialProfile ? { user: initialProfile } : undefined,
  });

  const canAdministrate = useMemo(() => {
    const role = profileQuery.data?.user.role;
    return role === "owner" || role === "admin";
  }, [profileQuery.data]);

  const navigationItems = useMemo<SidebarItem[]>(() => {
    return [
      {
        id: "overview",
        icon: Gauge,
        label: t("nav.labels.overview"),
        description: t("nav.descriptions.overview"),
      },
      {
        id: "terminal",
        icon: TerminalWindow,
        label: t("nav.labels.terminal"),
        description: t("nav.descriptions.terminal"),
      },
      {
        id: "metrics",
        icon: ChartLineUp,
        label: t("nav.labels.metrics"),
        description: t("nav.descriptions.metrics"),
      },
      {
        id: "downloads",
        icon: ArrowCircleDown,
        label: t("nav.labels.downloads"),
        description: t("nav.descriptions.downloads"),
      },
    ];
  }, [t]);

  const settingsEntry = useMemo(
    () => ({
      id: "settings",
      icon: GearSix,
      label: t("nav.settings.label"),
      description: t("nav.settings.description"),
    }),
    [t],
  );

  useEffect(() => {
    if (!canAdministrate && activeSection === "settings") {
      setActiveSection("overview");
    }
  }, [activeSection, canAdministrate]);

  const terminalMessagesQuery = useQuery({
    queryKey: ["dashboard", "terminal-messages"],
    queryFn: async () =>
      fetchAuthedJson<TerminalMessagesResponse>(`${terminalAdminEndpoint}?limit=100`),
    enabled: isAuthenticated && canAdministrate,
    retry: 1,
  });

  const usersQuery = useQuery({
    queryKey: ["dashboard", "users"],
    queryFn: async () => fetchAuthedJson<UserListResponse>(usersEndpoint),
    enabled: isAuthenticated && canAdministrate,
    retry: 1,
  });

  const updateMessageMutation = useMutation({
    mutationFn: async (input: { id: string; payload: typeof terminalForm }) => {
      const result = await fetchAuthedJson<{ message: TerminalMessage }>(
        `${terminalAdminEndpoint}/${input.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(input.payload),
        },
      );
      return result.message;
    },
    onSuccess: async () => {
      setTerminalFeedback({ tone: "success", text: t("terminal.feedback.updated") });
      setEditingMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "terminal-messages"] });
    },
    onError: (error: Error) => {
      setTerminalFeedback({
        tone: "error",
        text: error.message || t("terminal.feedback.error"),
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await fetchAuthedJson<{ deleted: boolean }>(`${terminalAdminEndpoint}/${messageId}`, {
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      setTerminalFeedback({ tone: "success", text: t("terminal.feedback.deleted") });
      if (editingMessage) {
        setEditingMessage(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "terminal-messages"] });
    },
    onError: (error: Error) => {
      setTerminalFeedback({
        tone: "error",
        text: error.message || t("terminal.feedback.error"),
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      await fetchAuthedJson<{ user: AuthenticatedProfile }>(usersEndpoint, {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: async () => {
      setUserFeedback({ tone: "success", text: t("users.feedback.created") });
      setUserForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "member",
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "users"] });
    },
    onError: (error: Error) => {
      setUserFeedback({
        tone: "error",
        text: error.message || t("users.feedback.error"),
      });
    },
  });

  const handleUserFormSubmit = () => {
    setUserFeedback(null);
    createUserMutation.mutate(userForm);
  };

  const handleEditStart = (message: TerminalMessage) => {
    setEditingMessage(message);
    setTerminalForm({
      textDefault: message.textDefault,
      textEn: message.textEn,
      textDe: message.textDe,
    });
    setTerminalFeedback(null);
  };

  const handleTerminalSubmit = () => {
    if (!editingMessage) {
      return;
    }

    updateMessageMutation.mutate({
      id: editingMessage.id,
      payload: terminalForm,
    });
  };

  const handleEditCancel = () => {
    setEditingMessage(null);
  };

  const handleTerminalDeleteRequest = (messageId: string) => {
    setTerminalFeedback(null);
    setPendingDeleteId((current) => (current === messageId ? null : messageId));
  };

  const handleTerminalDeleteConfirm = (messageId: string) => {
    deleteMessageMutation.mutate(messageId, {
      onSettled: () => {
        setPendingDeleteId((current) => (current === messageId ? null : current));
      },
    });
  };

  const handleTerminalDeleteCancel = () => {
    setPendingDeleteId(null);
  };

  const terminalMessagesState = {
    isLoading: terminalMessagesQuery.isLoading,
    isError: terminalMessagesQuery.isError,
    isFetching: terminalMessagesQuery.isFetching,
    refetch: () => terminalMessagesQuery.refetch(),
    items: terminalMessagesQuery.data?.items ?? [],
  };

  const usersState = {
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    isFetching: usersQuery.isFetching,
    refetch: () => usersQuery.refetch(),
    users: usersQuery.data?.users ?? [],
  };

  const renderActiveSection = () => {
    if (activeSection === "overview") {
      return (
        <DashboardOverviewSection
          userName={profileQuery.data?.user.name}
          onSignOut={handleDashboardSignOut}
          isSigningOut={isSigningOut}
          signOutError={signOutError}
        />
      );
    }

    if (activeSection === "terminal") {
      return (
        <DashboardTerminalSection
          canAdministrate={canAdministrate}
          editingMessage={editingMessage}
          terminalForm={terminalForm}
          onTerminalFormChange={handleTerminalFormChange}
          onTerminalSubmit={handleTerminalSubmit}
          onCancelEdit={handleEditCancel}
          onEditStart={handleEditStart}
          terminalFeedback={terminalFeedback}
          messagesState={terminalMessagesState}
          pendingDeleteId={pendingDeleteId}
          onDeleteRequest={handleTerminalDeleteRequest}
          onDeleteConfirm={handleTerminalDeleteConfirm}
          onDeleteCancel={handleTerminalDeleteCancel}
          updatePending={updateMessageMutation.isPending}
          deletePending={deleteMessageMutation.isPending}
          reportReasonLabels={reportReasonLabels}
          formatTimestamp={formatTimestamp}
        />
      );
    }

    if (activeSection === "settings") {
      return (
        <DashboardSettingsSection
          canAdministrate={canAdministrate}
          userFeedback={userFeedback}
          userForm={userForm}
          onUserFormChange={handleUserFormChange}
          onUserFormSubmit={handleUserFormSubmit}
          isSubmitting={createUserMutation.isPending}
          usersState={usersState}
          formatTimestamp={formatTimestamp}
        />
      );
    }

    if (activeSection === "metrics") {
      return <DashboardMetricsSection />;
    }

    if (activeSection === "downloads") {
      return <DashboardDownloadsSection />;
    }

    return null;
  };

  const renderContent = () => {
    if (session.isPending || profileQuery.isLoading) {
      return <p className="text-sm text-neutral-500">{tCommon("loading")}</p>;
    }

    if (!isAuthenticated) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-500">{t("access.unauthorized")}</p>
          <Button type="button" onClick={() => router.push("/login")}>
            {t("access.actions.login")}
          </Button>
        </div>
      );
    }

    if (profileQuery.isError) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-500">{t("access.error")}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => profileQuery.refetch()}
            disabled={profileQuery.isFetching}
          >
            {t("access.actions.retry")}
          </Button>
        </div>
      );
    }

    const SettingsIcon = settingsEntry.icon;

    return (
      <div className="flex flex-col gap-8 lg:gap-10 xl:grid xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start xl:gap-16">
        <aside className="w-full">
          <div className="flex h-full flex-col gap-4 rounded-[44px] border border-white/10 bg-white/80 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/5 dark:bg-neutral-900/80">
            <div className="space-y-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-3xl border px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950",
                      isActive
                        ? "border-[hsl(var(--accent))] bg-white/95 text-neutral-900 shadow-[0_25px_60px_hsl(var(--accent)_/_0.18)] dark:bg-neutral-900 dark:text-white"
                        : "border-transparent bg-white/30 text-neutral-600 hover:border-[hsl(var(--accent)_/_0.6)] hover:bg-white/70 dark:bg-neutral-900/40 dark:text-neutral-300 dark:hover:border-[hsl(var(--accent)_/_0.4)] dark:hover:bg-neutral-900/70"
                    )}
                    aria-pressed={isActive}
                  >
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl border text-base transition",
                        isActive
                          ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)_/_0.15)] text-[hsl(var(--accent))]"
                          : "border-white/40 bg-white/60 text-[hsl(var(--accent))] opacity-80 dark:border-white/10 dark:bg-neutral-900/50"
                      )}
                    >
                      <Icon size={22} weight={isActive ? "fill" : "regular"} aria-hidden />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {canAdministrate ? (
              <div className="mt-auto flex justify-start">
                <button
                  type="button"
                  onClick={() => setActiveSection("settings")}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl border text-[hsl(var(--accent))] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950",
                    activeSection === "settings"
                      ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent)_/_0.18)] text-[hsl(var(--accent))]"
                      : "border-white/30 bg-white/40 hover:border-[hsl(var(--accent)_/_0.7)] hover:bg-white/70 dark:border-white/10 dark:bg-neutral-900/40"
                  )}
                  aria-pressed={activeSection === "settings"}
                  aria-label={settingsEntry.label}
                  title={settingsEntry.description}
                >
                  <SettingsIcon size={24} weight={activeSection === "settings" ? "fill" : "regular"} aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        </aside>
        <div className="flex-1">{renderActiveSection()}</div>
      </div>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 [background-size:32px_32px] [background-image:radial-gradient(#e5e7eb_1px,transparent_1px)] dark:[background-image:radial-gradient(#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 sm:py-20 xl:max-w-[92rem]">
        {renderContent()}
      </div>
    </main>
  );
}



