import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "MADNESS | Themed restaurant in the UAE",
    template: "%s | MADNESS",
  },
  description: "Bold plates, masked chefs and neon everywhere. Explore the MADNESS menu, find a branch and order online.",
  applicationName: "MADNESS",
  openGraph: {
    type: "website",
    siteName: "MADNESS",
    locale: siteConfig.locale,
    images: [{ url: siteConfig.defaultOgImage, alt: "Villain mural above red leather booths inside MADNESS" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#101010",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" data-accent="coral" className={`${bebas.variable} ${manrope.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
