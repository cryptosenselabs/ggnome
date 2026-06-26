'use client';

import { useState } from 'react';
import ReportScamForm from './ReportScamForm';

export default function ReportModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all transform hover:scale-105 flex items-center gap-2 text-lg"
      >
        <span>🕵️</span> Do you want to report a scam?
      </button>
    );
  }

  return (
    <>
      {/* Trigger Button (hidden when open, but keeps layout) */}
      <div className="h-[52px]"></div>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200">
          
          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute -top-12 right-0 text-white hover:text-red-400 font-bold text-lg flex items-center gap-2 transition-colors"
          >
            ✕ Close
          </button>
          
          {/* Form */}
          <ReportScamForm onSuccess={() => setIsOpen(false)} />
          
        </div>
      </div>
    </>
  );
}
