import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { Compass, Sparkles, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AFTERWORLD — Every place has a past. Every place has a possible future.',
  description: 'Turns real places into portals through time with grounded historical facts and speculative futures.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#1c1c1a] antialiased selection:bg-[#2e6059]/15 selection:text-[#2e6059]">
        {/* Editorial Top Navigation Header */}
        <header className="border-b border-[#e8e5de] bg-[#fbf9f5]/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="group flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2e6059] flex items-center justify-center text-white shadow-xs group-hover:bg-[#254f49] transition-colors">
                  <Compass className="w-4 h-4 transition-transform group-hover:rotate-45 duration-300" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold tracking-[0.22em] text-base text-[#1c1c1a] leading-none">
                    AFTERWORLD
                  </span>
                  <span className="text-[10px] text-[#73716b] tracking-wider uppercase mt-0.5">
                    Temporal Portal
                  </span>
                </div>
              </Link>
            </div>

            <div className="hidden md:block text-center">
              <p className="text-xs text-[#73716b] italic tracking-wide">
                &ldquo;Every place has a past. Every place has a possible future.&rdquo;
              </p>
            </div>

            {/* Navigation links */}
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-xs uppercase tracking-wider font-medium text-[#1c1c1a] hover:text-[#2e6059] transition-colors"
              >
                Explore
              </Link>
              <a
                href="#about"
                className="text-xs uppercase tracking-wider font-medium text-[#73716b] hover:text-[#1c1c1a] transition-colors"
              >
                About
              </a>
              <Link
                href="/place/colosseum-rome"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#eef5f4] text-[#2e6059] border border-[#d6eae7] hover:bg-[#dff0ee] transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Featured Site</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Editorial Footer */}
        <footer id="about" className="border-t border-[#e8e5de] bg-[#f7f5ee] py-12 mt-16 text-xs text-[#73716b]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <span className="tracking-[0.2em] font-semibold text-sm text-[#1c1c1a]">AFTERWORLD</span>
                <p className="text-xs text-[#73716b] leading-relaxed">
                  A minimal time-travel portal built for mindful real-world exploration. Combining verified historical ground truth with disciplined speculative fiction.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold uppercase tracking-wider text-[#1c1c1a] text-[11px]">Core Philosophy</h4>
                <p className="text-xs text-[#73716b] leading-relaxed">
                  Historical stories cite real source material and never invent facts. Future stories are creative contemplation labeled as speculation.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold uppercase tracking-wider text-[#1c1c1a] text-[11px]">Technology Stack</h4>
                <p className="text-xs text-[#73716b] leading-relaxed">
                  Next.js, Open-Weight Gemma model, OpenStreetMap & Leaflet, Nominatim Geocoding, and MongoDB Atlas.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#e8e5de] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
              <span>&copy; {new Date().getFullYear()} AFTERWORLD. Built for real-world exploration.</span>
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#2e6059]" /> OpenStreetMap Data
                </span>
                <span>Open-Weight Narrative Engine</span>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
