import { Metadata } from 'next';
import { Pool } from 'pg';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Wall of Fame | $GNOME",
  description: "Celebrating the Gnomads who keep our garden safe.",
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

export default async function FamePage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const page = parseInt((resolvedParams?.page as string) || '1');
  const limit = 10;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  let reports: any[] = [];
  let totalReports = 0;
  
  try {
    const countResult = await client.query(`SELECT COUNT(*) FROM bot_fame_posts`);
    totalReports = parseInt(countResult.rows[0].count);

    const result = await client.query(`
      SELECT id, author_username, message, upvotes, created_at
      FROM bot_fame_posts
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
          <span className="text-amber-500">🏆</span> Wall of Fame
        </h2>
        <p className="text-lg md:text-xl text-[#425466] font-medium max-w-2xl leading-relaxed">
          Celebrating the Gnomads who keep our garden safe. <br className="hidden md:block" />
          <span className="text-amber-600 font-bold">Top reporters exposing the toxic soil in crypto.</span>
        </p>
      </div>

      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="text-center text-amber-700 font-medium py-12 bg-amber-50 rounded-lg border border-amber-100">
            No verified reports yet.
          </div>
        ) : (
          reports.map((post: any, index: number) => (
            <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center mb-4 gap-3 text-[#0a2540]">
                <span className="text-2xl">🏆</span>
                <h2 className="text-xl md:text-2xl font-bold">Good Vibes Broadcast</h2>
              </div>
              
              <p className="text-[#425466] mb-6 text-lg bg-[#f6f9fc] p-4 rounded-xl border border-gray-100 leading-relaxed italic">
                "{post.message}"
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <span className="flex items-center">
                    Posted by <span className="text-[#0a2540] font-bold ml-1">@{post.author_username}</span>
                  </span>
                  <span className="mx-3 text-gray-300">•</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          {page > 1 ? (
            <Link href={`/fame?page=${page - 1}`} className="bg-white hover:bg-[#f6f9fc] text-[#0a2540] px-4 py-2 rounded-lg transition-colors border border-gray-200 font-semibold shadow-sm">
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
            <Link href={`/fame?page=${page + 1}`} className="bg-white hover:bg-[#f6f9fc] text-[#0a2540] px-4 py-2 rounded-lg transition-colors border border-gray-200 font-semibold shadow-sm">
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
