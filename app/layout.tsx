import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Head } from "nextra/components";
import { JsonLd } from "@/components/JsonLd";
import { PageTransition } from "@/components/ui/motion";
import "nextra-theme-docs/style.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://docs.nanocollective.org"),
  title: "Nano Collective Docs",
  description: "Official documentation for Nano Collective projects",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Nano Collective Docs",
    description: "Official documentation for Nano Collective projects",
    url: "https://docs.nanocollective.org",
    siteName: "Nano Collective",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 750,
        alt: "Nano Collective",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nano Collective Docs",
    description: "Official documentation for Nano Collective projects",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <Head />
      <body className="antialiased">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Nano Collective Docs",
            url: "https://docs.nanocollective.org",
            publisher: {
              "@type": "Organization",
              name: "Nano Collective",
              url: "https://nanocollective.org",
            },
          }}
        />
        {/*
          Fade the page in on mount. This MUST use `animate` (fires on mount
          regardless of scroll position), not `whileInView`. `SectionReveal`
          used `whileInView` with `viewport={{ amount: 0.15 }}`, which requires
          15% of the wrapped element to be visible before it fades in. On a
          long page (e.g. a whitepaper ~19,000px tall) 15% never fits in the
          viewport, so the animation never fired and the whole page stayed at
          opacity:0 — a blank white screen on hard refresh. `PageTransition`
          animates on mount and is height-independent.
        */}
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
