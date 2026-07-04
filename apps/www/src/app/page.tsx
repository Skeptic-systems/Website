import { Hero } from "@/components/pages/hero";
import { SrSections } from "@/components/accessibility/sr-sections";
import { AboutMe } from "@/components/pages/aboutme";
import { Activity } from "@/components/pages/activity";
import { Terminal } from "@/components/pages/terminal";
import { Tools } from "@/components/pages/tools";
import { VaultHighlight } from "@/components/pages/vault-highlight";
import { Projects } from "@/components/pages/projects";
import { Selfhosted } from "@/components/pages/selfhosted";
import { Footer } from "@/components/layout/footer";
import { StarField } from "@/components/ui/star-field";
import { OnboardingHints } from "@/components/ui/onboarding-hints";
export default function HomePage() {
  return (
    <main className="w-full">
      <StarField />
      <OnboardingHints />
      <Hero />
      <AboutMe />
      <Activity />
      <Terminal />
      <Tools />
      <VaultHighlight />
      <Projects />
      <Selfhosted />
      <Footer />
      <SrSections />
    </main>
  );
}
