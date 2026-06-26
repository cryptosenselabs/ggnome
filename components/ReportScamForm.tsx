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
      setErrorMessage('Both URL and Evidence are required.');
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
      setErrorMessage(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="bg-black border border-red-900/30 rounded-2xl p-6 shadow-lg w-full">
      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <span className="text-red-500">🕵️</span> Report a Scam Anonymously
      </h3>
      <p className="text-gray-400 mb-6 text-sm">
        Help protect the Gnomad village. Submitted reports will be reviewed by the community.
      </p>

      {status === 'success' ? (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 p-4 rounded-xl text-center font-medium">
          ✅ Thank you! Your report has been submitted.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">Scam URL or Target</label>
            <input 
              type="text" 
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://t.me/FakeGroup or @Scammer123"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="evidence" className="block text-sm font-medium text-gray-300 mb-1">Evidence / Details</label>
            <textarea 
              id="evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={3}
              placeholder="What did they do? Ask for money? Post fake links?"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
            ></textarea>
          </div>
          
          {status === 'error' && (
            <div className="text-red-400 text-sm">{errorMessage}</div>
          )}

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:text-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {status === 'loading' ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}
    </div>
  );
}
