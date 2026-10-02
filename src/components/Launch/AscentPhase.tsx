import React, { useEffect, useState, useRef } from 'react';
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
  const [velocityMach, setVelocityMach] = useState(0);
  const [throttle, setThrottle] = useState(0.85); // 0.2 to 1.0
  const [dynamicPressureQ, setDynamicPressureQ] = useState(10); // kPa
  const [structuralStress, setStructuralStress] = useState(0); // 0 to 100%
  const [stageSeparationReady, setStageSeparationReady] = useState(false);
  const [stageSeparated, setStageSeparated] = useState(false);
  const [maxQPassed, setMaxQPassed] = useState(false);

  const throttleRef = useRef(throttle);
  throttleRef.current = throttle;

  // Sound engine update
  useEffect(() => {
    sounds.startEngine(throttle);
    return () => {
      sounds.stopEngine();
    };
  }, []);

  useEffect(() => {
    sounds.updateEngineThrottle(throttle);
  }, [throttle]);

  // Key controls for throttle
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
  }, [stageSeparationReady, stageSeparated]);

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
        const newAlt = alt + 0.65 * currentT;

        // Dynamic pressure Q peaks around 12-18km (Max-Q)
        // Q = 0.5 * rho * v^2
        const airDensity = Math.exp(-newAlt / 8.5);
        const currentMach = (newAlt / 75) * 5.2 + 0.4;
        setVelocityMach(currentMach);

        const currentQ = 140 * airDensity * (currentMach / 2.5) * (currentT * 1.2);
        setDynamicPressureQ(Math.round(currentQ));

        if (newAlt > 24) {
          setMaxQPassed(true);
        }

        // Stress increases if Q > 75 kPa
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

  const handleStageSep = () => {
    if (stageSeparated) return;
    setStageSeparated(true);
    sounds.playBeep(1200, 0.35, 'triangle');
    setTimeout(() => {
      sounds.playSuccess();
      onAscentComplete();
    }, 1400);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[560px]">
      {/* Background Starfield / Atmosphere Gradient based on altitude */}
      <div
        className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
        style={{
          background:
            altitudeKm < 20
              ? 'linear-gradient(to top, #1e3a8a 0%, #0f172a 100%)'
              : altitudeKm < 50
              ? 'linear-gradient(to top, #312e81 0%, #020617 100%)'
              : 'linear-gradient(to top, #020617 0%, #000000 100%)',
          opacity: 0.85
        }}
      ></div>

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Stage 1 Boost Phase Telemetry
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            {rocket.name} <span className="text-sm font-normal text-slate-400">carrying</span> {contract.title}
          </h2>
        </div>

        <button
          onClick={onAbort}
          className="px-3.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 font-mono text-xs hover:bg-rose-900/60 transition-all cursor-pointer"
        >
          Flight Abort
        </button>
      </div>

      {/* Center Dynamic Visualizer */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-center">
        {/* Left: Dynamic Gauges */}
        <div className="space-y-4 font-mono text-xs">
          {/* Altitude */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Altitude</span>
              <span className="text-cyan-300 font-bold">{altitudeKm.toFixed(1)} km</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, (altitudeKm / 75) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Sea Level (0km)</span>
              <span>Karman / MECO (75km)</span>
            </div>
          </div>

          {/* Velocity Mach */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Ascent Velocity</span>
              <span className="text-emerald-400 font-bold">Mach {velocityMach.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, (velocityMach / 6) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {Math.round(velocityMach * 1234.8)} km/h
            </div>
          </div>

          {/* Dynamic Aerodynamic Pressure (Max-Q) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            dynamicPressureQ > 65
              ? 'bg-rose-950/60 border-rose-700/80 animate-pulse'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                Dynamic Pressure (Q)
              </span>
              <span className={`font-bold ${dynamicPressureQ > 65 ? 'text-rose-400' : 'text-amber-300'}`}>
                {dynamicPressureQ} kPa
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  dynamicPressureQ > 65 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (dynamicPressureQ / 85) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>{maxQPassed ? 'Max-Q Passed ✓' : 'Approaching Max-Q'}</span>
              <span>Safe limit: 65 kPa</span>
            </div>
          </div>
        </div>

        {/* Center: Live Rocket Visual Render */}
        <div className="flex flex-col items-center justify-center relative py-6">
          {/* Rocket graphic with animated exhaust plume */}
          <div className="relative flex flex-col items-center">
            {/* Structural stress warning banner */}
            {structuralStress > 30 && (
              <div className="absolute -top-10 bg-rose-950/90 text-rose-300 border border-rose-700 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 animate-bounce">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                High Max-Q Stress! Throttle Down!
              </div>
            )}

            {/* Rocket Body */}
            <div className="w-12 h-44 rounded-t-full bg-gradient-to-b from-slate-200 via-slate-100 to-slate-400 border border-slate-500 flex flex-col items-center justify-between py-2 shadow-2xl relative">
              <div className="text-[9px] font-mono font-bold text-slate-700 tracking-tighter transform -rotate-90 origin-center mt-8">
                SPACEY
              </div>

              {/* Grid Fins */}
              <div className="absolute top-12 -left-2 w-2 h-4 bg-slate-700 rounded-sm"></div>
              <div className="absolute top-12 -right-2 w-2 h-4 bg-slate-700 rounded-sm"></div>

              {/* Engine Bells */}
              <div className="w-8 h-4 bg-slate-800 rounded-b-md border-t border-slate-700 flex justify-around items-end">
                <div className="w-2 h-2 bg-amber-600 rounded-b-sm"></div>
                <div className="w-2 h-2 bg-amber-600 rounded-b-sm"></div>
              </div>
            </div>

            {/* Fire Exhaust Plume */}
            <div
              className="w-8 rounded-b-full bg-gradient-to-b from-amber-300 via-orange-500 to-transparent blur-[1px] animate-pulse"
              style={{
                height: `${throttle * 90}px`,
                opacity: throttle > 0.1 ? 0.95 : 0
              }}
            ></div>
          </div>
        </div>

        {/* Right: Throttle Control & Staging Button */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> Engine Throttle
              </span>
              <span className="text-white font-bold font-mono text-sm">{Math.round(throttle * 100)}%</span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={throttle}
              onChange={e => setThrottle(parseFloat(e.target.value))}
              className="w-full mt-3 accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>Min Thrust (30%)</span>
              <span>Nominal (85%)</span>
              <span>100% Throttle</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">
              Tip: Use <kbd className="px-1 bg-slate-800 rounded text-slate-300">W</kbd> / <kbd className="px-1 bg-slate-800 rounded text-slate-300">S</kbd> or <kbd className="px-1 bg-slate-800 rounded text-slate-300">↑</kbd> / <kbd className="px-1 bg-slate-800 rounded text-slate-300">↓</kbd> to adjust throttle
            </div>
          </div>

          {/* Staging Action */}
          <div className="pt-3 border-t border-slate-800">
            {stageSeparationReady ? (
              <button
                onClick={handleStageSep}
                disabled={stageSeparated}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-mono font-bold text-sm tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer animate-pulse active:scale-95"
              >
                <ArrowUp className="w-5 h-5" />
                <span>{stageSeparated ? 'MECO COMPLETE!' : 'MECO & STAGE SEPARATION (SPACE)'}</span>
              </button>
            ) : (
              <div className="text-center py-3 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-500">
                Ascending to MECO altitude (75 km)...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Ticker */}
      <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/80 px-4 py-2.5 rounded-lg border border-slate-800/80">
        <div>Status: {stageSeparated ? 'Stage 1 MECO & Separation confirmed' : maxQPassed ? 'Supersonic climb nominal' : 'Passing through high dynamic pressure zone'}</div>
        <div className="text-cyan-400">Stage 1 Booster Recovery: STANDBY</div>
      </div>
    </div>
  );
};
