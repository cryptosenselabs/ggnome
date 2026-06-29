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
            <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono border border-slate-200">
              CA: HbRp...pump
            </code>
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
          <div className="px-3 py-2">
            <code className="block bg-slate-50 text-slate-600 px-3 py-2 rounded text-xs font-mono border border-slate-200 break-all">
              CA: HbRpHGekMEE8eMpbNsM4GYS2FNMybGpUQGXR92axpump
            </code>
          </div>
          <div className="px-3 pt-2">
             <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-3 rounded-lg text-base font-semibold transition-colors shadow-sm">
              Visit WhaleScanner
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
