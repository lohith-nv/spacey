import React, { useEffect, useState } from 'react';
import type { RocketModel, Contract } from '../../types/game';
import { sounds } from '../../utils/audio';
import { CheckCircle2, FastForward, Shield } from 'lucide-react';

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
  const [seconds, setSeconds] = useState(10);
  const [checks, setChecks] = useState<{ label: string; ok: boolean }[]>([
    { label: 'Range Safety & Airspace Clearance', ok: false },
    { label: 'Propellant Chilldown & Pressurization', ok: false },
    { label: 'Autonomous Flight Computer Synchronization', ok: false },
    { label: 'Autonomous Drone Ship Sea Coordinates', ok: false },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timer);
          sounds.playCountdown(true);
          setTimeout(() => {
            onLiftoff();
          }, 600);
          return 0;
        }

        sounds.playCountdown(false);

        // Progressively mark checklist as OK
        if (s <= 9) setChecks(prev => [{ ...prev[0], ok: true }, prev[1], prev[2], prev[3]]);
        if (s <= 7) setChecks(prev => [prev[0], { ...prev[1], ok: true }, prev[2], prev[3]]);
        if (s <= 5) setChecks(prev => [prev[0], prev[1], { ...prev[2], ok: true }, prev[3]]);
        if (s <= 3) setChecks(prev => [prev[0], prev[1], prev[2], { ...prev[3], ok: true }]);

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
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[500px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Launch Pad 39-A Integrated Telemetry
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
            {contract.title}
          </h2>
        </div>

        <button
          onClick={onAbort}
          className="px-3.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 font-mono text-xs hover:bg-rose-900/60 transition-all cursor-pointer"
        >
          Hold / Abort Count
        </button>
      </div>

      {/* Center Countdown Display */}
      <div className="my-8 text-center space-y-4">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Terminal Count Down
        </div>

        <div className="font-mono-numbers text-7xl md:text-8xl font-black tracking-tight text-white flex items-center justify-center gap-3">
          <span className="text-cyan-400">T-</span>
          <span>{String(seconds).padStart(2, '0')}</span>
          <span className="text-sm font-mono text-slate-500 font-normal self-end mb-4">SEC</span>
        </div>

        <div className="text-sm font-mono text-emerald-400">
          {seconds === 0 ? 'MAIN ENGINE IGNITION & LIFTOFF!' : 'Flight Director Poll: ALL SYSTEMS GO'}
        </div>
      </div>

      {/* Pre-launch Diagnostic Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-800 font-mono text-xs">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              c.ok ? 'text-emerald-400' : 'text-slate-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className={c.ok ? 'text-slate-200' : 'text-slate-500'}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom Controls */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Vehicle: <span className="text-white font-bold">{rocket.name}</span>
        </div>

        <button
          onClick={handleSkip}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <FastForward className="w-4 h-4" />
          <span>Skip to Ignition</span>
        </button>
      </div>
    </div>
  );
};
