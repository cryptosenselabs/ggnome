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

export const revalidate = 60; // Revalidate every 60 seconds

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
      console.log("Table bot_fame_posts does not exist yet.");
      reports = [];
    } else {
      console.error("Error fetching data:", err);
    }
  } finally {
    client.release();
  }

  const totalPages = Math.ceil(totalReports / limit);

  return (
    <div className="w-full flex flex-col gap-10">
      {/* Hero Section */}
      <div className="p-8 md:p-12 rounded-[2rem] border border-yellow-900/30 bg-[hsl(222,47%,8%)] shadow-xl shadow-yellow-900/10 flex flex-col items-center gap-6 relative overflow-hidden group text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-64 h-64 bg-yellow-500 rounded-full blur-[100px] opacity-20 transition-opacity duration-1000"></div>
        <h2 className="text-4xl sm:text-5xl font-black mb-2 text-yellow-500 tracking-tight uppercase relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          🏆 Wall of Fame
        </h2>
        <p className="text-lg md:text-xl text-yellow-100 font-medium max-w-2xl leading-relaxed relative z-10">
          Celebrating the Gnomads who keep our garden safe. <br className="hidden md:block" />
          <span className="text-yellow-400 font-bold">Top reporters exposing the toxic soil in crypto.</span>
        </p>
      </div>

      <div className="space-y-6">
        {reports.length === 0 ? (
          <div className="text-center text-yellow-600/60 py-12 bg-[hsl(222,47%,8%)] rounded-lg border border-yellow-900/30">
            No verified reports yet.
          </div>
        ) : (
          reports.map((post: any, index: number) => (
            <div key={index} className="bg-[hsl(222,47%,8%)] border border-yellow-900/20 rounded-xl p-6 shadow-lg shadow-yellow-900/5 transition-transform hover:scale-[1.01] group">
              <div className="flex items-center mb-4 gap-2 text-yellow-500">
                <span className="text-2xl">🏆</span>
                <h2 className="text-xl font-bold group-hover:text-yellow-400 transition-colors">Good Vibes Broadcast</h2>
              </div>
              
              <p className="text-gray-200 mb-6 text-lg bg-background p-4 rounded-lg border border-yellow-900/10 shadow-inner italic">
                "{post.message}"
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center text-sm text-yellow-600/80">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-yellow-900/50" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                    </svg>
                    Posted by <span className="text-yellow-500 font-medium ml-1">{post.author_username}</span>
                  </span>
                  <span className="mx-3">•</span>
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
            <Link href={`/fame?page=${page - 1}`} className="bg-[hsl(222,47%,8%)] hover:bg-[hsl(222,47%,12%)] text-yellow-500 px-4 py-2 rounded-lg transition-colors border border-yellow-900/30 font-semibold">
              ← Previous
            </Link>
          ) : (
            <div className="px-4 py-2 text-yellow-900/50 border border-yellow-900/10 rounded-lg cursor-not-allowed font-semibold">
              ← Previous
            </div>
          )}
          
          <span className="text-yellow-600/80 font-bold">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link href={`/fame?page=${page + 1}`} className="bg-[hsl(222,47%,8%)] hover:bg-[hsl(222,47%,12%)] text-yellow-500 px-4 py-2 rounded-lg transition-colors border border-yellow-900/30 font-semibold">
              Next →
            </Link>
          ) : (
            <div className="px-4 py-2 text-yellow-900/50 border border-yellow-900/10 rounded-lg cursor-not-allowed font-semibold">
              Next →
            </div>
          )}
        </div>
      )}
    </div>
  );
}
