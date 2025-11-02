import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="w-full">
      <Hero />
      <section id="about" className="relative w-full">
        <div className="pointer-events-none absolute -top-8 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent dark:from-black dark:to-transparent" />
        <div className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-screen">
          <div className="absolute inset-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="relative z-10 flex h-full items-center justify-center px-0" />
        </div>
      </section>
      <section id="features" className="sr-only">
        Features section placeholder
      </section>
      <section id="contact" className="sr-only">
        Contact section placeholder
      </section>
    </main>
  );
}
