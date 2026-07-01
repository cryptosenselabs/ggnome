import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "$GNOME — Crypto Crime Awareness",
  description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
  openGraph: {
    title: "$GNOME — Crypto Crime Awareness",
    description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
    url: "https://chaosgnome.xyz",
    siteName: "$GNOME",
    images: [
      {
        url: "https://chaosgnome.xyz/assets/og-1.png",
        width: 1200,
        height: 630,
        alt: "$GNOME — Crypto Crime Awareness",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "$GNOME — Crypto Crime Awareness",
    description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
    images: ["https://chaosgnome.xyz/assets/og-1.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "$GNOME",
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
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
        <Navbar />
        <div className="max-w-5xl mx-auto relative z-10 w-full flex-1 flex flex-col px-4 md:px-8 pb-16">
          <main className="flex-1 flex flex-col mt-8">
            {children}
          </main>
          <footer className="mt-24 text-center text-foreground/70 pb-10 border-t border-border-subtle pt-10 w-full">
            <p className="mb-4 text-sm">Want to report a scam? Join our Telegram and type <code className="bg-background text-primary px-2 py-1 rounded font-mono border border-border-subtle">/report [URL] [Evidence]</code>.</p>
            <div className="max-w-4xl mx-auto px-4 text-xs text-foreground/50 leading-relaxed">
              $GNOME and WhaleScanner provide community and wallet-intelligence information only. Nothing on this website is financial advice, investment advice, or a promise of future price performance. Always do your own research.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
