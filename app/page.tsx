import { Metadata } from 'next';

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
    <div className="w-full flex flex-col gap-12 fade-in">
      {/* WhaleScanner Hero / Announcement Section */}
      <div id="utility" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 w-full text-center md:text-left">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-[#f6f9fc] border border-[#e6ebf1] text-[#0a2540] text-xs font-bold tracking-wide uppercase shadow-sm">
            Live Utility · Public Preview
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-[#0a2540] tracking-tight">
            $GNOME Backed by <br className="hidden lg:block" />
            <span className="text-[#dc2626]">Live Utility</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#425466] mb-4 font-medium">
            <strong className="text-[#0a2540]">WhaleScanner.com</strong> is now in Public Preview
          </p>
          <p className="text-[#425466] mb-8 text-lg max-w-2xl leading-relaxed mx-auto md:mx-0">
            WhaleScanner is the first public utility connected with the $GNOME ecosystem. It is being built to provide wallet intelligence, whale tracking, token activity visibility, and suspicious movement awareness for crypto markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-8 py-3.5 rounded-lg font-semibold transition-colors shadow-sm text-lg text-center">
              Visit WhaleScanner
            </a>
            <a href="#roadmap" className="bg-white hover:bg-[#f6f9fc] border border-gray-200 text-[#0a2540] px-8 py-3.5 rounded-lg font-semibold transition-colors text-lg text-center shadow-sm">
              View Roadmap
            </a>
            <a href="https://t.me/gardengnomecoin" target="_blank" rel="noopener noreferrer" className="bg-[#f6f9fc] hover:bg-[#e6ebf1] border border-gray-200 text-[#0a2540] px-8 py-3.5 rounded-lg font-semibold transition-colors text-lg text-center shadow-sm">
              Join Telegram
            </a>
          </div>
        </div>
        <div className="hidden lg:flex w-1/3 justify-center items-center">
           <svg className="w-32 h-32 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
      </div>

      {/* Feature Cards & Ecosystem */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Utility Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 bg-[#f6f9fc] rounded-lg flex items-center justify-center mb-6 border border-gray-100">
            <svg className="w-6 h-6 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-[#0a2540] mb-4">First Public Utility: WhaleScanner</h3>
          <p className="text-[#425466] mb-6 leading-relaxed">
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
              <li key={i} className="flex items-center text-[#425466]">
                <svg className="w-5 h-5 mr-3 text-[#dc2626]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-8">
          {/* Why This Matters */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 transition-shadow hover:shadow-md">
            <h3 className="text-xl font-bold text-[#0a2540] mb-3 flex items-center gap-2">
              <span className="text-[#dc2626] text-2xl">⚡</span> Why WhaleScanner matters
            </h3>
            <p className="text-[#425466] leading-relaxed text-sm md:text-base">
              Small crypto projects are often approached by middlemen claiming they can bring whales, private investors, or hidden buyer groups. $GNOME is choosing a different path: more transparency, better on-chain visibility, and tools that help communities understand real wallet activity directly.
            </p>
          </div>

          {/* Ecosystem Commitment */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 transition-shadow hover:shadow-md flex-1">
            <h3 className="text-xl font-bold text-[#0a2540] mb-3 flex items-center gap-2">
              <span className="text-2xl">🤝</span> Ecosystem Commitment
            </h3>
            <p className="text-[#425466] leading-relaxed text-sm md:text-base mb-4 font-medium">
              Once WhaleScanner.com is publicly live, open to users, and generating revenue, the project plans to allocate a portion of WhaleScanner net profit toward $GNOME buyback and burn actions. Any completed buyback and burn activity will be shared publicly with on-chain proof.
            </p>
            <div className="bg-[#f6f9fc] border border-gray-100 rounded-lg p-4 text-xs text-[#425466] italic">
              This is not a promise of price movement, profit, or investment return. $GNOME and WhaleScanner do not provide financial advice.
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Section */}
      <div id="roadmap" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12 relative overflow-hidden">
         <div className="absolute left-0 top-0 w-1 h-full bg-[#dc2626]"></div>
         <h2 className="text-3xl font-bold text-[#0a2540] mb-8 pl-2">Development Roadmap</h2>
         
         <div className="relative pl-8 md:pl-10">
           <div className="absolute left-[11px] md:left-[15px] top-2 bottom-2 w-px bg-gray-200"></div>
           
           <div className="relative mb-8">
             <div className="absolute -left-[37px] md:-left-[41px] top-1.5 w-4 h-4 rounded-full bg-[#dc2626] border-4 border-white shadow-sm"></div>
             <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                 <h4 className="text-xl font-bold text-[#0a2540]">Live Utility Introduced</h4>
                 <span className="px-3 py-1 bg-[#f6f9fc] text-[#dc2626] text-xs font-semibold rounded-full border border-gray-200 w-fit">Current Phase</span>
               </div>
               <p className="text-[#425466] mb-2">
                 WhaleScanner.com enters public preview as the first public utility connected with the $GNOME ecosystem.
               </p>
               <p className="text-sm text-[#425466] italic bg-[#f6f9fc] p-3 rounded-lg border border-gray-100">
                 Future: Utility profits will be used to buy back and burn $GNOME tokens (on-chain proof will be provided).
               </p>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
