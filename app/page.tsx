import { Metadata } from 'next';
import Game from '../components/Game';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const ogParam = sp?.og;
  
  // Default to og-1.png if invalid or missing
  const safeOgId = ['1', '2', '3'].includes(String(ogParam)) ? String(ogParam) : '1';
  const ogImage = `https://chaosgnome.xyz/assets/og-${safeOgId}.png`;

  return {
    title: "$GNOME Runner",
    description: "Dodge Bears. Survive Rugs. Stack $GNOME.",
    openGraph: {
      title: "$GNOME Runner",
      description: "Dodge Bears. Survive Rugs. Stack $GNOME.",
      url: "https://chaosgnome.xyz",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "$GNOME Runner - The Game",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "$GNOME Runner",
      description: "Dodge Bears. Survive Rugs. Stack $GNOME.",
      images: [ogImage],
    },
  };
}

export default function Home() {
  return <Game />;
}
