"use client";

export function Hero() {
  return (
    <section className="relative w-full min-h-[70vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="absolute inset-0 [background-size:20px_20px] [background-image:radial-gradient(#d4d4d4_1px,transparent_1px)] dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="relative z-10 w-full px-6 sm:px-8"></div>
    </section>
  );
}
