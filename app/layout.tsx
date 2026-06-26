import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gnomad Wall of Shame",
  description: "Exposing crypto scams, fake KOLs, and toxic projects. The Gnomad community stands strong against toxic soil.",
  openGraph: {
    title: "🚨 Gnomad Wall of Shame",
    description: "Exposing crypto scams, fake KOLs, and toxic projects. The Gnomad community stands strong against toxic soil.",
    url: "https://chaosgnome.xyz",
    siteName: "Gnomad Wall of Shame",
    images: [
      {
        url: "https://chaosgnome.xyz/assets/og-1.png",
        width: 1200,
        height: 630,
        alt: "Gnomad Wall of Shame",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🚨 Gnomad Wall of Shame",
    description: "Exposing crypto scams, fake KOLs, and toxic projects. The Gnomad community stands strong against toxic soil.",
    images: ["https://chaosgnome.xyz/assets/og-1.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wall of Shame",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
