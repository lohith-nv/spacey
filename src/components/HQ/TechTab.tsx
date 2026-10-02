import React from 'react';
import type { TechUpgrade } from '../../types/game';
import { ARIA_TIERS } from '../../data/initialData';
import { Atom, Compass, Wind, Anchor, Bot, Radio, Check, ChevronUp, Cpu, Fuel, CheckCircle2 } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface TechTabProps {
  techTree: TechUpgrade[];
  science: number;
  ariaTier?: number;
  onUpgradeTech: (techId: string) => void;
}

export const TechTab: React.FC<TechTabProps> = ({ techTree, science, ariaTier = 0, onUpgradeTech }) => {
  const getCategoryIcon = (category: TechUpgrade['category']) => {
    switch (category) {
      case 'recovery':
        return <Anchor className="w-4 h-4 text-cyan-400" />;
      case 'avionics':
        return <Compass className="w-4 h-4 text-blue-400" />;
      case 'propulsion':
        return <Bot className="w-4 h-4 text-purple-400" />;
      case 'constellation':
        return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'depot':
        return <Fuel className="w-4 h-4 text-amber-400" />;
      default:
        return <Wind className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            R&D Laboratory & ARIA Systems
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upgrade booster recovery systems, StarStream laser links, and ARIA autonomous tiers.
          </p>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-purple-900/50 flex items-center gap-1.5 font-mono text-xs text-purple-300 shrink-0">
          <Atom className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span><strong className="text-white">{science}</strong> RP</span>
        </div>
      </div>

      {/* ARIA Autonomous Tier Stack */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            ARIA Autonomous Tier Stack
          </h3>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 rounded-full">
            Active: Tier {ariaTier}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {ARIA_TIERS.map(tierItem => {
            const isUnlocked = ariaTier >= tierItem.tier;
            const isCurrent = ariaTier === tierItem.tier;

            return (
              <div
                key={tierItem.tier}
                className={`p-2.5 rounded-lg border text-xs transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-sm'
                    : isUnlocked
                    ? 'bg-slate-900/80 border-slate-700/60'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono font-bold text-[11px] ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                    Tier {tierItem.tier}
                  </span>
                  {isUnlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500">{tierItem.gate}</span>
                  )}
                </div>
                <div className={`font-bold text-xs ${isCurrent ? 'text-cyan-300' : isUnlocked ? 'text-slate-200' : 'text-slate-400'}`}>
                  {tierItem.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                  {tierItem.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech Upgrades Grid */}
      <div>
        <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Atom className="w-3.5 h-3.5" />
          Hardware & Software Upgrades
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {techTree.map(tech => {
            const isMaxed = tech.level >= tech.maxLevel;
            const upgradeCost = tech.costScience * (tech.level + 1);
            const canAfford = science >= upgradeCost && !isMaxed;

            return (
              <div
                key={tech.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  isMaxed
                    ? 'bg-purple-950/20 border-purple-800/40 shadow-inner'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                      {getCategoryIcon(tech.category)}
                    </div>

                    {/* Level Pill */}
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 font-mono text-xs">
                      <span className="text-slate-400 text-[10px]">TIER</span>
                      <span className="text-white font-bold">{tech.level}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-slate-500">{tech.maxLevel}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-2.5 leading-snug">{tech.name}</h3>
                  <p className="text-xs text-cyan-300 mt-1 font-mono">{tech.effectDescription}</p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{tech.description}</p>
                </div>

                {/* Upgrade Button */}
                <div className="mt-4 pt-2.5 border-t border-slate-800">
                  {isMaxed ? (
                    <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-mono text-xs font-semibold flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5" /> MAX LEVEL
                    </div>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        sounds.playSuccess();
                        onUpgradeTech(tech.id);
                      }}
                      className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        canAfford
                          ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md active:scale-98'
                          : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                      }`}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>UPGRADE TIER ({upgradeCost} RP)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
