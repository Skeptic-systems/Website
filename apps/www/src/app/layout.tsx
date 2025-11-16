import type { Metadata } from "next";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { PathNormalizer } from "@/components/path-normalizer";
import { ScrollReset } from "@/components/scroll-reset";
import { Topbar } from "@/components/topbar";
import { IntlProvider } from "@/components/intl-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Website",
  description: "Modern website",
  icons: {
    icon: "/asstes/favicon.ico",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const accept = (await headers()).get("accept-language")?.toLowerCase() || "";
  const locale = accept.startsWith("de") ? "de" : "en";
  const messages = (await import(`@/locals/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <IntlProvider defaultLocale={locale} defaultMessages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <PathNormalizer />
            <ScrollReset />
            <Topbar />
            {children}
          </ThemeProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
