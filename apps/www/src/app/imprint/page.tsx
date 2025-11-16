import type { Metadata } from "next";

import { ImprintPageContent } from "@/components/pages/imprint-page";

export const metadata: Metadata = {
  title: "Imprint | Skeptic Systems",
  description: "Legal disclosure for the Skeptic Systems portfolio website.",
};

export default function ImprintPage() {
  return <ImprintPageContent />;
}

