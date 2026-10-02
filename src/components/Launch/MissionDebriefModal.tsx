import React from 'react';
import type { Contract, RocketModel } from '../../types/game';
import {
  CheckCircle2,
  Atom,
  Satellite,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Cpu,
  Layers,
  Fuel,
} from 'lucide-react';
import { sounds } from '../../utils/audio';

interface MissionDebriefModalProps {
  contract: Contract;
  bundledContracts?: Contract[];
  rocket: RocketModel;
  boosterLanded: boolean;
  boosterCondition: number;
  launchCost: number;
  onClose: () => void;
}

export const MissionDebriefModal: React.FC<MissionDebriefModalProps> = ({
  contract,
  bundledContracts,
  rocket,
  boosterLanded,
  boosterCondition,
  launchCost,
  onClose,
}) => {
  const isBundled = Boolean(bundledContracts && bundledContracts.length > 1);
  const activeContracts = isBundled ? bundledContracts! : [contract];

  const totalGrossCash = activeContracts.reduce((sum, c) => sum + c.rewardCash, 0);
  const totalBaseScience = activeContracts.reduce((sum, c) => sum + c.rewardScience, 0);
  const totalScienceGained = totalBaseScience + (boosterLanded ? 15 : 5);
  const totalConstellationNodes = activeContracts.filter(c => c.isConstellationMission).length;
  const netProfit = totalGrossCash - launchCost;
  const boosterSavingsNext = Math.round(rocket.cost * (1 - rocket.refurbishCostPercent));

  const unlockedDepot = activeContracts.find(c => c.unlocksDepotId)?.unlocksDepotId;

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl flex flex-col justify-between max-h-[90vh] overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              ARIA Flight Telemetry • Mission Debrief
            </div>
            <h2 className="text-base sm:text-xl font-bold text-white leading-tight">
              {isBundled ? (
                <span className="flex items-center gap-1.5 text-purple-300">
                  <Layers className="w-4 h-4 text-purple-400" />
                  MANIFEST: {activeContracts.length} PAYLOADS DEPLOYED
                </span>
              ) : (
                `${contract.title} DEPLOYED`
              )}
            </h2>
          </div>
        </div>

        {/* Milestone Depot Banner if unlocked */}
        {unlockedDepot && (
          <div className="mt-3 p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/60 flex items-center gap-2.5 text-xs">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
              <Fuel className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-mono text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                Marga Network Milestone Unlocked
              </div>
              <div className="text-slate-200 mt-0.5 font-semibold">
                Kosha-LEO Anchor Depot Foundation established in Low Earth Orbit!
              </div>
            </div>
          </div>
        )}

        {/* Orbit Payload Success List */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-400">LEO Delivery Status:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% NOMINAL
            </span>
          </div>

          {/* Payloads list */}
          <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
            {activeContracts.map(c => (
              <div key={c.id} className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 truncate max-w-[240px]">
                  • {c.title} <span className="text-slate-500">({c.payloadMassKg} kg)</span>
                </span>
                <span className="text-emerald-400 font-semibold">
                  +{c.rewardCash.toLocaleString()} Cr
                </span>
              </div>
            ))}
          </div>

          {totalConstellationNodes > 0 && (
            <div className="flex items-center justify-between font-mono pt-2 border-t border-slate-800/80 text-cyan-300 text-[11px]">
              <span className="flex items-center gap-1">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" /> StarStream Mesh:
              </span>
              <span className="font-bold">
                +{totalConstellationNodes} Laser Relay Node{totalConstellationNodes > 1 ? 's' : ''} (Passive Income Added)
              </span>
            </div>
          )}
        </div>

        {/* Booster Recovery Card */}
        <div
          className={`mt-3 p-3 rounded-xl border ${
            boosterLanded
              ? 'bg-emerald-950/20 border-emerald-800/60'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {boosterLanded ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span className="font-bold text-white text-xs sm:text-sm">
                Booster Recovery ({rocket.name}):
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                boosterLanded
                  ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                  : 'bg-rose-950/60 text-rose-400 border border-rose-900/50'
              }`}
            >
              {boosterLanded ? 'TOUCHDOWN CONFIRMED' : 'CORE LOST (RUD)'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            {boosterLanded
              ? `Booster secured on drone ship with ${boosterCondition}% structural integrity. Transferred to Hangar for discounted re-flight.`
              : 'Core destroyed on impact. Black-box telemetry returned to R&D for analysis.'}
          </p>

          {boosterLanded && (
            <div className="mt-2 pt-2 border-t border-emerald-900/40 flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400">Next Re-flight Discount:</span>
              <span className="font-bold text-white font-mono-numbers">
                Save {boosterSavingsNext.toLocaleString()} Cr
              </span>
            </div>
          )}
        </div>

        {/* Financial & Research Summary */}
        <div className="mt-3.5 space-y-1.5 font-mono text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Total Gross Bounty ({activeContracts.length} payload{activeContracts.length > 1 ? 's' : ''}):</span>
            <span className="text-emerald-400 font-bold font-mono-numbers">
              +{totalGrossCash.toLocaleString()} Cr
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Vehicle Manufacture Cost:</span>
            <span className="text-rose-400 font-mono-numbers">
              -{launchCost.toLocaleString()} Cr
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Research Accrued:</span>
            <span className="text-purple-300 font-bold font-mono-numbers flex items-center gap-1">
              <Atom className="w-3.5 h-3.5 text-purple-400" />
              +{totalScienceGained} RP
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-white">Net Flight Margin:</span>
            <span className={`font-mono-numbers ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} Cr
            </span>
          </div>
        </div>
      </div>

      {/* Return to Mission Control Action */}
      <div className="mt-5 pt-3 border-t border-slate-800">
        <button
          onClick={() => {
            sounds.playSuccess();
            onClose();
          }}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer active:scale-98 transition-all"
        >
          <span>RETURN TO MISSION CONTROL</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
