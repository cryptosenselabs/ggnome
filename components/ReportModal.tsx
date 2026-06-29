'use client';

import { useState } from 'react';
import ReportScamForm from './ReportScamForm';

export default function ReportModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[#635bff] hover:bg-[#0a2540] text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Submit Report
      </button>
    );
  }

  return (
    <>
      <div className="h-[44px]"></div>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a2540]/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200">
          
          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute -top-10 right-0 text-white hover:text-gray-200 font-semibold text-sm flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Close
          </button>
          
          <ReportScamForm onSuccess={() => setIsOpen(false)} />
          
        </div>
      </div>
    </>
  );
}
