'use client';

import { useState, useEffect } from 'react';

export default function UpvoteButton({ scamId, initialUpvotes }: { scamId: number, initialUpvotes: number }) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Check local storage to see if the user has already upvoted this scam
    const upvotedScams = JSON.parse(localStorage.getItem('upvotedScams') || '[]');
    if (upvotedScams.includes(scamId)) {
      setHasUpvoted(true);
    }
  }, [scamId]);

  const handleUpvote = async () => {
    if (hasUpvoted) return;

    // Optimistic update
    setUpvotes(prev => prev + 1);
    setHasUpvoted(true);

    // Save to local storage
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
      // Revert if failed (optional, keeping it simple here)
    }
  };

  return (
    <button 
      onClick={handleUpvote}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={hasUpvoted}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
        hasUpvoted 
          ? 'bg-red-500/20 border-red-500/50 text-red-400 cursor-default' 
          : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-300'
      }`}
      title={hasUpvoted ? "You have already upvoted this" : "Upvote this scam report"}
    >
      <span className={`text-lg transition-transform duration-200 ${isHovered && !hasUpvoted ? 'scale-125' : ''}`}>
        🔥
      </span>
      <span className="font-bold font-mono text-lg">{upvotes}</span>
    </button>
  );
}
