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
  title: "$GNOME Runner",
  description: "Dodge Bears. Survive Rugs. Stack $GNOME.",
  openGraph: {
    title: "$GNOME Runner",
    description: "Dodge Bears. Survive Rugs. Stack $GNOME.",
    url: "https://chaosgnome.xyz",
    siteName: "Gnome Runner",
    images: [
      {
        url: "https://chaosgnome.xyz/assets/gnome-rocket.png",
        width: 1200,
        height: 630,
        alt: "Gnome Rocket Meme",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "$GNOME Runner",
    description: "Dodge Bears. Survive Rugs. Stack $GNOME.",
    images: ["https://chaosgnome.xyz/assets/gnome-rocket.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "$GNOME Runner",
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
