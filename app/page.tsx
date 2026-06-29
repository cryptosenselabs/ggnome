import { Metadata } from 'next';
import { Pool } from 'pg';
import UpvoteButton from '../components/UpvoteButton';
import ReportModal from '../components/ReportModal';
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

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const connectionString = rawConnectionString ? rawConnectionString.replace("?sslmode=require", "") : "";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const page = parseInt((resolvedParams?.page as string) || '1');
  const tab = (resolvedParams?.tab as string) || 'shame';
  const limit = 10;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  let reports: any[] = [];
  let totalReports = 0;
  
  try {
    if (tab === 'fame') {
      const countResult = await client.query(`SELECT COUNT(*) FROM bot_fame_posts`);
      totalReports = parseInt(countResult.rows[0].count);

      const result = await client.query(`
        SELECT id, author_username, message, upvotes, created_at
        FROM bot_fame_posts
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      reports = result.rows;
    } else {
      const countResult = await client.query(`SELECT COUNT(*) FROM bot_scam_reports`);
      totalReports = parseInt(countResult.rows[0].count);

      const result = await client.query(`
        SELECT id, scam_url, scam_evidence, reporter_username, status, upvotes, created_at 
        FROM bot_scam_reports 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      reports = result.rows;
    }
  } catch (err: any) {
    if (err.code === '42P01') { 
      console.log("Table bot_scam_reports does not exist yet.");
      reports = [];
    } else {
      console.error("Error fetching data:", err);
    }
  } finally {
    client.release();
  }

  const totalPages = Math.ceil(totalReports / limit);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#070e08] text-white p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Navigation Bar */}
        <nav className="flex flex-col lg:flex-row items-center justify-between bg-[#111811] border border-[#2e4a2e]/50 rounded-2xl p-4 mb-10 shadow-lg shadow-green-900/10">
          <div className="flex flex-col mb-4 lg:mb-0 w-full lg:w-auto text-center lg:text-left">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">Garden Gnome <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">$GNOME</span></h1>
            <p className="text-xs md:text-sm text-gray-400 italic">Community. Mission. Utility.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto justify-center lg:justify-end overflow-hidden">
            <div className="flex items-center gap-4">
              <a href="#utility" className="text-gray-300 hover:text-white font-medium transition-colors cursor-pointer">Utility</a>
              <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-[#0e7490] hover:bg-[#0891b2] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-cyan-900/20 border border-cyan-500/50">WhaleScanner</a>
            </div>
            <code className="hidden lg:block text-green-400 font-mono text-xs bg-[#0b140b] px-3 py-2 rounded-lg border border-green-900/50 text-center shadow-inner">
              <span className="text-yellow-500 font-bold mr-1">CA:</span> 
              HbRpHGekMEE8eMpbNsM4GYS2FNMybGpUQGXR92axpump
            </code>
            <div className="flex gap-2">
              <a href="https://www.chaosgnome.xyz/" target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10" title="Website">
                🌐
              </a>
              <a href="https://x.com/GardenGnomeCoin" target="_blank" rel="noopener noreferrer" className="bg-[#000000] border border-gray-700 hover:border-gray-500 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10" title="Twitter">
                𝕏
              </a>
              <a href="https://t.me/gardengnomecoin" target="_blank" rel="noopener noreferrer" className="bg-[#24A1DE] hover:bg-[#1d87ba] text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10" title="Telegram">
                ✈️
              </a>
            </div>
          </div>
        </nav>

        {/* New WhaleScanner Hero / Announcement Section */}
        <div id="utility" className="mb-16 p-8 md:p-12 rounded-[2rem] border border-[#0891b2]/30 bg-gradient-to-br from-[#042f2e] to-[#020617] shadow-[0_15px_40px_rgba(8,145,178,0.15)] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#0891b2] rounded-full blur-[100px] opacity-20"></div>
          
          <div className="flex-1 z-10 w-full text-center md:text-left">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-[#0891b2]/10 border border-[#0891b2]/30 text-[#22d3ee] text-sm font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(8,145,178,0.2)] backdrop-blur-sm">
              Live Utility · Public Preview
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tight">
              $GNOME Backed by <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] to-[#10b981]">Live Utility</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
              <strong className="text-white font-semibold">WhaleScanner.com</strong> is now in Public Preview
            </p>
            <p className="text-gray-400 mb-8 text-lg max-w-2xl leading-relaxed mx-auto md:mx-0">
              WhaleScanner is the first public utility connected with the $GNOME ecosystem. It is being built to provide wallet intelligence, whale tracking, token activity visibility, and suspicious movement awareness for crypto markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-[#0891b2] to-[#0d9488] hover:from-[#06b6d4] hover:to-[#14b8a6] text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(8,145,178,0.5)] text-lg text-center transform hover:-translate-y-0.5">
                Visit WhaleScanner
              </a>
              <a href="#roadmap" className="bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700 hover:border-slate-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all text-lg text-center">
                View Roadmap
              </a>
              <a href="https://t.me/gardengnomecoin" target="_blank" rel="noopener noreferrer" className="bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 border border-[#24A1DE]/30 text-[#38bdf8] px-8 py-3.5 rounded-xl font-bold transition-all text-lg text-center flex items-center justify-center gap-2">
                Join Telegram
              </a>
            </div>
          </div>
          <div className="hidden lg:flex w-1/3 justify-center items-center relative z-10">
             <div className="w-48 h-48 bg-[#0891b2]/20 rounded-full blur-[40px] absolute"></div>
             <svg className="w-32 h-32 text-[#22d3ee] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
        </div>

        {/* Feature Cards & Ecosystem */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Utility Card */}
          <div className="bg-[#0B1110] border border-[#143D37] rounded-2xl p-8 shadow-xl shadow-cyan-900/10 hover:border-[#1F5C53] transition-colors group">
            <div className="w-12 h-12 bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6 border border-cyan-800/50 group-hover:bg-cyan-800/40 transition-colors">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">First Public Utility: WhaleScanner</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
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
            <div className="bg-[#0B1110] border border-[#143D37] rounded-2xl p-8 shadow-xl shadow-green-900/10 hover:border-[#1F5C53] transition-colors">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-green-400 text-2xl">🌱</span> Why WhaleScanner matters
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                Small crypto projects are often approached by middlemen claiming they can bring whales, private investors, or hidden buyer groups. $GNOME is choosing a different path: more transparency, better on-chain visibility, and tools that help communities understand real wallet activity directly.
              </p>
            </div>

            {/* Ecosystem Commitment */}
            <div className="bg-[#0f110b] border border-[#3d421d] rounded-2xl p-8 shadow-xl shadow-yellow-900/10 relative overflow-hidden flex-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-bl-[100px] pointer-events-none"></div>
              <h3 className="text-xl font-bold text-yellow-500 mb-3 flex items-center gap-2 relative z-10">
                <span className="text-2xl">🤝</span> Ecosystem Commitment
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-4 font-medium relative z-10">
                Once WhaleScanner.com is publicly live, open to users, and generating revenue, the project plans to allocate 1% of WhaleScanner net profit toward $GNOME buyback and burn actions. Any completed buyback and burn activity will be shared publicly with on-chain proof.
              </p>
              <div className="bg-black/40 border border-gray-800 rounded-lg p-3 text-xs text-gray-500 italic relative z-10">
                This is not a promise of price movement, profit, or investment return. $GNOME and WhaleScanner do not provide financial advice.
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Section */}
        <div id="roadmap" className="mb-16 bg-[#070b0e] border border-slate-800/60 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
           <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-blue-500 to-purple-500"></div>
           <h2 className="text-3xl font-bold text-white mb-8 pl-4">Development Roadmap</h2>
           
           <div className="relative pl-8 md:pl-10">
             <div className="absolute left-[11px] md:left-[15px] top-2 bottom-2 w-0.5 bg-slate-800"></div>
             
             <div className="relative mb-8">
               <div className="absolute -left-[37px] md:-left-[41px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-[#070b0e] shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
               <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                   <h4 className="text-xl font-bold text-cyan-400">Live Utility Introduced</h4>
                   <span className="px-3 py-1 bg-cyan-900/30 text-cyan-300 text-xs font-semibold rounded-full border border-cyan-800/50 w-fit">Current Phase</span>
                 </div>
                 <p className="text-slate-300">
                   WhaleScanner.com enters public preview as the first public utility connected with the $GNOME ecosystem.
                 </p>
               </div>
             </div>
           </div>
        </div>

        {/* Transition Text to Wall of Shame/Fame */}
        <div className="mb-12 text-center max-w-3xl mx-auto px-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-green-500/50 to-transparent mx-auto mb-6"></div>
          <p className="text-xl text-green-300/80 font-medium italic">
            $GNOME began with meme culture, but the project is now moving toward utility, transparency, and ecosystem development.
          </p>
        </div>

        {/* Hero Section */}
        <div className={`mb-10 p-6 md:p-12 rounded-[2rem] border-2 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden ${tab === 'fame' ? 'bg-[#15120a] border-[#5a481d]' : 'bg-[#0d160e] border-[#3d2c1d]'}`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
          <div className="flex-shrink-0 relative group z-10 animate-[float_6s_ease-in-out_infinite]">
            <div className={`absolute inset-0 rounded-full blur-[40px] opacity-30 group-hover:opacity-60 transition-opacity duration-500 animate-[pulse-glow_4s_ease-in-out_infinite] ${tab === 'fame' ? 'bg-yellow-500' : 'bg-red-600'}`}></div>
            <img 
              src="/assets/logo.png" 
              alt="Garden Gnome Logo" 
              className="w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-yellow-500 relative z-10 shadow-[0_0_20px_rgba(250,204,21,0.4)]"
            />
          </div>
          <div className="text-center md:text-left flex-1 z-10 w-full">
            <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black mb-4 tracking-tight uppercase sm:whitespace-nowrap break-words ${tab === 'fame' ? 'text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.6)]'}`}>
              {tab === 'fame' ? '🏆 Wall of Fame' : '🚨 Wall of Shame'}
            </h2>
            <p className="text-lg md:text-xl text-green-100 font-medium max-w-2xl leading-relaxed">
              {tab === 'fame' ? (
                <>
                  Celebrating the Gnomads who keep our garden safe. <br className="hidden lg:block" />
                  <span className="text-yellow-400 font-bold">Top reporters exposing the toxic soil in crypto.</span>
                </>
              ) : (
                <>
                  The Gnomad community stands strong against toxic soil. <br className="hidden lg:block" />
                  <span className="text-yellow-400 font-bold">Here we expose crypto scams, fake KOLs, and rug pulls.</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#111811] rounded-2xl border border-[#2e4a2e]/50 flex overflow-hidden shadow-lg shadow-green-900/10">
            <Link 
              href="/?tab=shame" 
              scroll={false}
              className={`px-8 py-3 text-sm sm:text-base font-bold transition-all duration-300 ${tab === 'shame' ? 'bg-red-900/30 text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:bg-[#1a261a] hover:text-gray-200 border-b-2 border-transparent'}`}
            >
              🚨 Wall of Shame
            </Link>
            <Link 
              href="/?tab=fame" 
              scroll={false}
              className={`px-8 py-3 text-sm sm:text-base font-bold transition-all duration-300 ${tab === 'fame' ? 'bg-yellow-900/30 text-yellow-400 border-b-2 border-yellow-500' : 'text-gray-400 hover:bg-[#1a261a] hover:text-gray-200 border-b-2 border-transparent'}`}
            >
              🏆 Wall of Fame
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
          {tab === 'shame' && <ReportModal />}
          
          <a 
            href="https://twitter.com/intent/tweet?text=Check%20out%20the%20Gnomad%20Wall%20of%20Shame!%20%24GNOME%20is%20exposing%20crypto%20scams.%20&url=https://chaosgnome.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#000000] border border-gray-700 hover:border-gray-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all flex items-center gap-2 text-lg"
          >
            <span className="text-xl">𝕏</span> Share to X
          </a>
        </div>

        <div className="space-y-6">
          {reports.length === 0 ? (
            <div className="text-center text-green-600/60 py-12 bg-[#0c140d] rounded-lg border border-green-900/30">
              {tab === 'fame' ? 'No verified reports yet.' : 'No scams reported yet. The garden is safe... for now.'}
            </div>
          ) : tab === 'fame' ? (
            reports.map((post: any, index: number) => (
              <div key={index} className="bg-[#15120a] border border-[#5a481d]/40 rounded-xl p-6 shadow-lg shadow-yellow-900/5 transition-transform hover:scale-[1.01]">
                <div className="flex items-center mb-4 gap-2 text-yellow-500">
                  <span className="text-2xl">🏆</span>
                  <h2 className="text-xl font-bold">Good Vibes Broadcast</h2>
                </div>
                
                <p className="text-gray-200 mb-6 text-lg bg-[#070e08] p-4 rounded-lg border border-[#5a481d]/30 shadow-inner italic">
                  "{post.message}"
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center text-sm text-yellow-600/80">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                      </svg>
                      Posted by <span className="text-gray-300 font-medium ml-1">{post.author_username}</span>
                    </span>
                    <span className="mx-3">•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            reports.map((report: any, index: number) => (
              <div key={index} className="bg-[#111811] border border-[#2e4a2e]/40 rounded-xl p-6 shadow-lg shadow-green-900/5 transition-transform hover:scale-[1.01]">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                  <h2 className="text-2xl font-semibold text-yellow-400 break-all">
                    {report.scam_url.startsWith('http') ? (
                      <a href={report.scam_url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-yellow-300">
                        {report.scam_url}
                      </a>
                    ) : (
                      report.scam_url
                    )}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium w-fit h-fit ${
                    report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                    report.status === 'verified_scam' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 
                    'bg-green-500/20 text-green-500 border border-green-500/30'
                  }`}>
                    {report.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-gray-200 mb-6 text-lg bg-[#070e08] p-4 rounded-lg border border-green-900/30 shadow-inner">
                  "{report.scam_evidence}"
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center text-sm text-green-600/80">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                      </svg>
                      Reported by <span className="text-gray-300 font-medium ml-1">@{report.reporter_username}</span>
                    </span>
                    <span className="mx-3">•</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <UpvoteButton scamId={report.id} initialUpvotes={report.upvotes || 0} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            {page > 1 ? (
              <Link href={`/?tab=${tab}&page=${page - 1}`} className="bg-[#111811] hover:bg-[#1a261a] text-green-400 px-4 py-2 rounded-lg transition-colors border border-green-900/50 font-semibold">
                ← Previous
              </Link>
            ) : (
              <div className="px-4 py-2 text-green-900 border border-green-900/20 rounded-lg cursor-not-allowed font-semibold">
                ← Previous
              </div>
            )}
            
            <span className="text-green-600/80 font-bold">
              Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
              <Link href={`/?tab=${tab}&page=${page + 1}`} className="bg-[#111811] hover:bg-[#1a261a] text-green-400 px-4 py-2 rounded-lg transition-colors border border-green-900/50 font-semibold">
                Next →
              </Link>
            ) : (
              <div className="px-4 py-2 text-green-900 border border-green-900/20 rounded-lg cursor-not-allowed font-semibold">
                Next →
              </div>
            )}
          </div>
        )}
        
        <footer className="mt-16 text-center text-green-700/60 pb-10 border-t border-green-900/20 pt-10">
          <p className="mb-4">Want to report a scam? Join our Telegram and type <code className="bg-[#111811] text-green-500 px-2 py-1 rounded font-mono border border-green-900/30">/report [URL] [Evidence]</code>.</p>
          <div className="max-w-4xl mx-auto px-4 text-xs text-gray-500/80 leading-relaxed">
            $GNOME and WhaleScanner provide community and wallet-intelligence information only. Nothing on this website is financial advice, investment advice, or a promise of future price performance. Always do your own research.
          </div>
        </footer>
      </div>
    </div>
  );
}
