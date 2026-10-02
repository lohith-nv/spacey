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
    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-6 md:p-8 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              Mission Flight Telemetry Report
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {contract.title} DEPLOYED
            </h2>
          </div>
        </div>

        {/* Orbit Payload Success */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 font-mono">Payload Deployment:</span>
            <span className="text-emerald-400 font-bold font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 100% NOMINAL ORBIT
            </span>
          </div>

          {contract.isConstellationMission && (
            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80 text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-cyan-400" /> Constellation Node Added:
              </span>
              <span className="font-bold">+1 Active LEO Satellite</span>
            </div>
          )}
        </div>

        {/* Booster Recovery Telemetry Card */}
        <div className={`mt-4 p-4 rounded-xl border ${
          boosterLanded
            ? 'bg-emerald-950/20 border-emerald-800/60'
            : 'bg-slate-900/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {boosterLanded ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              )}
              <span className="font-bold text-white text-sm">
                First-Stage Booster Recovery:
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              boosterLanded
                ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                : 'bg-rose-950/60 text-rose-400 border border-rose-900/50'
            }`}>
              {boosterLanded ? 'TOUCHDOWN CONFIRMED' : 'CORE LOST (RUD)'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {boosterLanded
              ? `Booster landed successfully on the drone ship with ${boosterCondition}% structural integrity! Stored into your Hangar inventory for rapid re-flight.`
              : 'Booster was destroyed upon sea impact. Black-box flight recording telemetry was transmitted to R&D for analysis.'}
          </p>

          {boosterLanded && (
            <div className="mt-3 pt-2.5 border-t border-emerald-900/40 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">Reusability Discount for next flight:</span>
              <span className="font-bold text-white font-mono-numbers">
                Save ${boosterSavingsNext.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Financial & Science Ledger */}
        <div className="mt-5 space-y-2 font-mono text-xs bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span>Contract Gross Revenue:</span>
            <span className="text-emerald-400 font-bold font-mono-numbers">
              +${contract.rewardCash.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>Launch Vehicle Manufacture & Prep:</span>
            <span className="text-rose-400 font-mono-numbers">
              -${launchCost.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>R&D Telemetry Science Acquired:</span>
            <span className="text-purple-300 font-bold font-mono-numbers flex items-center gap-1">
              <Atom className="w-3.5 h-3.5 text-purple-400" />
              +{contract.rewardScience + (boosterLanded ? 15 : 5)} PTS
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
            <span className="text-white font-bold">Net Mission Earnings:</span>
            <span className={`font-extrabold font-mono-numbers text-base ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? `+$${netProfit.toLocaleString()}` : `-$${Math.abs(netProfit).toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <button
          onClick={() => {
            sounds.playBeep(880, 0.1);
            onClose();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-sm tracking-wider shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <span>RETURN TO MISSION CONTROL</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
