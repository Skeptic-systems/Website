import type { Metadata } from "next";

import { VaultPageContent } from "@/components/pages/vault-page";

export const metadata: Metadata = {
  title: "Vault | Skeptic Systems",
  description: "Secure utilities, converters, and AI skills in one curated workspace.",
};

export default function VaultPage() {
  return <VaultPageContent />;
}