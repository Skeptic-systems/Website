import { Hero } from "@/components/pages/hero";
import { SrSections } from "@/components/sr-sections";
import { AboutMe } from "@/components/pages/aboutme";

export default function HomePage() {
  return (
    <main className="w-full">
      <Hero />
      <AboutMe />
      <SrSections />
    </main>
  );
}
