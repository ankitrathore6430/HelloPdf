import React from 'react';
import { FileText, Shield, CheckCircle2, Lock } from 'lucide-react';
import { CATEGORIES } from '../data/toolsData';
import { ToolCategory } from '../types';

interface FooterProps {
  onSelectCategory: (cat: ToolCategory) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory }) => {
  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-neutral-300 pt-12 pb-8 border-t border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black shadow-sm">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Hello <span className="text-red-500">PDF</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The complete, modern, 100% client-side PDF tool suite. Over 108 free tools to merge, split, compress, convert, edit, and sign documents directly on your device.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>100% Private • In-Browser Processing</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-2.5 md:col-span-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top Categories</h4>
            <ul className="space-y-1.5 text-xs text-neutral-400">
              {CATEGORIES.slice(1, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.id);
                      window.scrollTo({ top: 500, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name} ({cat.count})
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Popular Ranked Tools */}
          <div className="space-y-2.5 md:col-span-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Popular Tools</h4>
            <ul className="space-y-1.5 text-xs text-neutral-400">
              <li>#1 Merge PDF Files</li>
              <li>#2 Split PDF Pages</li>
              <li>#3 Compress PDF Size</li>
              <li>#4 PDF to JPG Image</li>
              <li>#5 JPG & PNG to PDF</li>
              <li>#6 Rotate PDF Pages</li>
              <li>#7 Protect PDF Password</li>
              <li>#13 Sign PDF Document</li>
            </ul>
          </div>

          {/* Col 4: Security & Privacy */}
          <div className="space-y-3 md:col-span-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Security & Privacy</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your files never leave your device. All document calculations, transformations, and renderings occur purely in your local browser sandbox.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 text-emerald-400 text-xs font-bold border border-neutral-700">
              <Lock className="w-3.5 h-3.5" />
              <span>End-to-End Client Isolation</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2026 Hello PDF. All 108 tools run entirely on client-side WebAssembly & Canvas.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero telemetry</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero server storage</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>All 108 Pro Tools 100% Free Forever</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
