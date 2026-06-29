import { Metadata } from 'next';
import { Pool } from 'pg';
import UpvoteButton from '../../components/UpvoteButton';
import ReportModal from '../../components/ReportModal';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Wall of Shame | $GNOME",
  description: "Exposing crypto scams, fake KOLs, and toxic projects.",
};

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const connectionString = rawConnectionString ? rawConnectionString.replace("?sslmode=require", "") : "";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function ShamePage({ searchParams }: Props) {
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
      reports = [];
    } else {
      console.error("Error fetching data:", err);
    }
  } finally {
    client.release();
  }

  const totalPages = Math.ceil(totalReports / limit);

  return (
    <div className="w-full flex flex-col gap-10 fade-in">
      {/* Hero Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12 flex flex-col items-center gap-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-black mb-2 text-[#0a2540] tracking-tight flex items-center gap-3">
          <span className="text-red-500">🚨</span> Wall of Shame
        </h2>
        <p className="text-lg md:text-xl text-[#425466] font-medium max-w-2xl leading-relaxed">
          The Gnomad community stands strong against toxic soil. <br className="hidden md:block" />
          <span className="text-red-600 font-bold">Here we expose crypto scams, fake KOLs, and rug pulls.</span>
        </p>
      </div>

      <div className="flex justify-center">
        <ReportModal />
      </div>

      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="text-center text-red-600 font-medium py-12 bg-red-50 rounded-lg border border-red-100">
            No scams reported yet. The garden is safe... for now.
          </div>
        ) : (
          reports.map((report: any, index: number) => (
            <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-[#0a2540] break-all hover:text-[#635bff] transition-colors">
                  {report.scam_url.startsWith('http') ? (
                    <a href={report.scam_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {report.scam_url}
                    </a>
                  ) : (
                    report.scam_url
                  )}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit h-fit ${
                  report.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                  report.status === 'verified_scam' ? 'bg-red-100 text-red-700 border border-red-200' : 
                  'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {report.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-[#425466] mb-6 text-lg bg-[#f6f9fc] p-4 rounded-xl border border-gray-100 leading-relaxed">
                "{report.scam_evidence}"
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <span className="flex items-center">
                    Reported by <span className="text-[#0a2540] font-bold ml-1">@{report.reporter_username}</span>
                  </span>
                  <span className="mx-3 text-gray-300">•</span>
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
            <Link href={`/shame?page=${page - 1}`} className="bg-white hover:bg-[#f6f9fc] text-[#0a2540] px-4 py-2 rounded-lg transition-colors border border-gray-200 font-semibold shadow-sm">
              ← Previous
            </Link>
          ) : (
            <div className="px-4 py-2 text-gray-400 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed font-semibold">
              ← Previous
            </div>
          )}
          
          <span className="text-[#425466] font-bold">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link href={`/shame?page=${page + 1}`} className="bg-white hover:bg-[#f6f9fc] text-[#0a2540] px-4 py-2 rounded-lg transition-colors border border-gray-200 font-semibold shadow-sm">
              Next →
            </Link>
          ) : (
            <div className="px-4 py-2 text-gray-400 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed font-semibold">
              Next →
            </div>
          )}
        </div>
      )}
    </div>
  );
}
