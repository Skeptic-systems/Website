import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const _t = await getTranslations("common");

  return (
    <main className="container mx-auto px-4">
      <Hero />
      <section id="about" className="sr-only">
        About section placeholder
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
