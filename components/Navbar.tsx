import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex flex-col lg:flex-row items-center justify-between bg-[hsl(222,47%,8%)] border border-cyan-900/50 rounded-2xl p-4 mb-10 shadow-lg shadow-cyan-900/10 relative z-50">
      <div className="flex flex-col mb-4 lg:mb-0 w-full lg:w-auto text-center lg:text-left">
        <Link href="/">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide cursor-pointer">
            Garden Gnome <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">$GNOME</span>
          </h1>
        </Link>
        <p className="text-xs md:text-sm text-gray-400 italic">Community. Mission. Utility.</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto justify-center lg:justify-end overflow-hidden">
        <div className="flex items-center gap-4">
          <Link href="/shame" className="text-gray-300 hover:text-white font-medium transition-colors cursor-pointer">
            Wall of Shame
          </Link>
          <Link href="/fame" className="text-gray-300 hover:text-white font-medium transition-colors cursor-pointer">
            Wall of Fame
          </Link>
          <a href="https://whalescanner.com" target="_blank" rel="noopener noreferrer" className="bg-[#0e7490] hover:bg-[#0891b2] text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-cyan-900/20 border border-cyan-500/50">
            WhaleScanner
          </a>
        </div>
        <code className="hidden lg:block text-cyan-400 font-mono text-xs bg-[#0b140b] px-3 py-2 rounded-lg border border-cyan-900/50 text-center shadow-inner">
          <span className="text-cyan-500 font-bold mr-1">CA:</span> 
          HbRpHGekMEE8eMpbNsM4GYS2FNMybGpUQGXR92axpump
        </code>
        <div className="flex gap-2">
          <a href="https://www.chaosgnome.xyz/" target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10" title="Website">
            🌐
          </a>
          <a href="https://x.com/GardenGnomeCoin" target="_blank" rel="noopener noreferrer" className="bg-[#000000] border border-gray-700 hover:border-gray-500 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10" title="Twitter">
            𝕏
          </a>
          <a href="https://t.me/gardengnomecoin" target="_blank" rel="noopener noreferrer" className="bg-[#24A1DE] hover:bg-[#1d87ba] text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10" title="Telegram">
            ✈️
          </a>
        </div>
      </div>
    </nav>
  );
}
