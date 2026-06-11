import type { Metadata } from "next";

import { VaultPageContent } from "@/components/pages/vault-page";

export const metadata: Metadata = {
  title: "Vault | Skeptic Systems",
  description: "Utilities, converters, and AI skills.",
};

export default function VaultPage() {
  return <VaultPageContent />;
}