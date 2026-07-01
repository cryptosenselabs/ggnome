'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FameForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [authorUsername, setAuthorUsername] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setErrorMessage('Message is required.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/fame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_username: authorUsername,
          message: message,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit post');
      }

      setStatus('success');
      setAuthorUsername('');
      setMessage('');
      
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
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-heading">Nominate for Hall of Fame</h3>
          <p className="text-foreground text-xs font-medium">Recognize a top contributor in the ecosystem.</p>
        </div>
      </div>

      <div className="mt-6">
        {status === 'success' ? (
          <div className="bg-emerald-950/30 border border-emerald-900 text-emerald-500 p-4 rounded-xl flex flex-col items-center justify-center py-8">
            <svg className="w-10 h-10 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">Post successfully submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="authorUsername" className="block text-sm font-semibold text-heading mb-1">Your Name / Username (Optional)</label>
              <input 
                type="text" 
                id="authorUsername"
                value={authorUsername}
                onChange={(e) => setAuthorUsername(e.target.value)}
                placeholder="e.g., @GnomadHero"
                className="w-full bg-background border border-border-subtle shadow-sm rounded-lg px-4 py-2.5 text-heading focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-heading mb-1">Message</label>
              <textarea 
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe why this person/project deserves to be in the Hall of Fame..."
                className="w-full bg-background border border-border-subtle shadow-sm rounded-lg px-4 py-2.5 text-heading focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none text-sm"
              ></textarea>
            </div>
            
            {status === 'error' && (
              <div className="text-red-500 text-sm font-medium">{errorMessage}</div>
            )}

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-border-subtle disabled:text-foreground/50 disabled:border-transparent text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm border border-transparent"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit Post'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
