import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { RocketModel, Contract } from '../../types/game';
import { Gauge, Flame, AlertCircle, ArrowUp } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface AscentPhaseProps {
  rocket: RocketModel;
  contract: Contract;
  onAscentComplete: () => void;
  onAbort: () => void;
}

export const AscentPhase: React.FC<AscentPhaseProps> = ({
  rocket,
  contract,
  onAscentComplete,
  onAbort,
}) => {
  const [altitudeKm, setAltitudeKm] = useState(0);
  const [velocityMach, setVelocityMach] = useState(0.4);
  const [throttle, setThrottle] = useState(0.85); // 0.3 to 1.0
  const [dynamicPressureQ, setDynamicPressureQ] = useState(12); // kPa
  const [structuralStress, setStructuralStress] = useState(0); // 0 to 100%
  const [stageSeparationReady, setStageSeparationReady] = useState(false);
  const [stageSeparated, setStageSeparated] = useState(false);
  const [maxQPassed, setMaxQPassed] = useState(false);

  const throttleRef = useRef(throttle);

  useEffect(() => {
    throttleRef.current = throttle;
    sounds.updateEngineThrottle(throttle);
  }, [throttle]);

  // Audio start & stop
  useEffect(() => {
    sounds.startEngine(0.85);
    return () => {
      sounds.stopEngine();
    };
  }, []);

  const handleStageSep = useCallback(() => {
    if (stageSeparated) return;
    setStageSeparated(true);
    sounds.playBeep(1200, 0.35, 'triangle');
    setTimeout(() => {
      sounds.playSuccess();
      onAscentComplete();
    }, 1400);
  }, [stageSeparated, onAscentComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setThrottle(prev => Math.min(1.0, prev + 0.05));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setThrottle(prev => Math.max(0.3, prev - 0.05));
      } else if (e.key === ' ' && stageSeparationReady && !stageSeparated) {
        handleStageSep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stageSeparationReady, stageSeparated, handleStageSep]);

  // Ascent physics tick
  useEffect(() => {
    const interval = setInterval(() => {
      setAltitudeKm(alt => {
        if (alt >= 75) {
          if (!stageSeparationReady) {
            setStageSeparationReady(true);
            sounds.playBeep(920, 0.2, 'triangle');
          }
          return alt;
        }

        const currentT = throttleRef.current;
        const newAlt = alt + 0.7 * currentT;

        // Dynamic pressure Q peaks around 12-18km (Max-Q)
        const airDensity = Math.exp(-newAlt / 8.5);
        const currentMach = (newAlt / 75) * 5.2 + 0.4;
        setVelocityMach(currentMach);

        const currentQ = 140 * airDensity * (currentMach / 2.5) * (currentT * 1.2);
        setDynamicPressureQ(Math.round(currentQ));

        if (newAlt > 22) {
          setMaxQPassed(true);
        }

        // Stress increases if Q > 65 kPa
        if (currentQ > 65) {
          setStructuralStress(stress => Math.min(100, stress + 1.2));
          if (Math.random() < 0.2) sounds.playAlarm();
        } else {
          setStructuralStress(stress => Math.max(0, stress - 1.5));
        }

        return newAlt;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [stageSeparationReady]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-3.5 sm:p-6 shadow-2xl flex flex-col justify-between min-h-[500px]">
      {/* Background Atmosphere Transition Gradient */}
      <div
        className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
        style={{
          background:
            altitudeKm < 15
              ? 'linear-gradient(to top, #1e3a8a 0%, #0f172a 100%)'
              : altitudeKm < 45
              ? 'linear-gradient(to top, #312e81 0%, #020617 100%)'
              : 'linear-gradient(to top, #020617 0%, #000000 100%)',
          opacity: 0.9,
        }}
      ></div>

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Stage 1 Boost Phase
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white truncate">
            {rocket.name} <span className="text-slate-400 font-normal">carrying</span> {contract.title}
          </h2>
        </div>

        <button
          onClick={onAbort}
          className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 font-mono text-xs hover:bg-rose-900/60 transition-all cursor-pointer shrink-0"
        >
          Abort
        </button>
      </div>

      {/* Main Ascent Visualizer */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 my-3 items-center">
        {/* Left: Gauges */}
        <div className="grid grid-cols-3 md:grid-cols-1 gap-2 font-mono text-xs">
          {/* Altitude */}
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Altitude</span>
              <span className="text-cyan-300 font-bold">{altitudeKm.toFixed(1)} km</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1.5">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, (altitudeKm / 75) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[9px] text-slate-500 mt-1">MECO: 75 km</div>
          </div>

          {/* Velocity Mach */}
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Velocity</span>
              <span className="text-emerald-400 font-bold">M {velocityMach.toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1.5">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, (velocityMach / 6) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">
              {Math.round(velocityMach * 1234.8)} km/h
            </div>
          </div>

          {/* Dynamic Pressure Q */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            dynamicPressureQ > 65
              ? 'bg-rose-950/60 border-rose-700/80 animate-pulse'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3 text-amber-400" /> Max-Q
              </span>
              <span className={`font-bold ${dynamicPressureQ > 65 ? 'text-rose-400' : 'text-amber-300'}`}>
                {dynamicPressureQ} kPa
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  dynamicPressureQ > 65 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (dynamicPressureQ / 85) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">
              {maxQPassed ? 'Passed ✓' : 'Limit: 65'}
            </div>
          </div>
        </div>

        {/* Center: Live Rocket Visual Render */}
        <div className="flex flex-col items-center justify-center relative py-4">
          <div className="relative flex flex-col items-center">
            {/* Structural stress warning */}
            {structuralStress > 25 && (
              <div className="absolute -top-7 bg-rose-950/90 text-rose-300 border border-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 animate-bounce z-20">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                High Max-Q Stress! Throttle Down!
              </div>
            )}

            {/* Supersonic shockwave ring at transonic Mach */}
            {velocityMach >= 0.95 && velocityMach <= 1.4 && (
              <div className="absolute top-10 w-24 h-6 rounded-full border border-white/40 bg-white/10 blur-[1px] animate-ping pointer-events-none"></div>
            )}

            {/* Rocket Body */}
            <div className="w-10 sm:w-12 h-36 sm:h-44 rounded-t-full bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 border border-slate-500 flex flex-col items-center justify-between py-2 shadow-2xl relative">
              <div className="text-[8px] font-mono font-bold text-slate-700 tracking-tighter transform -rotate-90 origin-center mt-6">
                SPACEY
              </div>
              <div className="absolute top-10 -left-1.5 w-1.5 h-3 bg-slate-700 rounded-sm"></div>
              <div className="absolute top-10 -right-1.5 w-1.5 h-3 bg-slate-700 rounded-sm"></div>

              <div className="w-7 h-3 bg-slate-800 rounded-b-md border-t border-slate-700 flex justify-around items-end">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-b-sm"></div>
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-b-sm"></div>
              </div>
            </div>

            {/* Flame Plume */}
            <div
              className="w-7 rounded-b-full bg-gradient-to-b from-amber-200 via-orange-500 to-transparent blur-[1px] animate-pulse"
              style={{
                height: `${throttle * 80}px`,
                opacity: throttle > 0.1 ? 0.95 : 0,
              }}
            ></div>
          </div>
        </div>

        {/* Right: Throttle & Staging */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-xl space-y-3">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> Throttle
              </span>
              <span className="text-white font-bold font-mono text-xs">{Math.round(throttle * 100)}%</span>
            </div>

            {/* Quick Throttle Presets for Mobile */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setThrottle(0.45)}
                className={`py-1 text-[10px] font-mono rounded border transition-all cursor-pointer ${
                  Math.abs(throttle - 0.45) < 0.05
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Max-Q (45%)
              </button>
              <button
                type="button"
                onClick={() => setThrottle(0.85)}
                className={`py-1 text-[10px] font-mono rounded border transition-all cursor-pointer ${
                  Math.abs(throttle - 0.85) < 0.05
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Nominal (85%)
              </button>
              <button
                type="button"
                onClick={() => setThrottle(1.0)}
                className={`py-1 text-[10px] font-mono rounded border transition-all cursor-pointer ${
                  Math.abs(throttle - 1.0) < 0.05
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Max (100%)
              </button>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={throttle}
              onChange={e => setThrottle(parseFloat(e.target.value))}
              className="w-full mt-2.5 accent-cyan-400 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
            />
          </div>

          {/* Staging Action */}
          <div className="pt-2 border-t border-slate-800">
            {stageSeparationReady ? (
              <button
                onClick={handleStageSep}
                disabled={stageSeparated}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-mono font-bold text-xs tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse active:scale-95"
              >
                <ArrowUp className="w-4 h-4" />
                <span>{stageSeparated ? 'MECO CONFIRMED!' : 'SEPARATE STAGE 1'}</span>
              </button>
            ) : (
              <div className="text-center py-2 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-500">
                Climbing to MECO altitude (75 km)...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Ticker */}
      <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/80">
        <div>
          Status: {stageSeparated ? 'MECO & Separation confirmed' : maxQPassed ? 'Supersonic climb' : 'Ascending'}
        </div>
        <div className="text-cyan-400">Booster Recovery: READY</div>
      </div>
    </div>
  );
};
