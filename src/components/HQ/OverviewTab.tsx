import React from 'react';
import type { MissionStats } from '../../types/game';
import { Rocket, Satellite, DollarSign, Award, TrendingUp, Radio, Activity } from 'lucide-react';

interface OverviewTabProps {
  stats: MissionStats;
  satellites: number;
  passiveRate: number;
  cash: number;
  science: number;
  onNavigateToContracts: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  satellites,
  passiveRate,
  cash,
  science,
  onNavigateToContracts,
}) => {
  const recoveryRate = stats.totalLaunches > 0
    ? Math.round((stats.boostersLanded / stats.totalLaunches) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Mission Operations Live
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Commercial Launch Command & Orbital Grid
          </h2>
          <p className="text-sm md:text-base text-slate-300 mt-2 leading-relaxed">
            Execute precision launches, deploy orbital constellation nodes to build continuous passive income, and master propulsive booster recovery on ocean drone ships.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={onNavigateToContracts}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Rocket className="w-4 h-4" />
              <span>COMMENCE LAUNCH MANIFEST</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orbit Constellation Network Radar Screen */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Satellite className="w-4 h-4 text-cyan-400" />
              Low Earth Orbit (LEO) Telemetry Array
            </h3>
            <p className="text-xs text-slate-400">
              {satellites} active nodes beaming high-bandwidth telecommunications
            </p>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-300 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            Passive Constellation Revenue: <strong className="text-white">+${passiveRate}/sec</strong>
          </div>
        </div>

        {/* Constellation Simulation Canvas / Graphic */}
        <div className="h-44 md:h-52 w-full bg-slate-950 rounded-xl border border-slate-800/80 relative flex items-center justify-center overflow-hidden">
          {/* Background grid lines */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          ></div>

          {/* Central Earth Globe */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-600 via-emerald-600 to-indigo-950 shadow-2xl shadow-blue-500/30 flex items-center justify-center border border-cyan-400/40 z-10">
            <div className="absolute inset-0 rounded-full border border-cyan-300/30 animate-pulse"></div>
            <div className="text-[11px] font-mono font-bold text-white/90 uppercase tracking-widest text-center px-2">
              EARTH
              <div className="text-[9px] text-cyan-200 font-normal">STATION ALPHA</div>
            </div>
          </div>

          {/* Orbital Rings */}
          <div className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-cyan-500/20 border-dashed animate-spin" style={{ animationDuration: '60s' }}>
            {Array.from({ length: Math.min(satellites, 12) }).map((_, i) => {
              const angle = (i * 360) / Math.min(satellites, 12);
              const rad = (angle * Math.PI) / 180;
              const radius = 130;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;

              return (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/60 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                </div>
              );
            })}
          </div>

          {satellites === 0 && (
            <div className="absolute bottom-3 text-center text-xs font-mono text-slate-500 z-20">
              No constellation satellites deployed yet. Complete "Constellation Node" contracts to begin earning passive revenue!
            </div>
          )}
        </div>
      </div>

      {/* Lifetime Performance Statistics Grid */}
      <div>
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Enterprise Flight Telemetry
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <Rocket className="w-4 h-4 text-cyan-400" />
              Total Launches
            </div>
            <div className="font-mono-numbers text-2xl font-bold text-white mt-1">
              {stats.totalLaunches}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
              {stats.successfulOrbits} Orbits Achieved
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <Award className="w-4 h-4 text-amber-400" />
              Boosters Recovered
            </div>
            <div className="font-mono-numbers text-2xl font-bold text-amber-300 mt-1">
              {stats.boostersLanded}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {recoveryRate}% Recovery Rate
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Reusability Savings
            </div>
            <div className="font-mono-numbers text-2xl font-bold text-emerald-400 mt-1">
              ${stats.totalSavings.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-500 font-mono mt-0.5">
              Saved via Drone Ship Refurb
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <DollarSign className="w-4 h-4 text-purple-400" />
              Total Lifetime Gross
            </div>
            <div className="font-mono-numbers text-2xl font-bold text-purple-300 mt-1">
              ${stats.totalEarnings.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Cash: ${cash.toLocaleString()} | {science} Sci
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
