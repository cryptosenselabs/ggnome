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
    title: "Gnomad Wall of Shame",
    description: "Exposing crypto scams, fake KOLs, and toxic projects.",
    openGraph: {
      title: "Gnomad Wall of Shame",
      description: "Exposing crypto scams, fake KOLs, and toxic projects.",
      url: "https://chaosgnome.xyz",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Gnomad Wall of Shame",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Gnomad Wall of Shame",
      description: "Exposing crypto scams, fake KOLs, and toxic projects.",
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
  const limit = 10;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  let reports: any[] = [];
  let totalReports = 0;
  
  try {
    const countResult = await client.query(`SELECT COUNT(*) FROM bot_scam_reports`);
    totalReports = parseInt(countResult.rows[0].count);

    const result = await client.query(`
      SELECT id, scam_url, scam_evidence, reporter_username, status, upvotes, created_at 
      FROM bot_scam_reports 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    reports = result.rows;
  } catch (err: any) {
    if (err.code === '42P01') { 
      console.log("Table bot_scam_reports does not exist yet.");
      reports = [];
    } else {
      console.error("Error fetching scams:", err);
    }
  } finally {
    client.release();
  }

  const totalPages = Math.ceil(totalReports / limit);

  return (
    <div className="min-h-screen bg-[#070e08] text-white p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Navigation Bar */}
        <nav className="flex flex-col lg:flex-row items-center justify-between bg-[#111811] border border-[#2e4a2e]/50 rounded-2xl p-4 mb-10 shadow-lg shadow-green-900/10">
          <div className="flex flex-col mb-4 lg:mb-0 w-full lg:w-auto text-center lg:text-left">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">Garden Gnome <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">$GNOME</span></h1>
            <p className="text-xs md:text-sm text-gray-400 italic">Chaos Outside. Discipline Inside.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto justify-center lg:justify-end overflow-hidden">
            <code className="text-green-400 font-mono text-xs bg-[#0b140b] px-3 py-2 rounded-lg border border-green-900/50 text-center max-w-[250px] sm:max-w-full overflow-hidden text-ellipsis whitespace-nowrap shadow-inner">
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

        {/* Hero Section: Wall of Shame */}
        <div className="mb-10 bg-[#0d160e] p-6 md:p-12 rounded-[2rem] border-2 border-[#3d2c1d] shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
          <div className="flex-shrink-0 relative group z-10 animate-[float_6s_ease-in-out_infinite]">
            <div className="absolute inset-0 bg-red-600 rounded-full blur-[40px] opacity-30 group-hover:opacity-60 transition-opacity duration-500 animate-[pulse-glow_4s_ease-in-out_infinite]"></div>
            <img 
              src="/assets/logo.png" 
              alt="Garden Gnome Logo" 
              className="w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-yellow-500 relative z-10 shadow-[0_0_20px_rgba(250,204,21,0.4)]"
            />
          </div>
          <div className="text-center md:text-left flex-1 z-10 w-full">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-red-500 mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(220,38,38,0.6)] uppercase sm:whitespace-nowrap break-words">
              🚨 Wall of Shame
            </h2>
            <p className="text-lg md:text-xl text-green-100 font-medium max-w-2xl leading-relaxed">
              The Gnomad community stands strong against toxic soil. <br className="hidden lg:block" />
              <span className="text-yellow-400 font-bold">Here we expose crypto scams, fake KOLs, and rug pulls.</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
          <ReportModal />
          
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
              No scams reported yet. The garden is safe... for now.
            </div>
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
              <Link href={`/?page=${page - 1}`} className="bg-[#111811] hover:bg-[#1a261a] text-green-400 px-4 py-2 rounded-lg transition-colors border border-green-900/50 font-semibold">
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
              <Link href={`/?page=${page + 1}`} className="bg-[#111811] hover:bg-[#1a261a] text-green-400 px-4 py-2 rounded-lg transition-colors border border-green-900/50 font-semibold">
                Next →
              </Link>
            ) : (
              <div className="px-4 py-2 text-green-900 border border-green-900/20 rounded-lg cursor-not-allowed font-semibold">
                Next →
              </div>
            )}
          </div>
        )}
        
        <footer className="mt-16 text-center text-green-700/60 pb-10">
          <p>Want to report a scam? Join our Telegram and type <code className="bg-[#111811] text-green-500 px-2 py-1 rounded font-mono border border-green-900/30">/report [URL] [Evidence]</code>.</p>
        </footer>
      </div>
    </div>
  );
}
