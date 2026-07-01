import { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const ogImage = `https://chaosgnome.xyz/assets/og-1.png`;

  return {
    title: "$GNOME — Crypto Crime Awareness",
    description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
    openGraph: {
      title: "$GNOME — Crypto Crime Awareness",
      description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
      url: "https://chaosgnome.xyz",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "$GNOME — Crypto Crime Awareness",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "$GNOME — Crypto Crime Awareness",
      description: "$GNOME is a community-driven crypto project introducing WhaleScanner.com as its first public utility for wallet intelligence, whale tracking, and token activity visibility.",
      images: [ogImage],
    },
  };
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home({ searchParams }: Props) {
  return (
    <div className="w-full flex flex-col gap-12 fade-in">
      {/* Hero Image Section */}
      <div className="w-full rounded-2xl overflow-hidden border border-[#333333] shadow-lg relative group">
        <img 
          src="/assets/hero-gnome.png" 
          alt="$GNOME: A meme coin with a mission" 
          className="w-full h-auto object-cover max-h-[80vh] bg-[#111111]"
        />
      </div>

      {/* WhaleScanner Hero / Announcement Section */}
      <div id="utility" className="bg-[#1a1a1a] rounded-2xl border border-[#333333] shadow-sm p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 w-full text-center md:text-left">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-[#333333] border border-[#444444] text-white text-xs font-bold tracking-wide uppercase shadow-sm">
            Live Utility · Public Preview
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-white tracking-tight">
            $GNOME Backed by <br className="hidden lg:block" />
            <span className="text-[#facc15]">Live Utility</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-medium">
            <strong className="text-white">WhaleScanner.com</strong> is now in Public Preview
          </p>
          <p className="text-gray-400 mb-8 text-lg max-w-2xl leading-relaxed mx-auto md:mx-0">
            WhaleScanner is the first public utility connected with the $GNOME ecosystem. It is being built to provide wallet intelligence, whale tracking, token activity visibility, and suspicious movement awareness for crypto markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
            <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-[#facc15] hover:bg-[#ca8a04] text-black px-8 py-3.5 rounded-lg font-bold transition-colors shadow-sm text-lg text-center">
              Visit WhaleScanner
            </a>
            <a href="#roadmap" className="bg-[#111111] hover:bg-[#222222] border border-[#333333] text-white px-8 py-3.5 rounded-lg font-semibold transition-colors text-lg text-center shadow-sm">
              View Roadmap
            </a>
            <a href="https://t.me/gardengnomecoin" target="_blank" rel="noopener noreferrer" className="bg-[#111111] hover:bg-[#222222] border border-[#333333] text-white px-8 py-3.5 rounded-lg font-semibold transition-colors text-lg text-center shadow-sm">
              Join Telegram
            </a>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
            <span className="text-sm font-semibold text-gray-400 mt-1.5 hidden md:block">Contract Address:</span>
            <div className="flex items-stretch gap-2">
              <code className="bg-[#111111] text-[#facc15] flex items-center px-4 py-2 rounded-lg text-xs sm:text-sm font-mono border border-[#333333] break-all shadow-sm">
                HbRpHGekMEE8eMpbNsM4GYS2FNMybGpUQGXR92axpump
              </code>
              <a href="https://dexscreener.com/solana/hbrphgekmee8empbnsm4gys2fnmybgpuqgxr92axpump" target="_blank" rel="noopener noreferrer" className="bg-[#1a1a1a] hover:bg-[#333333] text-white px-3 py-2 rounded-lg border border-[#444444] shadow-sm transition-colors flex items-center gap-1.5 text-sm font-semibold shrink-0">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3v18h18v-2H5V3H3zm6 14V9h2v8H9zm4 0V5h2v12h-2zm4 0v-5h2v5h-2z"/></svg>
                <span className="hidden sm:inline">Chart</span>
              </a>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex w-1/3 justify-center items-center">
           <img 
             src="/assets/logo.png" 
             alt="$GNOME Logo" 
             className="w-48 h-48 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 filter drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]"
           />
        </div>
      </div>

      {/* Feature Cards & Ecosystem */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Utility Card */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#333333] shadow-sm p-8 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 bg-[#111111] rounded-lg flex items-center justify-center mb-6 border border-[#333333]">
            <svg className="w-6 h-6 text-[#facc15]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">First Public Utility: WhaleScanner</h3>
          <p className="text-gray-300 mb-6 leading-relaxed">
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
                <svg className="w-5 h-5 mr-3 text-[#facc15]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-8">
          {/* Why This Matters */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#333333] shadow-sm p-8 transition-shadow hover:shadow-md">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-[#facc15] text-2xl">⚡</span> Why WhaleScanner matters
            </h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              Small crypto projects are often approached by middlemen claiming they can bring whales, private investors, or hidden buyer groups. $GNOME is choosing a different path: more transparency, better on-chain visibility, and tools that help communities understand real wallet activity directly.
            </p>
          </div>

          {/* Ecosystem Commitment */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#333333] shadow-sm p-8 transition-shadow hover:shadow-md flex-1">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">🤝</span> Ecosystem Commitment
            </h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-4 font-medium">
              Once WhaleScanner.com is publicly live, open to users, and generating revenue, the project plans to allocate a portion of WhaleScanner net profit toward $GNOME buyback and burn actions. Any completed buyback and burn activity will be shared publicly with on-chain proof.
            </p>
            <div className="bg-[#111111] border border-[#333333] rounded-lg p-4 text-xs text-gray-400 italic">
              This is not a promise of price movement, profit, or investment return. $GNOME and WhaleScanner do not provide financial advice.
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Section */}
      <div id="roadmap" className="bg-[#1a1a1a] rounded-2xl border border-[#333333] shadow-sm p-8 md:p-12 relative overflow-hidden">
         <div className="absolute left-0 top-0 w-1 h-full bg-[#facc15]"></div>
         <h2 className="text-3xl font-bold text-white mb-8 pl-2">Development Roadmap</h2>
         
         <div className="relative pl-8 md:pl-10">
           <div className="absolute left-[11px] md:left-[15px] top-2 bottom-2 w-px bg-[#333333]"></div>
           
           <div className="relative mb-8">
             <div className="absolute -left-[37px] md:-left-[41px] top-1.5 w-4 h-4 rounded-full bg-[#facc15] border-4 border-[#1a1a1a] shadow-sm"></div>
             <div className="bg-[#111111] border border-[#333333] rounded-xl p-6 shadow-sm">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                 <h4 className="text-xl font-bold text-white">Live Utility Introduced</h4>
                 <span className="px-3 py-1 bg-[#333333] text-[#facc15] text-xs font-semibold rounded-full border border-[#444444] w-fit">Current Phase</span>
               </div>
               <p className="text-gray-300 mb-2">
                 WhaleScanner.com enters public preview as the first public utility connected with the $GNOME ecosystem.
               </p>
               <p className="text-sm text-gray-400 italic bg-[#1a1a1a] p-3 rounded-lg border border-[#333333]">
                 Future: Utility profits will be used to buy back and burn $GNOME tokens (on-chain proof will be provided).
               </p>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
