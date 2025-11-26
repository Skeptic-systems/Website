import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react";

import type { AuthenticatedProfile } from "@/lib/auth/types";

export type ProfileResponse = {
  user: AuthenticatedProfile;
};

export type ReportReason = "personal_information" | "hate_speech" | "other";

export type TerminalMessageReport = {
  id: string;
  reason: ReportReason;
  description: string;
  createdAt: string;
  sessionId: string;
};

export type TerminalMessage = {
  id: string;
  sessionId: string;
  textDefault: string;
  textEn: string;
  textDe: string;
  createdAt: string;
  reportCount: number;
  reports: TerminalMessageReport[];
};

export type TerminalMessagesResponse = {
  items: TerminalMessage[];
};

export type UserListResponse = {
  users: AuthenticatedProfile[];
};

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "admin" | "member";
};

export type FeedbackState = {
  tone: "success" | "error";
  text: string;
} | null;

export type DashboardSection = "overview" | "terminal" | "metrics" | "downloads" | "settings";

export type SidebarItem = {
  id: Exclude<DashboardSection, "settings">;
  icon: ComponentType<IconProps>;
  label: string;
  description: string;
};

export type TerminalFormState = {
  textDefault: string;
  textEn: string;
  textDe: string;
};

