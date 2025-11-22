import type { Metadata } from "next";
import { headers } from "next/headers";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PathNormalizer } from "@/components/path-normalizer";
import { ScrollReset } from "@/components/scroll-reset";
import { Topbar } from "@/components/topbar";
import { IntlProvider } from "@/components/intl-provider";
import { TanstackDevtools } from "@/components/tanstack-devtools";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = headers();
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host");
  const protocol =
    forwardedProto ?? (host && host.startsWith("localhost") ? "http" : "https");
  const envBase = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = host ? `${protocol ?? "https"}://${host}` : envBase;

  return buildMetadata(baseUrl);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = headers();
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
