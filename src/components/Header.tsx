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
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Company Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Rocket className="w-6 h-6 text-white transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-white uppercase font-mono-numbers">
                {companyName}
              </h1>
              <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-700/50 uppercase font-mono">
                FLIGHT DIR
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Autonomous Launch & Recovery Network
            </p>
          </div>
        </div>

        {/* Global Economy Telemetry Bar */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Funds */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-lg shadow-inner">
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Treasury Funds</div>
              <div className="font-mono-numbers font-bold text-emerald-400 text-base">
                ${cash.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Passive Income from Constellation */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-lg">
            <div className="p-1 rounded bg-cyan-500/10 text-cyan-400">
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Constellation ({satellites})
              </div>
              <div className="font-mono-numbers font-semibold text-cyan-300 text-sm">
                +${passiveRate}/sec
              </div>
            </div>
          </div>

          {/* Science / Research Points */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-lg">
            <div className="p-1 rounded bg-purple-500/10 text-purple-400">
              <Atom className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">R&D Science</div>
              <div className="font-mono-numbers font-bold text-purple-300 text-sm">
                {science} <span className="text-[11px] font-normal text-purple-400/80">PTS</span>
              </div>
            </div>
          </div>

          {/* Boosters Ready in Hangar */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-lg">
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Fleet Hangar</div>
              <div className="font-mono-numbers font-bold text-amber-300 text-sm">
                {hangarCount} <span className="text-[11px] font-normal text-amber-400/80">Booster{hangarCount === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>

          {/* Audio Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) {
                sounds.playBeep(880, 0.1);
              }
            }}
            title={soundEnabled ? 'Mute Audio Telemetry' : 'Unmute Audio Telemetry'}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
