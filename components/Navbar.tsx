'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full shadow-sm">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0a2540] tracking-tight">
                Garden Gnome <span className="text-[#dc2626]">$GNOME</span>
              </h1>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/shame" className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors">
              Wall of Shame
            </Link>
            <Link href="/fame" className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors">
              Wall of Fame
            </Link>
            <a href="https://x.com/GardenGnomeCoin" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#0a2540] transition-colors mr-2" aria-label="X (Twitter)">
              <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              WhaleScanner
            </a>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-[#0a2540] focus:outline-none p-2 -mr-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-2 shadow-lg absolute w-full left-0 top-[65px]">
          <Link href="/shame" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-[#dc2626] hover:bg-slate-50 transition-colors">
            Wall of Shame
          </Link>
          <Link href="/fame" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-[#dc2626] hover:bg-slate-50 transition-colors">
            Wall of Fame
          </Link>
          <div className="px-3 pt-2 pb-2 border-t border-gray-100 flex items-center justify-between">
             <a href="https://x.com/GardenGnomeCoin" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#0a2540] transition-colors p-2" aria-label="X (Twitter)">
               <svg className="w-6 h-6 fill-currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
             </a>
             <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-6 py-2.5 rounded-lg text-base font-semibold transition-colors shadow-sm">
              Visit WhaleScanner
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
