import React, { useEffect, useState } from 'react';
import type { RocketModel, Contract } from '../../types/game';
import { sounds } from '../../utils/audio';
import { CheckCircle2, Play, AlertOctagon } from 'lucide-react';

interface CountdownPhaseProps {
  rocket: RocketModel;
  contract: Contract;
  onLiftoff: () => void;
  onAbort: () => void;
}

export const CountdownPhase: React.FC<CountdownPhaseProps> = ({
  rocket,
  contract,
  onLiftoff,
  onAbort,
}) => {
  const [seconds, setSeconds] = useState(5);
  const [checks, setChecks] = useState([
    { label: 'Range Safety', ok: true },
    { label: 'Cryo Chilldown', ok: false },
    { label: 'Flight Computer', ok: false },
    { label: 'Drone Ship Telemetry', ok: false },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timer);
          sounds.playCountdown(true);
          setTimeout(() => {
            onLiftoff();
          }, 500);
          return 0;
        }

        sounds.playCountdown(false);

        // Progressively mark checklist as OK
        if (s <= 4) setChecks(prev => [{ ...prev[0], ok: true }, { ...prev[1], ok: true }, prev[2], prev[3]]);
        if (s <= 3) setChecks(prev => [prev[0], prev[1], { ...prev[2], ok: true }, prev[3]]);
        if (s <= 2) setChecks(prev => [prev[0], prev[1], prev[2], { ...prev[3], ok: true }]);

        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onLiftoff]);

  const handleSkip = () => {
    sounds.playCountdown(true);
    onLiftoff();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl flex flex-col justify-between min-h-[460px] sm:min-h-[500px]">
      {/* Launch Pad Atmosphere Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a1226] to-[#050b18] pointer-events-none"></div>

      {/* Cryogenic steam venting animations */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none animate-pulse"></div>

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Launch Pad 39-A • Automated Sequence
          </div>
          <h2 className="text-base sm:text-xl font-bold text-white mt-0.5">
            {rocket.name} <span className="text-slate-400 font-normal">carrying</span> {contract.title}
          </h2>
        </div>

        <button
          onClick={onAbort}
          className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 font-mono text-xs hover:bg-rose-900/60 transition-all cursor-pointer flex items-center gap-1"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hold /</span> Abort
        </button>
      </div>

      {/* Center Countdown Display & Rocket Staging Pad */}
      <div className="relative z-10 my-6 flex flex-col items-center justify-center text-center">
        {/* Rocket Pad Silhouette */}
        <div className="relative mb-6 flex flex-col items-center">
          {/* Umbilical Service Arm */}
          <div className="absolute -left-12 top-6 w-12 h-1 bg-slate-700"></div>
          <div className="absolute -left-12 top-6 w-1 h-20 bg-slate-700"></div>

          {/* Rocket Vehicle Illustration */}
          <div className="w-10 sm:w-12 h-36 sm:h-44 rounded-t-full bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 border border-slate-400 flex flex-col items-center justify-between py-2 shadow-2xl relative">
            <div className="text-[8px] font-mono font-bold text-slate-700 tracking-tighter transform -rotate-90 origin-center mt-6">
              SPACEY
            </div>
            {/* Grid Fins */}
            <div className="absolute top-10 -left-1.5 w-1.5 h-3 bg-slate-700 rounded-sm"></div>
            <div className="absolute top-10 -right-1.5 w-1.5 h-3 bg-slate-700 rounded-sm"></div>
            {/* Engines */}
            <div className="w-7 h-3 bg-slate-800 rounded-b-md flex justify-around items-end">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-b-sm"></div>
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-b-sm"></div>
            </div>
          </div>

          {/* Launch Mount Pad */}
          <div className="w-28 sm:w-36 h-4 bg-slate-800 rounded-t border-t border-slate-600 mt-0.5"></div>
        </div>

        {/* Big Countdown Timer */}
        <div className="font-mono-numbers text-6xl sm:text-8xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span className="text-cyan-400">T-</span>
          <span>{String(seconds).padStart(2, '0')}</span>
          <span className="text-xs font-mono text-slate-500 font-normal self-end mb-3">SEC</span>
        </div>

        <div className="text-xs sm:text-sm font-mono text-emerald-400 mt-2">
          {seconds === 0 ? 'MAIN ENGINE IGNITION & LIFTOFF!' : 'Flight Computer Poll: ALL SYSTEMS GO'}
        </div>
      </div>

      {/* Pre-launch Diagnostic Checklist Pills */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${c.ok ? 'text-emerald-400' : 'text-slate-600'}`} />
            <span className={`truncate ${c.ok ? 'text-slate-200' : 'text-slate-500'}`}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom Ignition Button */}
      <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
        <div className="text-xs font-mono text-slate-400">
          Target Orbit: <span className="text-cyan-300 font-bold">250 km LEO</span>
        </div>

        <button
          onClick={handleSkip}
          className="px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-mono font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-orange-500/25 cursor-pointer active:scale-95 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>IGNITE NOW</span>
        </button>
      </div>
    </div>
  );
};
