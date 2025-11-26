import type { Metadata } from "next";

import { LoginBackLink } from "@/components/auth/login-back-link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | Skeptic Systems",
  description: "Access your Skeptic Systems session with email and password.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 [background-size:32px_32px] [background-image:radial-gradient(#e5e7eb_1px,transparent_1px)] dark:[background-image:radial-gradient(#262626_1px,transparent_1px)]" />
      <div className="accent-glow-layer-right" />
      <div className="accent-glow-layer-left-lower" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black)]" />

      <div className="relative z-10 flex min-h-screen w-full items-start justify-center px-6 py-16 sm:px-8 sm:py-24 lg:py-20">
        <div className="mt-12 w-full max-w-lg space-y-8 sm:mt-16 lg:mt-24">
          <div className="flex justify-start">
            <LoginBackLink />
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}




