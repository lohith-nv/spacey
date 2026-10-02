import React from 'react';
import type { RocketModel, BoosterInventoryItem } from '../../types/game';
import { Atom, ShieldCheck, Wrench, Trash2, CheckCircle2, Lock, Zap } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface HangarTabProps {
  rockets: RocketModel[];
  hangarBoosters: BoosterInventoryItem[];
  science: number;
  onUnlockRocket: (rocketId: string) => void;
  onScrapBooster: (boosterId: string) => void;
}

export const HangarTab: React.FC<HangarTabProps> = ({
  rockets,
  hangarBoosters,
  science,
  onUnlockRocket,
  onScrapBooster,
}) => {
  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            Vehicle Fleet & Recovery Hangar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upgrade rocket classes and manage recovered reusable boosters.
          </p>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shrink-0">
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refurb: <strong className="text-emerald-400">READY</strong></span>
        </div>
      </div>

      {/* Rocket Classes Section */}
      <div>
        <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Rocket Classes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rockets.map(rocket => {
            const canUnlock = science >= rocket.unlockCost;
            const inStockCount = hangarBoosters.filter(b => b.rocketId === rocket.id).length;

            return (
              <div
                key={rocket.id}
                className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all ${
                  rocket.unlocked
                    ? 'bg-slate-900/70 border-slate-700/80 shadow-sm'
                    : 'bg-slate-950/70 border-slate-800/80 opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      {rocket.icon}
                    </span>
                    {rocket.unlocked ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> CERTIFIED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white mt-2.5">{rocket.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{rocket.tagline}</p>

                  {/* Compact Rocket Stats */}
                  <div className="mt-3.5 space-y-1.5 font-mono text-xs border-t border-slate-800 pt-3">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>LEO Payload Cap:</span>
                      <span className="text-slate-200 font-semibold">{rocket.payloadCapacityKg.toLocaleString()} kg</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>New Build Cost:</span>
                      <span className="text-emerald-400 font-bold font-mono-numbers">
                        ${rocket.cost.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Refurb Re-flight:</span>
                      <span className="text-cyan-400 font-bold font-mono-numbers">
                        ${Math.round(rocket.cost * rocket.refurbishCostPercent).toLocaleString()}
                        <span className="text-[10px] text-emerald-400 ml-1">
                          (-{Math.round((1 - rocket.refurbishCostPercent) * 100)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer status / Unlock button */}
                <div className="mt-4 pt-2.5 border-t border-slate-800">
                  {rocket.unlocked ? (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">In Hangar:</span>
                      <span className="font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 text-[11px]">
                        {inStockCount} {inStockCount === 1 ? 'Core' : 'Cores'}
                      </span>
                    </div>
                  ) : (
                    <button
                      disabled={!canUnlock}
                      onClick={() => {
                        sounds.playSuccess();
                        onUnlockRocket(rocket.id);
                      }}
                      className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        canUnlock
                          ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md active:scale-98'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Atom className="w-3.5 h-3.5" />
                      <span>UNLOCK ({rocket.unlockCost} SCI)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovered Boosters Inventory */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hangar Booster Inventory ({hangarBoosters.length})
          </h3>
        </div>

        {hangarBoosters.length === 0 ? (
          <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-5 text-center">
            <h4 className="text-sm font-semibold text-slate-300">No Boosters in Hangar Storage</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Land your first stage on the ocean drone ship during launch to recover it for discounted re-flight!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hangarBoosters.map(booster => (
              <div
                key={booster.id}
                className="bg-slate-900/80 border border-emerald-900/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-700/80 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950 flex items-center justify-center border border-emerald-700/50">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-white text-xs">{booster.id}</div>
                        <div className="text-[10px] text-slate-400">{booster.rocketName}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/40">
                      {booster.flightsCompleted} Flight{booster.flightsCompleted === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>Integrity:</span>
                      <span className="text-emerald-400 font-bold">{booster.condition}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${booster.condition}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Ready for flight
                  </span>

                  <button
                    onClick={() => onScrapBooster(booster.id)}
                    title="Scrap booster for parts ($35k + 10 Science)"
                    className="p-1 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-all text-[11px] flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Scrap</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
