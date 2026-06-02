import { notFound } from "next/navigation";

import { VaultToolPageContent } from "@/components/pages/vault-tool-page";
import { getVaultToolBySlug, normalizeVaultSlug } from "@/lib/vault";

export default async function VaultToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getVaultToolBySlug(normalizeVaultSlug(slug));

  if (!tool) {
    notFound();
  }

  return <VaultToolPageContent tool={tool} />;
}
