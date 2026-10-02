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
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { sounds } from '../../utils/audio';

interface MissionDebriefModalProps {
  contract: Contract;
  bundledContracts?: Contract[];
  rocket: RocketModel;
  boosterLanded: boolean;
  boosterCondition: number;
  isHardLanding?: boolean;
  isAutoLand?: boolean;
  ascentFailed?: boolean;
  launchCost: number;
  loanWithholding?: number;
  loanPayoutsRemaining?: number;
  onClose: () => void;
}

export const MissionDebriefModal: React.FC<MissionDebriefModalProps> = ({
  contract,
  bundledContracts,
  rocket,
  boosterLanded,
  boosterCondition,
  isHardLanding,
  isAutoLand,
  ascentFailed,
  launchCost,
  loanWithholding = 0,
  loanPayoutsRemaining = 0,
  onClose,
}) => {
  const isBundled = Boolean(bundledContracts && bundledContracts.length > 1);
  const activeContracts = isBundled ? bundledContracts! : [contract];

  const totalGrossCash = ascentFailed
    ? 0
    : activeContracts.reduce((sum, c) => sum + c.rewardCash, 0);

  const totalBaseScience = ascentFailed
    ? 0
    : activeContracts.reduce((sum, c) => sum + c.rewardScience, 0);

  // Manual landing pays +25% bonus RP on success
  const manualBonusScience =
    !isAutoLand && boosterLanded && !ascentFailed
      ? Math.max(5, Math.round(totalBaseScience * 0.25))
      : 0;

  const totalScienceGained = ascentFailed
    ? 0
    : totalBaseScience + (boosterLanded ? 15 : 5) + manualBonusScience;

  const totalConstellationNodes = ascentFailed
    ? 0
    : activeContracts.filter(c => c.isConstellationMission).length;

  const netCashReceived = Math.max(0, totalGrossCash - loanWithholding);
  const netProfit = netCashReceived - launchCost;

  // Next re-flight cost
  const nextRefurbRate = isHardLanding ? 0.70 : rocket.refurbishCostPercent;
  const boosterSavingsNext = Math.round(rocket.cost * (1 - nextRefurbRate));

  const unlockedDepot = !ascentFailed
    ? activeContracts.find(c => c.unlocksDepotId)?.unlocksDepotId
    : undefined;

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl flex flex-col justify-between max-h-[90vh] overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              ascentFailed
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {ascentFailed ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Cpu className="w-3 h-3" />
              ARIA Flight Telemetry &bull; Mission Debrief
            </div>
            <h2 className="text-base sm:text-xl font-bold text-white leading-tight">
              {ascentFailed ? (
                <span className="text-rose-400">ASCENT FAILURE &bull; LOSS OF VEHICLE</span>
              ) : isBundled ? (
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
            <span
              className={`font-bold flex items-center gap-1 ${
                ascentFailed ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {ascentFailed ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" /> FAILED (0% INSERTION)
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% NOMINAL
                </>
              )}
            </span>
          </div>

          {/* Payloads list */}
          <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
            {activeContracts.map(c => (
              <div key={c.id} className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 truncate max-w-[240px]">
                  &bull; {c.title} <span className="text-slate-500">({c.payloadMassKg} kg)</span>
                </span>
                <span className={ascentFailed ? 'text-slate-500 line-through' : 'text-emerald-400 font-semibold'}>
                  {ascentFailed ? '0 Cr' : `+${c.rewardCash.toLocaleString()} Cr`}
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
            isHardLanding
              ? 'bg-amber-950/20 border-amber-800/60'
              : boosterLanded
              ? 'bg-emerald-950/20 border-emerald-800/60'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {isHardLanding ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : boosterLanded ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span className="font-bold text-white text-xs sm:text-sm">
                Booster Recovery ({rocket.name}):
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {isAutoLand ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  ARIA AUTOLAND
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  MANUAL PILOT
                </span>
              )}
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isHardLanding
                    ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                    : boosterLanded
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-900/50'
                }`}
              >
                {isHardLanding
                  ? 'HARD TOUCHDOWN'
                  : boosterLanded
                  ? 'TOUCHDOWN CONFIRMED'
                  : 'CORE LOST (RUD)'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            {isHardLanding
              ? `Booster survived hard touchdown (4.2–7.0 m/s) on drone ship at 25% integrity. Core salvaged; requires heavy structural refurbishment (70% build cost).`
              : boosterLanded
              ? `Booster secured on drone ship with ${boosterCondition}% structural integrity. Transferred to Hangar for discounted re-flight.`
              : ascentFailed
              ? 'Vehicle broke apart under extreme aerodynamic Max-Q stress. Core lost.'
              : 'Core destroyed on impact. Telemetry returned to R&D for analysis.'}
          </p>

          {boosterLanded && (
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className={isHardLanding ? 'text-amber-400' : 'text-emerald-400'}>
                {isHardLanding ? 'Hard Landing Refurb Cost (70%):' : 'Next Re-flight Savings:'}
              </span>
              <span className="font-bold text-white font-mono-numbers">
                {isHardLanding
                  ? `${Math.round(rocket.cost * 0.70).toLocaleString()} Cr`
                  : `Save ${boosterSavingsNext.toLocaleString()} Cr`}
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

          {/* ISA Founders' Bridge withholding if active */}
          {loanWithholding > 0 && (
            <div className="flex items-center justify-between text-amber-400 text-[11px] bg-amber-950/30 px-2 py-1 rounded border border-amber-800/40">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                ISA Bridge Loan Repayment (25%):
              </span>
              <span className="font-bold font-mono-numbers">
                -{loanWithholding.toLocaleString()} Cr
                <span className="text-[10px] text-slate-400 ml-1">
                  ({loanPayoutsRemaining} payout{loanPayoutsRemaining > 1 ? 's' : ''} left)
                </span>
              </span>
            </div>
          )}

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
              {manualBonusScience > 0 && (
                <span className="text-[10px] text-cyan-300 ml-1 font-semibold">
                  (+{manualBonusScience} RP Manual Bonus!)
                </span>
              )}
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
