import { Metadata } from 'next';
import { Pool } from 'pg';
import UpvoteButton from '../../components/UpvoteButton';
import ReportModal from '../../components/ReportModal';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Incident Reports | $GNOME",
  description: "Community-submitted reports of malicious activity and scams.",
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
    <div className="w-full flex flex-col gap-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0a2540] tracking-tight mb-2">Incident Reports</h1>
          <p className="text-[#425466]">Community-submitted reports of malicious activity, fake KOLs, and scams.</p>
        </div>
        <div>
          <ReportModal />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center text-gray-500 font-medium py-16">
            No incidents reported yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {reports.map((report: any, index: number) => (
              <li key={index} className="p-6 hover:bg-[#f6f9fc] transition-colors flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#0a2540] truncate max-w-full">
                      {report.scam_url.startsWith('http') ? (
                        <a href={report.scam_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#635bff] transition-colors underline decoration-gray-300 underline-offset-2">
                          {report.scam_url}
                        </a>
                      ) : (
                        <span className="break-all">{report.scam_url}</span>
                      )}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                      report.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                      report.status === 'verified_scam' ? 'bg-red-50 text-red-700 border border-red-200' : 
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-[#425466] text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                    {report.scam_evidence}
                  </p>
                  
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      @{report.reporter_username}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="shrink-0 pt-1">
                  <UpvoteButton scamId={report.id} initialUpvotes={report.upvotes || 0} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          {page > 1 ? (
            <Link href={`/shame?page=${page - 1}`} className="bg-white hover:bg-gray-50 text-[#0a2540] px-4 py-2 rounded-lg transition-colors border border-gray-200 font-medium shadow-sm text-sm">
              Previous
            </Link>
          ) : (
            <div className="px-4 py-2 text-gray-400 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed font-medium text-sm">
              Previous
            </div>
          )}
          
          <span className="text-[#425466] font-medium text-sm">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link href={`/shame?page=${page + 1}`} className="bg-white hover:bg-gray-50 text-[#0a2540] px-4 py-2 rounded-lg transition-colors border border-gray-200 font-medium shadow-sm text-sm">
              Next
            </Link>
          ) : (
            <div className="px-4 py-2 text-gray-400 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed font-medium text-sm">
              Next
            </div>
          )}
        </div>
      )}
    </div>
  );
}
