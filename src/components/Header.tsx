import React from 'react';
import { Rocket, Satellite, Atom, Volume2, VolumeX, ShieldCheck, DollarSign } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  cash: number;
  science: number;
  satellites: number;
  passiveRate: number;
  hangarCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  companyName: string;
}

export const Header: React.FC<HeaderProps> = ({
  cash,
  science,
  satellites,
  passiveRate,
  hangarCount,
  soundEnabled,
  onToggleSound,
  companyName,
}) => {
  const formatCash = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 100_000) return `$${Math.round(val / 1000)}k`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-4 py-2 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 border border-cyan-400/30">
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-white transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-bold tracking-wider text-white uppercase font-mono-numbers">
                {companyName.split(' ')[0]}
              </span>
              <span className="hidden sm:inline-block text-[9px] tracking-widest px-1 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/50 uppercase font-mono">
                FLIGHT DIR
              </span>
            </div>
          </div>
        </div>

        {/* Global Telemetry Pill Bar */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-xs overflow-x-auto no-scrollbar py-0.5">
          {/* Funds */}
          <div
            title={`Treasury: $${cash.toLocaleString()}`}
            className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800/90 px-2 sm:px-2.5 py-1 rounded-lg shrink-0"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono-numbers font-bold text-emerald-400 text-xs sm:text-sm">
              <span className="sm:hidden">{formatCash(cash)}</span>
              <span className="hidden sm:inline">${cash.toLocaleString()}</span>
            </span>
          </div>

          {/* Constellation */}
          <div
            title={`Constellation: ${satellites} satellites (+$${passiveRate}/sec)`}
            className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 border border-slate-800/80 px-2 py-1 rounded-lg shrink-0"
          >
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono-numbers font-semibold text-cyan-300 text-xs">
              {satellites}
              {passiveRate > 0 && (
                <span className="text-[10px] text-emerald-400 ml-1 font-normal">
                  +${passiveRate}/s
                </span>
              )}
            </span>
          </div>

          {/* Science */}
          <div
            title={`R&D Science: ${science} PTS`}
            className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 border border-slate-800/80 px-2 py-1 rounded-lg shrink-0"
          >
            <Atom className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono-numbers font-bold text-purple-300 text-xs">
              {science}
              <span className="hidden sm:inline text-[10px] text-purple-400/80 font-normal ml-0.5">PTS</span>
            </span>
          </div>

          {/* Hangar */}
          <div
            title={`Recovered Boosters in Hangar: ${hangarCount}`}
            className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 border border-slate-800/80 px-2 py-1 rounded-lg shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono-numbers font-bold text-amber-300 text-xs">
              {hangarCount}
            </span>
          </div>

          {/* Audio Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) sounds.playBeep(880, 0.08);
            }}
            aria-label={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
              soundEnabled
                ? 'bg-slate-800/80 border-slate-700 text-cyan-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
