"use client";

import dynamic from 'next/dynamic';

const Game = dynamic(() => import('../components/Game'), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-0 bg-stone-950">
      <Game />
    </main>
  );
}
