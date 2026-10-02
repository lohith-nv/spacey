import React, { useMemo } from 'react';
import type { MissionStats, Contract, RocketModel } from '../../types/game';
import { Rocket, Satellite, DollarSign, Award, TrendingUp, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OverviewTabProps {
  stats: MissionStats;
  satellites: number;
  passiveRate: number;
  cash: number;
  science: number;
  contracts: Contract[];
  rockets: RocketModel[];
  onNavigateToContracts: () => void;
}

interface Star {
  left: string;
  top: string;
  size: number;
  delay: string;
  duration: string;
}

// Deterministic twinkling starfield for the hero banner, generated once (seeded PRNG)
const HERO_STARS: Star[] = (() => {
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 60 }, () => ({
    left: `${rand() * 100}%`,
    top: `${rand() * 100}%`,
    size: rand() < 0.85 ? 1 : 2,
    delay: `${(rand() * 4).toFixed(2)}s`,
    duration: `${(2 + rand() * 3.5).toFixed(2)}s`,
  }));
})();

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  satellites,
  passiveRate,
  cash,
  contracts,
  rockets,
  onNavigateToContracts,
}) => {
  const recoveryRate = stats.totalLaunches > 0
    ? Math.round((stats.boostersLanded / stats.totalLaunches) * 100)
    : 0;

  // First contract flyable by an unlocked rocket = the player's next objective
  const nextMission = useMemo(() => {
    return contracts.find(contract =>
      rockets.some(r => r.unlocked && r.payloadCapacityKg >= contract.payloadMassKg)
    );
  }, [contracts, rockets]);

  const nextMissionRocket = nextMission
    ? rockets.find(r => r.unlocked && r.payloadCapacityKg >= nextMission.payloadMassKg)
    : undefined;
  const nextMissionAffordable = nextMissionRocket ? cash >= nextMissionRocket.cost : false;

  const isNewCommander = stats.totalLaunches === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-[#0d1428] to-indigo-950/60 p-4 sm:p-7 min-h-[200px] sm:min-h-[250px] flex items-center">
        {/* Twinkling starfield */}
        <div className="absolute inset-0 pointer-events-none">
          {HERO_STARS.map((star, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-cyan-100 animate-twinkle"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
            />
          ))}
        </div>

        {/* Ambient glows */}
        <div className="absolute -top-20 -right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-[10px] font-mono uppercase tracking-wider mb-2 sm:mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            Mission Operations Live
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Launch Commercial Payloads.
            <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
              Recover & Re-fly Boosters.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 sm:mt-3 leading-relaxed">
            Deploy satellites to build recurring orbital revenue and guide rocket boosters back to ocean drone ships for massive reusability savings.
          </p>

          <div className="mt-4 sm:mt-5 flex items-center gap-3">
            <button
              onClick={onNavigateToContracts}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Rocket className="w-4 h-4" />
              <span>COMMENCE LAUNCH</span>
            </button>
            <div className="text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 font-semibold">${cash.toLocaleString()}</span> ready
            </div>
          </div>
        </div>

        {/* Floating rocket illustration */}
        <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none">
          <div className="animate-hover-drift">
            <Rocket className="w-20 h-20 text-cyan-300/80 -rotate-45 drop-shadow-[0_0_20px_rgba(34,211,238,0.35)]" />
          </div>
        </div>
      </div>

      {/* First-flight onboarding pill (Only for new commanders) */}
      {isNewCommander && (
        <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3.5 sm:p-4">
          <div className="text-xs font-mono text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Quick Flight Steps
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
              <span className="text-cyan-400 font-bold font-mono">1. Select Contract</span>
              <p className="text-slate-400 text-[11px] mt-0.5">Pick a customer payload in Missions.</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
              <span className="text-cyan-400 font-bold font-mono">2. Ascent & Staging</span>
              <p className="text-slate-400 text-[11px] mt-0.5">Ascend to 75 km Karman line for orbit.</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
              <span className="text-cyan-400 font-bold font-mono">3. Land on Drone Ship</span>
              <p className="text-slate-400 text-[11px] mt-0.5">Burn retros to recover the booster!</p>
            </div>
          </div>
        </div>
      )}

      {/* Next Recommended Mission */}
      {nextMission && nextMissionRocket && (
        <button
          onClick={onNavigateToContracts}
          className="w-full text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-700/60 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Next Recommended Mission</div>
              <div className="text-sm font-bold text-white truncate">{nextMission.title}</div>
              <div className="text-[11px] text-slate-400 truncate">
                {nextMissionRocket.name} • <span className="text-emerald-400 font-mono font-semibold">+${nextMission.rewardCash.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {nextMissionAffordable ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300">
                READY
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/50 text-amber-300">
                NEED ${(nextMissionRocket.cost - cash).toLocaleString()}
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>
      )}

      {/* KPI Performance Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            Launches
          </div>
          <div className="font-mono-numbers text-xl sm:text-2xl font-bold text-white mt-1">
            {stats.totalLaunches}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            {stats.successfulOrbits} Orbits
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Recovered
          </div>
          <div className="font-mono-numbers text-xl sm:text-2xl font-bold text-amber-300 mt-1">
            {stats.boostersLanded}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {recoveryRate}% Recovery Rate
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Reused Savings
          </div>
          <div className="font-mono-numbers text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
            ${stats.totalSavings >= 1_000_000 ? `${(stats.totalSavings / 1_000_000).toFixed(1)}M` : stats.totalSavings.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-500 font-mono">
            Fleet Refurbish
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            <DollarSign className="w-3.5 h-3.5 text-purple-400" />
            Lifetime Gross
          </div>
          <div className="font-mono-numbers text-xl sm:text-2xl font-bold text-purple-300 mt-1">
            ${stats.totalEarnings >= 1_000_000 ? `${(stats.totalEarnings / 1_000_000).toFixed(1)}M` : stats.totalEarnings.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Total Revenue
          </div>
        </div>
      </div>

      {/* Orbit Constellation Telemetry Array */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">LEO Constellation Array</h3>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
              {satellites} Active Nodes
            </span>
          </div>

          <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>+${passiveRate}/s</span>
          </div>
        </div>

        {/* Orbit Visualization */}
        <div className="h-32 sm:h-40 w-full bg-slate-950 rounded-xl border border-slate-800/80 relative flex items-center justify-center overflow-hidden">
          {/* Earth Globe */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-600 via-emerald-600 to-indigo-950 shadow-xl shadow-blue-500/20 flex items-center justify-center border border-cyan-400/40 z-10">
            <div className="text-[9px] font-mono font-bold text-white uppercase tracking-wider text-center">
              EARTH
            </div>
          </div>

          {/* Orbit Rings */}
          <div className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full border border-cyan-500/20 border-dashed animate-spin" style={{ animationDuration: '45s' }}>
            {Array.from({ length: Math.min(satellites, 10) }).map((_, i) => {
              const angle = (i * 360) / Math.min(satellites, 10);
              const rad = (angle * Math.PI) / 180;
              const radius = 80;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;

              return (
                <div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 shadow shadow-cyan-400 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                >
                  <span className="w-1 h-1 rounded-full bg-white block m-auto mt-0.5 animate-ping"></span>
                </div>
              );
            })}
          </div>

          {satellites === 0 && (
            <div className="absolute bottom-2 text-center text-[10px] font-mono text-slate-500 z-20">
              Launch "Constellation Node" contracts to generate continuous passive revenue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
