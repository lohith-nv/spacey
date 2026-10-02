import React from 'react';
import type { RocketModel, BoosterInventoryItem } from '../../types/game';
import { Atom, ShieldCheck, Wrench, Trash2, CheckCircle2, Lock, Zap, Gauge } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            Vehicle Assembly Building & Recovery Hangar
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Maintain your rocket classes and inspect recovered orbital boosters ready for rapid refurbishment.
          </p>
        </div>
        <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-400" />
          Refurbishment Efficiency: <span className="text-emerald-400 font-bold">OPTIMAL</span>
        </div>
      </div>

      {/* Rocket Classes Section */}
      <div>
        <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Rocket Fleet Classes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rockets.map(rocket => {
            const canUnlock = science >= rocket.unlockCost;
            const inStockCount = hangarBoosters.filter(b => b.rocketId === rocket.id).length;

            return (
              <div
                key={rocket.id}
                className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  rocket.unlocked
                    ? 'bg-slate-900/80 border-slate-700/80 shadow-lg'
                    : 'bg-slate-950/70 border-slate-800/80 opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                      {rocket.icon}
                    </span>
                    {rocket.unlocked ? (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> FLIGHT CERTIFIED
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-white mt-3">{rocket.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{rocket.tagline}</p>

                  {/* Rocket Stats */}
                  <div className="mt-5 space-y-2.5 font-mono text-xs border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Payload to LEO</span>
                      <span className="text-slate-200 font-semibold">{rocket.payloadCapacityKg.toLocaleString()} kg</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Engine Thrust</span>
                      <span className="text-slate-200 font-semibold">{rocket.engineThrust} kN</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Landing Fuel Mass</span>
                      <span className="text-slate-200 font-semibold">{rocket.fuelCapacity} units</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>New Build Cost</span>
                      <span className="text-emerald-400 font-bold font-mono-numbers">
                        ${rocket.cost.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Reused Booster Cost</span>
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
                <div className="mt-6 pt-3 border-t border-slate-800">
                  {rocket.unlocked ? (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">In Hangar Stock:</span>
                      <span className="font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        {inStockCount} {inStockCount === 1 ? 'Booster' : 'Boosters'}
                      </span>
                    </div>
                  ) : (
                    <button
                      disabled={!canUnlock}
                      onClick={() => {
                        sounds.playSuccess();
                        onUnlockRocket(rocket.id);
                      }}
                      className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        canUnlock
                          ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-lg shadow-purple-600/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Atom className="w-4 h-4" />
                      <span>UNLOCK FOR {rocket.unlockCost} SCIENCE PTS</span>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Recovered Booster Fleet Inventory ({hangarBoosters.length})
          </h3>
        </div>

        {hangarBoosters.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/60 mx-auto flex items-center justify-center text-slate-500 mb-3">
              <Gauge className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-300">No Boosters in Hangar Storage</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              During launch missions, guide your first-stage booster back to the Autonomous Drone Ship to recover it.
              Each recovered booster cuts subsequent launch costs by over 65%!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hangarBoosters.map(booster => {
              return (
                <div
                  key={booster.id}
                  className="bg-slate-900/90 border border-emerald-900/60 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-700/80 transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center border border-emerald-700/50">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-white text-sm">CORE #{booster.id}</div>
                          <div className="text-[11px] text-slate-400">{booster.rocketName}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/40">
                        {booster.flightsCompleted} Flight{booster.flightsCompleted === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Progress Bar of Integrity */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                        <span>Heat Shield & Structure:</span>
                        <span className="text-emerald-400 font-bold">{booster.condition}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${booster.condition}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Refurbished & Ready
                    </span>

                    <button
                      onClick={() => onScrapBooster(booster.id)}
                      title="Scrap booster for salvage parts ($35,000 + 10 Science)"
                      className="p-1.5 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-900/40 transition-all text-xs flex items-center gap-1 font-mono cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Scrap</span>
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
