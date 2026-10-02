import React from 'react';
import type { RocketModel, BoosterInventoryItem } from '../../types/game';
import { Atom, ShieldCheck, Wrench, Trash2, CheckCircle2, Lock, Zap, Compass, AlertTriangle } from 'lucide-react';
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
            Marga Fleet & Refurbishment Hangar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Certify surface launchers, orbital tugs, and manage recovered reusable cores.
          </p>
        </div>
        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shrink-0">
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refurb: <strong className="text-emerald-400 font-bold">READY</strong></span>
        </div>
      </div>

      {/* Rocket Classes Section */}
      <div>
        <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Marga Vehicle Roster
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    <div className="flex items-center gap-1.5">
                      {rocket.sanskritRoot && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                          {rocket.sanskritRoot}
                        </span>
                      )}
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
                  </div>

                  <div className="mt-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <h4 className="text-base font-bold text-white">{rocket.name}</h4>
                      {rocket.sanskritMeaning && (
                        <span className="text-[11px] text-slate-400 font-mono italic">
                          ({rocket.sanskritMeaning})
                        </span>
                      )}
                    </div>
                    {rocket.role && (
                      <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                        {rocket.role}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{rocket.tagline}</p>
                  </div>

                  {/* Compact Rocket Stats */}
                  <div className="mt-3.5 space-y-1.5 font-mono text-xs border-t border-slate-800 pt-3">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Payload Capacity:</span>
                      <span className="text-slate-200 font-semibold">{rocket.payloadCapacityKg.toLocaleString()} kg</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>New Build Cost:</span>
                      <span className="text-emerald-400 font-bold font-mono-numbers">
                        {rocket.cost.toLocaleString()} Cr
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Refurb Re-flight:</span>
                      <span className="text-cyan-400 font-bold font-mono-numbers">
                        {Math.round(rocket.cost * rocket.refurbishCostPercent).toLocaleString()} Cr
                        <span className="text-[10px] text-emerald-400 ml-1">
                          (-{Math.round((1 - rocket.refurbishCostPercent) * 100)}%)
                        </span>
                      </span>
                    </div>

                    {rocket.requiresKosha && (
                      <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-800/80">
                        <Compass className="w-3 h-3 shrink-0" />
                        <span>Requires online Kosha for NTR stage refurb</span>
                      </div>
                    )}
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
                      <span>UNLOCK ({rocket.unlockCost} RP)</span>
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
            {hangarBoosters.map(booster => {
              const matchingRocket = rockets.find(r => r.id === booster.rocketId);
              const refurbRate = booster.refurbCostMultiplier ?? (booster.isHardLanding ? 0.70 : (matchingRocket?.refurbishCostPercent ?? 0.30));
              const refurbCost = matchingRocket ? Math.round(matchingRocket.cost * refurbRate) : 0;

              return (
                <div
                  key={booster.id}
                  className={`bg-slate-900/80 rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-sm border ${
                    booster.isHardLanding
                      ? 'border-amber-800/80 hover:border-amber-600'
                      : 'border-emerald-900/60 hover:border-emerald-700/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                            booster.isHardLanding
                              ? 'bg-amber-950 border-amber-700/50 text-amber-400'
                              : 'bg-emerald-950 border-emerald-700/50 text-emerald-400'
                          }`}
                        >
                          {booster.isHardLanding ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-white text-xs">{booster.id}</div>
                          <div className="text-[10px] text-slate-400">{booster.rocketName}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {booster.flightsCompleted} Flight{booster.flightsCompleted === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>Integrity:</span>
                        <span className={booster.isHardLanding ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {booster.condition}% {booster.isHardLanding ? '(Hard Landing)' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            booster.isHardLanding ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${booster.condition}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] font-mono flex items-center justify-between text-slate-400">
                      <span>Refurb Cost ({Math.round(refurbRate * 100)}%):</span>
                      <span className="text-cyan-300 font-semibold">{refurbCost.toLocaleString()} Cr</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      Re-flight Ready
                    </span>
                    <button
                      onClick={() => onScrapBooster(booster.id)}
                      title="Scrap for 35,000 Cr & 10 RP"
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
