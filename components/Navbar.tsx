'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-card border-b border-border-subtle sticky top-0 z-50 w-full shadow-sm">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-heading tracking-tight">
                Garden Gnome <span className="text-primary">$GNOME</span>
              </h1>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/shame" className="text-sm font-medium text-foreground hover:text-heading transition-colors">
              Wall of Shame
            </Link>
            <Link href="/fame" className="text-sm font-medium text-foreground hover:text-heading transition-colors">
              Wall of Fame
            </Link>
            <div className="flex items-center gap-3 mr-2">
              <a href="https://x.com/GardenGnomeCoin" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity" aria-label="X (Twitter)">
                <svg className="w-5 h-5 invert" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://t.me/gnomeofficial" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity" aria-label="Telegram">
                <svg className="w-5 h-5 invert" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.31-.346-.11l-6.4 4.027-2.76-.86c-.6-.188-.61-.6.126-.89l10.81-4.17c.5-.188.944.116.808.854z"/></svg>
              </a>
            </div>
            <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              WhaleScanner
            </a>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-foreground hover:text-heading focus:outline-none p-2 -mr-2">
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
        <div className="md:hidden bg-card border-t border-border-subtle px-4 pt-2 pb-4 space-y-2 shadow-lg absolute w-full left-0 top-[65px]">
          <Link href="/shame" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-heading hover:text-primary hover:bg-background transition-colors">
            Wall of Shame
          </Link>
          <Link href="/fame" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-heading hover:text-primary hover:bg-background transition-colors">
            Wall of Fame
          </Link>
          <div className="px-3 pt-2 pb-2 border-t border-border-subtle flex items-center justify-between">
             <div className="flex gap-4 p-2">
               <a href="https://x.com/GardenGnomeCoin" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity" aria-label="X (Twitter)">
                 <svg className="w-6 h-6 invert" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
               </a>
               <a href="https://t.me/gnomeofficial" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity" aria-label="Telegram">
                 <svg className="w-6 h-6 invert" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.31-.346-.11l-6.4 4.027-2.76-.86c-.6-.188-.61-.6.126-.89l10.81-4.17c.5-.188.944.116.808.854z"/></svg>
               </a>
             </div>
             <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-base font-semibold transition-colors shadow-sm">
              Visit WhaleScanner
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

