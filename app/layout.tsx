import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Head } from "nextra/components";
import { JsonLd } from "@/components/JsonLd";
import { SectionReveal } from "@/components/ui/motion";
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
        <SectionReveal>
          {children}
        </SectionReveal>
      </body>
    </html>
  );
}
