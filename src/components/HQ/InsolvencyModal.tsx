import React from 'react';
import { DollarSign, RefreshCw, AlertTriangle, ShieldCheck, Atom, ArrowRight } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface InsolvencyModalProps {
  currentAct: number;
  loanAlreadyTaken: boolean;
  loanAmount: number;
  science: number;
  onAcceptLoan: () => void;
  onRestartAct: () => void;
}

export const InsolvencyModal: React.FC<InsolvencyModalProps> = ({
  currentAct,
  loanAlreadyTaken,
  loanAmount,
  science,
  onAcceptLoan,
  onRestartAct,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-rose-500/50 bg-slate-900 p-5 sm:p-7 shadow-2xl relative space-y-4">
        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold">
              FLIGHT OPERATIONS SUSPENDED &bull; INSOLVENCY ALERT
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {loanAlreadyTaken ? `Act ${currentAct} Operational Exhaustion` : `Act ${currentAct} Capital Deficit`}
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {loanAlreadyTaken ? (
            <>
              Your company has exhausted both its launch treasury and the single Founders&apos; Bridge loan permitted for Act {currentAct}. Without active boosters or passive satellite income, orbital flights cannot proceed.
            </>
          ) : (
            <>
              Your available cash is below the minimum vehicle fabrication cost, your hangar storage is empty, and passive constellation income is zero.
            </>
          )}
        </p>

        {/* Option 1: ISA Founders' Bridge Loan */}
        {!loanAlreadyTaken ? (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/50 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                ISA Founders&apos; Bridge Loan (Act {currentAct})
              </span>
              <span className="text-sm text-emerald-400 font-mono-numbers">
                +{loanAmount.toLocaleString()} Cr
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              The International Space Alliance grants an emergency 1.5&times; vehicle cost bridge infusion. Repayment is withheld at <strong>25% of your next 3 contract bounties</strong>.
            </p>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Principal Cash Advance:</span>
                <span className="text-white font-bold">+{loanAmount.toLocaleString()} Cr</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Repayment Terms:</span>
                <span className="text-amber-300 font-semibold">25% withholding across next 3 payouts</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Allowance:</span>
                <span className="text-slate-300">1 bridge loan allowed per act</span>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playSuccess();
                onAcceptLoan();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-98 transition-all"
            >
              <span>ACCEPT FOUNDERS&apos; BRIDGE (+{loanAmount.toLocaleString()} Cr)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Option 2: Act Restart Keeping RP & Tech */
          <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/50 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-purple-300 font-bold">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                Chapter 11 Reorganization (Restart Act {currentAct})
              </span>
              <span className="text-emerald-400 font-mono-numbers">Starting Kit Restored</span>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              No complete wipeout! You retain all research points and technological blueprints unlocked so far.
            </p>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 text-purple-300">
                  <Atom className="w-3.5 h-3.5" /> Research Retained:
                </span>
                <span className="font-bold text-purple-300">{science} RP (Kept)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 text-cyan-300">
                  <ShieldCheck className="w-3.5 h-3.5" /> Tech Tree Blueprints:
                </span>
                <span className="font-bold text-cyan-300">100% Retained</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Treasury Rebalance:</span>
                <span className="text-emerald-400 font-bold">400,000 Cr Starting Kit</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Act {currentAct} Contracts:</span>
                <span className="text-white">Refreshed</span>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playSuccess();
                onRestartAct();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 cursor-pointer active:scale-98 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RESTART ACT {currentAct} (KEEP RP & BLUEPRINTS)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
