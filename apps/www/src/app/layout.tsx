import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website",
  description: "Modern website",
  icons: {
    icon: "/asstes/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-screen bg-black text-white antialiased">{children}</body>
    </html>
  );
}
