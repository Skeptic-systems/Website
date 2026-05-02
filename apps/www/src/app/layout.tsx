import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PathNormalizer } from "@/components/providers/path-normalizer";
import { ScrollReset } from "@/components/providers/scroll-reset";
import { Topbar } from "@/components/layout/topbar";
import { IntlProvider } from "@/components/providers/intl-provider";
import { TanstackDevtools } from "@/components/providers/tanstack-devtools";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const forwardedProto = headerList.get("x-forwarded-proto") ?? undefined;
  const forwardedHost = headerList.get("x-forwarded-host") ?? undefined;
  const host = forwardedHost ?? headerList.get("host") ?? undefined;
  const protocol = forwardedProto ?? (host?.startsWith("localhost") ? "http" : "https");
  const envBase = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = host ? `${protocol ?? "https"}://${host}` : envBase;

  return buildMetadata(baseUrl);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const accept = headerList.get("accept-language")?.toLowerCase() || "";
  const locale = accept.startsWith("de") ? "de" : "en";
  const messages = (await import(`@/locals/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <IntlProvider defaultLocale={locale} defaultMessages={messages}>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              <PathNormalizer />
              <ScrollReset />
              <Topbar />
              {children}
              <TanstackDevtools />
            </ThemeProvider>
          </QueryProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
