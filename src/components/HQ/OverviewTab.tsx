import React, { useMemo } from 'react';
import type { MissionStats, Contract, RocketModel } from '../../types/game';
import { Rocket, Satellite, DollarSign, Award, TrendingUp, Radio, Activity, ArrowRight, ClipboardList, Orbit, Anchor, CheckCircle2 } from 'lucide-react';

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
  return Array.from({ length: 90 }, () => ({
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
  science,
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

  const onboardingSteps = [
    {
      icon: ClipboardList,
      title: '1. Accept a Contract',
      desc: 'Pick a client payload from the Mission Contracts manifest.',
    },
    {
      icon: Orbit,
      title: '2. Reach Orbit',
      desc: 'Ride the ascent profile and deploy the payload on target.',
    },
    {
      icon: Anchor,
      title: '3. Land the Booster',
      desc: 'Guide the first stage onto the ocean drone ship to refly it cheaper.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-[#0d1428] to-indigo-950/70 p-6 md:p-10 min-h-[320px] flex items-center">
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

        {/* Nebula glows */}
        <div className="absolute -top-24 -right-16 w-[28rem] h-[28rem] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Mission Operations Live
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Command the Launch.
            <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
              Land the Future.
            </span>
          </h2>
          <p className="text-sm md:text-base text-slate-300 mt-4 leading-relaxed max-w-xl">
            Execute precision launches, deploy orbital constellation nodes for continuous passive income, and master propulsive booster recovery on ocean drone ships.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              onClick={onNavigateToContracts}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Rocket className="w-4 h-4" />
              <span>COMMENCE LAUNCH MANIFEST</span>
            </button>
            <div className="text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-semibold">${cash.toLocaleString()}</span> treasury ready
            </div>
          </div>
        </div>

        {/* Floating rocket illustration */}
        <div className="absolute right-10 md:right-20 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none">
          <div className="animate-hover-drift">
            <Rocket className="w-28 h-28 text-cyan-300/90 -rotate-45 drop-shadow-[0_0_25px_rgba(34,211,238,0.45)]" />
          </div>
          <div className="absolute -bottom-8 left-1/2 w-14 h-8 bg-gradient-to-t from-transparent via-orange-400/50 to-cyan-400/40 rounded-full blur-md animate-exhaust-pulse"></div>
        </div>
      </div>

      {/* First-flight onboarding checklist */}
      {isNewCommander && (
        <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900/70 to-slate-900/70 border border-cyan-800/40 rounded-xl p-5">
          <h3 className="text-sm font-mono text-cyan-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Flight Director Onboarding — Your First Mission
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {onboardingSteps.map(step => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-start gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{step.title}</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next recommended mission */}
      {nextMission && nextMissionRocket && (
        <button
          onClick={onNavigateToContracts}
          className="w-full text-left bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-700/60 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group"
        >
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Next Recommended Mission</div>
              <div className="text-base font-bold text-white mt-0.5">{nextMission.title}</div>
              <div className="text-xs text-slate-400 mt-1">
                {nextMission.client} • Fly on {nextMissionRocket.name} • Reward{' '}
                <span className="text-emerald-400 font-mono">${nextMission.rewardCash.toLocaleString()}</span>
                {' '}+{' '}
                <span className="text-purple-300 font-mono">{nextMission.rewardScience} sci</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 pl-14 sm:pl-0">
            {nextMissionAffordable ? (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300">
                FUNDED & READY
              </span>
            ) : (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-700/50 text-amber-300">
                NEEDS ${(nextMissionRocket.cost - cash).toLocaleString()}
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      )}

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
