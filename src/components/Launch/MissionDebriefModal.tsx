import React from 'react';
import type { Contract, RocketModel } from '../../types/game';
import { CheckCircle2, Atom, Satellite, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface MissionDebriefModalProps {
  contract: Contract;
  rocket: RocketModel;
  boosterLanded: boolean;
  boosterCondition: number;
  launchCost: number;
  onClose: () => void;
}

export const MissionDebriefModal: React.FC<MissionDebriefModalProps> = ({
  contract,
  rocket,
  boosterLanded,
  boosterCondition,
  launchCost,
  onClose,
}) => {
  const netProfit = contract.rewardCash - launchCost;
  const boosterSavingsNext = Math.round(rocket.cost * (1 - rocket.refurbishCostPercent));

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              Mission Flight Report
            </div>
            <h2 className="text-base sm:text-xl font-bold text-white leading-tight">
              {contract.title} DEPLOYED
            </h2>
          </div>
        </div>

        {/* Orbit Payload Success */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-400">LEO Orbit Delivery:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% NOMINAL
            </span>
          </div>

          {contract.isConstellationMission && (
            <div className="flex items-center justify-between font-mono pt-2 border-t border-slate-800/80 text-cyan-300 text-[11px]">
              <span className="flex items-center gap-1">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" /> Active Constellation:
              </span>
              <span className="font-bold">+1 Telecommunications Node</span>
            </div>
          )}
        </div>

        {/* Booster Recovery Card */}
        <div className={`mt-3 p-3 rounded-xl border ${
          boosterLanded
            ? 'bg-emerald-950/20 border-emerald-800/60'
            : 'bg-slate-900/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {boosterLanded ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span className="font-bold text-white text-xs sm:text-sm">
                Booster Recovery:
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              boosterLanded
                ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                : 'bg-rose-950/60 text-rose-400 border border-rose-900/50'
            }`}>
              {boosterLanded ? 'TOUCHDOWN CONFIRMED' : 'CORE LOST (RUD)'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            {boosterLanded
              ? `Recovered on drone ship with ${boosterCondition}% integrity. Stored in Hangar for discounted re-flight!`
              : 'Core destroyed on impact. Black-box telemetry returned to R&D for analysis.'}
          </p>

          {boosterLanded && (
            <div className="mt-2 pt-2 border-t border-emerald-900/40 flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400">Next Re-flight Discount:</span>
              <span className="font-bold text-white font-mono-numbers">
                Save ${boosterSavingsNext.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Financial & Science Summary */}
        <div className="mt-3.5 space-y-1.5 font-mono text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Contract Gross Revenue:</span>
            <span className="text-emerald-400 font-bold font-mono-numbers">
              +${contract.rewardCash.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Launch Vehicle Manufacture:</span>
            <span className="text-rose-400 font-mono-numbers">
              -${launchCost.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>R&D Science Acquired:</span>
            <span className="text-purple-300 font-bold font-mono-numbers flex items-center gap-1">
              <Atom className="w-3 h-3 text-purple-400" />
              +{contract.rewardScience + (boosterLanded ? 15 : 5)} PTS
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-white font-bold">Net Mission Margin:</span>
            <span className={`font-extrabold font-mono-numbers ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? `+$${netProfit.toLocaleString()}` : `-$${Math.abs(netProfit).toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={() => {
            sounds.playBeep(880, 0.1);
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-xs sm:text-sm tracking-wider shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <span>RETURN TO MISSION CONTROL</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
