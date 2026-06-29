'use client';

import { useState, useEffect } from 'react';

export default function UpvoteButton({ scamId, initialUpvotes }: { scamId: number, initialUpvotes: number }) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    const upvotedScams = JSON.parse(localStorage.getItem('upvotedScams') || '[]');
    if (upvotedScams.includes(scamId)) {
      setHasUpvoted(true);
    }
  }, [scamId]);

  const handleUpvote = async () => {
    if (hasUpvoted) return;

    setUpvotes(prev => prev + 1);
    setHasUpvoted(true);

    const upvotedScams = JSON.parse(localStorage.getItem('upvotedScams') || '[]');
    upvotedScams.push(scamId);
    localStorage.setItem('upvotedScams', JSON.stringify(upvotedScams));

    try {
      await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scamId })
      });
    } catch (error) {
      console.error("Failed to upvote:", error);
    }
  };

  return (
    <button 
      onClick={handleUpvote}
      disabled={hasUpvoted}
      className={`flex flex-col items-center justify-center min-w-[3.5rem] py-1.5 px-2 rounded-lg border transition-all duration-200 ${
        hasUpvoted 
          ? 'bg-[#f6f9fc] border-[#e6ebf1] text-[#635bff] cursor-default shadow-sm' 
          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[#425466] shadow-sm'
      }`}
      title={hasUpvoted ? "You have already upvoted this" : "Upvote this report"}
    >
      <svg className={`w-4 h-4 mb-0.5 ${hasUpvoted ? 'text-[#635bff]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
      <span className="font-semibold text-xs">{upvotes}</span>
    </button>
  );
}
