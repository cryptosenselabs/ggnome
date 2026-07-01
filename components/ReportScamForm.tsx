'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportScamForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [evidence, setEvidence] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || !evidence.trim()) {
      setErrorMessage('Both Target and Details are required.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scam_url: url,
          scam_evidence: evidence,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit report');
      }

      setStatus('success');
      setUrl('');
      setEvidence('');
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          router.refresh();
        }, 1500);
      } else {
        setTimeout(() => {
          setStatus('idle');
          router.refresh();
        }, 3000);
      }
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during submission.');
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 md:p-8 shadow-xl w-full border border-border-subtle">
      <div className="flex items-center gap-3 mb-2 border-b border-border-subtle pb-4">
        <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center border border-border-subtle">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-heading">Report an Incident</h3>
          <p className="text-foreground text-xs font-medium">Submitted reports will be reviewed by the community.</p>
        </div>
      </div>

      <div className="mt-6">
        {status === 'success' ? (
          <div className="bg-emerald-950/30 border border-emerald-900 text-emerald-500 p-4 rounded-xl flex flex-col items-center justify-center py-8">
            <svg className="w-10 h-10 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">Report successfully submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-semibold text-heading mb-1">Target (URL or Identifier)</label>
              <input 
                type="text" 
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://t.me/FakeGroup or @Scammer123"
                className="w-full bg-background border border-border-subtle shadow-sm rounded-lg px-4 py-2.5 text-heading focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
              />
            </div>
            <div>
              <label htmlFor="evidence" className="block text-sm font-semibold text-heading mb-1">Incident Details</label>
              <textarea 
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={4}
                placeholder="Describe the malicious activity in detail..."
                className="w-full bg-background border border-border-subtle shadow-sm rounded-lg px-4 py-2.5 text-heading focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none text-sm"
              ></textarea>
            </div>
            
            {status === 'error' && (
              <div className="text-red-500 text-sm font-medium">{errorMessage}</div>
            )}

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-border-subtle disabled:text-foreground/50 disabled:border-transparent text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm border border-transparent"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
