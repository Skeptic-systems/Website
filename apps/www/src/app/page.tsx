import { Hero } from "@/components/pages/hero";
import { SrSections } from "@/components/sr-sections";
import { AboutMe } from "@/components/pages/aboutme";
import { Activity } from "@/components/pages/activity";
import { Selfhosted } from "@/components/pages/selfhosted";
import { Projects } from "@/components/pages/projects";

export default function HomePage() {
  return (
    <main className="w-full">
      <Hero />
      <AboutMe />
      <Activity />
      <Selfhosted />
      <Projects />
      <SrSections />
    </main>
  );
}
