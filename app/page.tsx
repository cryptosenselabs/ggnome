import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const Game = dynamic(() => import('../components/Game'), { ssr: false });

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
    openGraph: {
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
      images: [ogImage],
    },
  };
}

export default function Home() {
  return <Game />;
}
