import React from 'react';
import type { TechUpgrade } from '../../types/game';
import { Atom, Compass, Wind, Anchor, Bot, Radio, Check, ChevronUp } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface TechTabProps {
  techTree: TechUpgrade[];
  science: number;
  onUpgradeTech: (techId: string) => void;
}

export const TechTab: React.FC<TechTabProps> = ({ techTree, science, onUpgradeTech }) => {
  const getCategoryIcon = (category: TechUpgrade['category']) => {
    switch (category) {
      case 'recovery':
        return <Anchor className="w-5 h-5 text-cyan-400" />;
      case 'avionics':
        return <Compass className="w-5 h-5 text-blue-400" />;
      case 'propulsion':
        return <Bot className="w-5 h-5 text-purple-400" />;
      case 'constellation':
        return <Radio className="w-5 h-5 text-emerald-400" />;
      default:
        return <Wind className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            R&D Advanced Propulsion & Recovery Laboratory
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Invest telemetry flight data into avionics, hypersonic guidance, and mega-constellation bandwidth.
          </p>
        </div>
        <div className="bg-slate-950 px-4 py-2 rounded-lg border border-purple-900/50 flex items-center gap-2 font-mono text-purple-300">
          <Atom className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span>Available Science: <strong className="text-white text-base">{science}</strong> PTS</span>
        </div>
      </div>

      {/* Tech Upgrades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {techTree.map(tech => {
          const isMaxed = tech.level >= tech.maxLevel;
          const upgradeCost = tech.costScience * (tech.level + 1);
          const canAfford = science >= upgradeCost && !isMaxed;

          return (
            <div
              key={tech.id}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                isMaxed
                  ? 'bg-purple-950/20 border-purple-800/40 shadow-inner'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                    {getCategoryIcon(tech.category)}
                  </div>

                  {/* Level Pill */}
                  <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 font-mono text-xs">
                    <span className="text-slate-400">LVL</span>
                    <span className="text-white font-bold">{tech.level}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-500">{tech.maxLevel}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mt-3 leading-snug">{tech.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{tech.description}</p>

                {/* Effect Bonus Callout */}
                <div className="mt-4 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-cyan-300">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Upgrade Perk:</div>
                  <div className="font-semibold text-cyan-300 mt-0.5">{tech.effectDescription}</div>
                </div>
              </div>

              {/* Upgrade Button */}
              <div className="mt-5 pt-3 border-t border-slate-800">
                {isMaxed ? (
                  <div className="w-full py-2 px-3 rounded-lg bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 font-mono text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> MAX RESEARCH TIER
                  </div>
                ) : (
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      sounds.playSuccess();
                      onUpgradeTech(tech.id);
                    }}
                    className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      canAfford
                        ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-lg shadow-purple-600/25 active:scale-98'
                        : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>RESEARCH TIER {tech.level + 1} ({upgradeCost} PTS)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
