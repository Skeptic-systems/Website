import type { Metadata } from "next";

import { PrivacyPolicyPage } from "@/components/pages/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Skeptic Systems",
  description: "Details on data processing, technical storage, and moderation for this website.",
};

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}

