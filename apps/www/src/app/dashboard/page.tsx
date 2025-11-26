import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardPage } from "@/components/pages/login/dashboard";
import { readServerProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard | Skeptic Systems",
  description: "Moderate terminal messages and manage private access.",
};

export default async function DashboardRoute() {
  const profile = await readServerProfile();

  if (!profile) {
    redirect("/login");
  }

  return <DashboardPage initialProfile={profile} />;
}



