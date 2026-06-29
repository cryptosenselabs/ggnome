import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const ogImage = `https://chaosgnome.xyz/assets/og-1.png`;

  return {
    title: "$GNOME — Community, Mission, Utility",
    description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
    openGraph: {
      title: "$GNOME — Community, Mission, Utility",
      description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
      url: "https://chaosgnome.xyz",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "$GNOME — Community, Mission, Utility",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "$GNOME — Community, Mission, Utility",
      description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
      images: [ogImage],
    },
  };
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home({ searchParams }: Props) {
  return (
    <div className="w-full flex flex-col gap-16 fade-in">
      {/* WhaleScanner Hero / Announcement Section */}
      <div id="utility" className="p-8 md:p-12 rounded-[2rem] border border-cyan-900/30 glass-card shadow-[0_15px_40px_rgba(6,182,212,0.1)] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
        
        <div className="flex-1 z-10 w-full text-center md:text-left">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-sm">
            Live Utility · Public Preview
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tight">
            $GNOME Backed by <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Live Utility</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            <strong className="text-white font-semibold">WhaleScanner.com</strong> is now in Public Preview
          </p>
          <p className="text-muted-foreground mb-8 text-lg max-w-2xl leading-relaxed mx-auto md:mx-0">
            WhaleScanner is the first public utility connected with the $GNOME ecosystem. It is being built to provide wallet intelligence, whale tracking, token activity visibility, and suspicious movement awareness for crypto markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] text-lg text-center transform hover:-translate-y-0.5">
              Visit WhaleScanner
            </a>
            <a href="#roadmap" className="bg-[hsl(222,47%,8%)] hover:bg-[hsl(222,47%,12%)] border border-border hover:border-cyan-900/50 text-white px-8 py-3.5 rounded-xl font-bold transition-all text-lg text-center">
              View Roadmap
            </a>
            <a href="https://t.me/gardengnomecoin" target="_blank" rel="noopener noreferrer" className="bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 border border-[#24A1DE]/30 text-[#38bdf8] px-8 py-3.5 rounded-xl font-bold transition-all text-lg text-center flex items-center justify-center gap-2">
              Join Telegram
            </a>
          </div>
        </div>
        <div className="hidden lg:flex w-1/3 justify-center items-center relative z-10">
           <div className="w-48 h-48 bg-primary/20 rounded-full blur-[50px] absolute animate-pulse"></div>
           <svg className="w-32 h-32 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] relative z-10 animate-[float_6s_ease-in-out_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
      </div>

      {/* Feature Cards & Ecosystem */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Utility Card */}
        <div className="glass-card rounded-2xl p-8 hover:border-cyan-900/50 transition-colors group border border-border bg-[hsl(222,47%,8%)]">
          <div className="w-12 h-12 bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6 border border-cyan-800/50 group-hover:bg-cyan-800/40 transition-colors">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">First Public Utility: WhaleScanner</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            WhaleScanner helps users understand on-chain activity through wallet intelligence, whale movement visibility, token monitoring, and suspicious transaction pattern awareness.
          </p>
          <ul className="space-y-3">
            {[
              "Wallet intelligence",
              "Whale tracking",
              "Token activity visibility",
              "Suspicious movement awareness",
              "Public preview live"
            ].map((feature, i) => (
              <li key={i} className="flex items-center text-gray-300">
                <svg className="w-5 h-5 mr-3 text-cyan-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-8">
          {/* Why This Matters */}
          <div className="glass-card rounded-2xl p-8 hover:border-cyan-900/50 transition-colors border border-border bg-[hsl(222,47%,8%)]">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-cyan-400 text-2xl">⚡</span> Why WhaleScanner matters
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              Small crypto projects are often approached by middlemen claiming they can bring whales, private investors, or hidden buyer groups. $GNOME is choosing a different path: more transparency, better on-chain visibility, and tools that help communities understand real wallet activity directly.
            </p>
          </div>

          {/* Ecosystem Commitment */}
          <div className="glass-card rounded-2xl p-8 hover:border-indigo-900/50 transition-colors relative overflow-hidden flex-1 group border border-border bg-[hsl(222,47%,8%)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
            <h3 className="text-xl font-bold text-indigo-400 mb-3 flex items-center gap-2 relative z-10">
              <span className="text-2xl">🤝</span> Ecosystem Commitment
            </h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-4 font-medium relative z-10">
              Once WhaleScanner.com is publicly live, open to users, and generating revenue, the project plans to allocate a portion of WhaleScanner net profit toward $GNOME buyback and burn actions. Any completed buyback and burn activity will be shared publicly with on-chain proof.
            </p>
            <div className="bg-black/40 border border-border rounded-lg p-3 text-xs text-muted-foreground italic relative z-10">
              This is not a promise of price movement, profit, or investment return. $GNOME and WhaleScanner do not provide financial advice.
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Section */}
      <div id="roadmap" className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden border border-border bg-[hsl(222,47%,8%)]">
         <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-indigo-500 to-purple-500"></div>
         <h2 className="text-3xl font-bold text-white mb-8 pl-4">Development Roadmap</h2>
         
         <div className="relative pl-8 md:pl-10">
           <div className="absolute left-[11px] md:left-[15px] top-2 bottom-2 w-0.5 bg-border"></div>
           
           <div className="relative mb-8">
             <div className="absolute -left-[37px] md:-left-[41px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-[hsl(222,47%,8%)] shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
             <div className="bg-[hsl(222,47%,8%)] border border-border rounded-xl p-6 hover:border-cyan-900/50 transition-colors">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                 <h4 className="text-xl font-bold text-cyan-400">Live Utility Introduced</h4>
                 <span className="px-3 py-1 bg-cyan-900/30 text-cyan-300 text-xs font-semibold rounded-full border border-cyan-800/50 w-fit">Current Phase</span>
               </div>
               <p className="text-slate-300 mb-2">
                 WhaleScanner.com enters public preview as the first public utility connected with the $GNOME ecosystem.
               </p>
               <p className="text-sm text-muted-foreground italic">
                 Future: Utility profits will be used to buy back and burn $GNOME tokens (on-chain proof will be provided).
               </p>
             </div>
           </div>
         </div>
      </div>

    </div>
  );
}
