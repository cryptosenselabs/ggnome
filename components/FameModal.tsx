'use client';

import { useState } from 'react';
import FameForm from './FameForm';

export default function FameModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        Nominate
      </button>
    );
  }

  return (
    <>
      <div className="h-[44px]"></div>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200">
          
          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute -top-10 right-0 text-white hover:text-gray-200 font-semibold text-sm flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Close
          </button>
          
          <FameForm onSuccess={() => setIsOpen(false)} />
          
        </div>
      </div>
    </>
  );
}
