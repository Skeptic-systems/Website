import localFont from "next/font/local";

export const geist = localFont({
  src: [
    { path: "../../public/font/Geist/Geist-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/font/Geist/Geist-Bold.ttf", weight: "700", style: "normal" }
  ],
  display: "swap",
});


