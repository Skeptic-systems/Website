import { Hero } from "@/components/hero";
import { SrSections } from "@/components/sr-sections";

export default function HomePage() {
  return (
    <main className="w-full">
      <Hero />
      <section id="about" className="relative w-full">
        <div className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-screen">
          <div className="absolute -top-px left-0 right-0 bottom-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="relative z-10 flex h-full items-center justify-center px-0" />
        </div>
      </section>
      <SrSections />
    </main>
  );
}
