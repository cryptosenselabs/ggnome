import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Scam Playbooks | $GNOME",
  description: "Learn how common crypto scams work and how to protect yourself.",
};

export default function PlaybooksPage() {
  return (
    <div className="w-full flex flex-col gap-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-subtle pb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-heading tracking-tight mb-2">Scam Playbooks</h1>
          <p className="text-foreground">Learn how common crypto scams work and how to protect yourself.</p>
        </div>
      </div>

      <div className="bg-card border border-border-subtle rounded-xl shadow-sm overflow-hidden p-12 text-center">
        <svg className="w-16 h-16 text-primary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <h2 className="text-2xl font-bold text-heading mb-2">Coming Soon</h2>
        <p className="text-foreground max-w-md mx-auto">
          We are compiling a comprehensive list of common crypto scams to help educate the community. Check back soon for updates.
        </p>
      </div>
    </div>
  );
}
