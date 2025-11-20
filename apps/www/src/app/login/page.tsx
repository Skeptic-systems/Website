import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | Skeptic Systems",
  description: "Access your Skeptic Systems session with email and password.",
};

export default function LoginPage() {
  return (
    <main className="relative w-full py-24">
      <div className="absolute inset-0 [background-size:32px_32px] [background-image:radial-gradient(#e5e7eb_1px,transparent_1px)] dark:[background-image:radial-gradient(#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6">
        <LoginForm />
      </div>
    </main>
  );
}


