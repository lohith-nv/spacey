import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { RocketModel, TechUpgrade } from '../../types/game';
import { Cpu, ShieldCheck, ShieldAlert, Radio, FastForward } from 'lucide-react';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface AriaAutoLandSequenceProps {
  rocket: RocketModel;
  techTree: TechUpgrade[];
  usedBoosterCondition?: number;
  act?: number;
  onAutoLandingComplete: (outcome: {
    orbitSuccess: boolean;
    boosterLanded: boolean;
    boosterCondition: number;
    isAutoLand: boolean;
    stagesRecovered?: number;
    totalStages?: number;
  }) => void;
}

export const AriaAutoLandSequence: React.FC<AriaAutoLandSequenceProps> = ({
  rocket,
  techTree,
  usedBoosterCondition = 100,
  act = 1,
  onAutoLandingComplete,
}) => {
  // Compute recovery upgrade levels (capped at 6)
  const recoveryTechLevels = useMemo(() => {
    const recoveryTechs = techTree.filter(
      t => t.category === 'recovery' || t.id === 'tech-lattice-fins' || t.id === 'tech-settling-thrusters'
    );
    const sum = recoveryTechs.reduce((acc, t) => acc + (t.unlocked ? t.level : 0), 0);
    return Math.min(6, sum);
  }, [techTree]);

  const actsBeyondActI = Math.max(0, act - 1);

  // Success chance formula:
  // P = clamp(0.50 + 0.15 * condition/100 + 0.04 * recoveryUpgradeLevels - 0.05 * actsBeyondActI, 0.40, 0.95)
  const rawP =
    0.50 +
    0.15 * (usedBoosterCondition / 100) +
    0.04 * recoveryTechLevels -
    0.05 * actsBeyondActI;
  const successProbability = Math.max(0.40, Math.min(0.95, rawP));

  const stagesCount = rocket.stages || 1;

  // 8-second descent timeline (ticks every 100ms)
  const totalDurationMs = 8000;
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const [finalOutcome, setFinalOutcome] = useState<{
    succeeded: boolean;
    stagesRecovered: number;
    condition: number;
  } | null>(null);

  const completedRef = useRef(false);

  // Compute roll once
  const rollOutcome = useMemo(() => {
    if (stagesCount === 2) {
      // Vahana rolls once per stage
      const s1Pass = Math.random() < successProbability;
      const s2Pass = Math.random() < successProbability;
      const recoveredCount = (s1Pass ? 1 : 0) + (s2Pass ? 1 : 0);
      return {
        succeeded: recoveredCount > 0,
        stagesRecovered: recoveredCount,
        condition: Math.max(25, usedBoosterCondition - 10),
      };
    } else {
      const pass = Math.random() < successProbability;
      return {
        succeeded: pass,
        stagesRecovered: pass ? 1 : 0,
        condition: pass ? Math.max(25, usedBoosterCondition - 10) : 0,
      };
    }
  }, [stagesCount, successProbability, usedBoosterCondition]);

  const progress = Math.min(1, elapsedMs / totalDurationMs);
  const currentAlt = Math.max(0, Math.round((1 - progress) * 3000));
  const currentVy = progress < 0.2 ? 65 : progress < 0.7 ? 24 : Math.max(2.1, (1 - progress) * 18);

  const finalizeDescent = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsResolved(true);
    setFinalOutcome(rollOutcome);

    if (rollOutcome.succeeded) {
      sounds.playSuccess();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.65 },
        });
      } catch {
        // silent
      }
    } else {
      sounds.playExplosion();
    }

    setTimeout(() => {
      onAutoLandingComplete({
        orbitSuccess: true, // Payload is always paid
        boosterLanded: rollOutcome.succeeded,
        boosterCondition: rollOutcome.condition,
        isAutoLand: true,
        stagesRecovered: rollOutcome.stagesRecovered,
        totalStages: stagesCount,
      });
    }, 2800);
  };

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (completedRef.current) return;
      const elapsed = Date.now() - startTime;
      if (elapsed >= totalDurationMs) {
        setElapsedMs(totalDurationMs);
        clearInterval(interval);
        finalizeDescent();
      } else {
        setElapsedMs(elapsed);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleSkip = () => {
    if (completedRef.current) return;
    setElapsedMs(totalDurationMs);
    finalizeDescent();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-purple-500/50 bg-slate-950 p-4 sm:p-6 shadow-2xl flex flex-col justify-between min-h-[500px]">
      {/* Background Radar Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #8b5cf6 1px, transparent 1px), linear-gradient(to right, #1e1b4b 1px, transparent 1px), linear-gradient(to bottom, #1e1b4b 1px, transparent 1px)',
          backgroundSize: '40px 40px, 40px 40px, 40px 40px',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
              ARIA Autonomous Flight Controller &bull; Auto-Land
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{rocket.name} Scripted Descent</span>
              {stagesCount === 2 && (
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono">
                  Dual-Stage Recovery Roll
                </span>
              )}
            </h2>
          </div>
        </div>

        <button
          onClick={handleSkip}
          disabled={isResolved}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/60 text-purple-300 border border-purple-700/60 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Skip to Touchdown</span>
        </button>
      </div>

      {/* Main Descent Visualizer */}
      <div className="relative z-10 my-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Left Telemetry Column */}
        <div className="space-y-2.5 font-mono text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Descent Altitude</div>
            <div className="text-xl font-bold text-cyan-300 font-mono-numbers mt-0.5">
              {currentAlt.toLocaleString()} m
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
              <div
                className="bg-cyan-400 h-full transition-all duration-100"
                style={{ width: `${(1 - progress) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Descent Rate (Vy)</div>
            <div className="text-xl font-bold text-emerald-400 font-mono-numbers mt-0.5">
              {currentVy.toFixed(1)} m/s
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {progress < 0.3 ? 'Supersonic entry' : progress < 0.75 ? 'Transonic deceleration' : 'Landing burn ignition'}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-purple-900/50 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[10px] text-purple-300 uppercase tracking-wider">
              <span>Auto-Land Probability</span>
              <span className="font-bold text-white font-mono-numbers">{Math.round(successProbability * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full"
                style={{ width: `${successProbability * 100}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 mt-1.5 leading-tight space-y-0.5">
              <div>&bull; Base: 50% + Integrity ({Math.round(0.15 * usedBoosterCondition)}%)</div>
              <div>&bull; Recovery Upgrades: +{Math.round(recoveryTechLevels * 4)}% ({recoveryTechLevels}/6)</div>
              {actsBeyondActI > 0 && <div>&bull; Act Difficulty: -{actsBeyondActI * 5}%</div>}
            </div>
          </div>
        </div>

        {/* Center Animated Terminal Visual */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/40 rounded-2xl border border-slate-800/80 relative min-h-[260px]">
          {/* Radar circle concentric lines */}
          <div className="w-48 h-48 rounded-full border border-purple-500/20 absolute flex items-center justify-center pointer-events-none">
            <div className="w-36 h-36 rounded-full border border-purple-500/30 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-cyan-500/40 animate-ping"></div>
            </div>
          </div>

          {/* Rocket icon descending */}
          <div
            className="transition-all duration-300 flex flex-col items-center z-10"
            style={{
              transform: `translateY(${progress * 60 - 30}px) scale(${1 - progress * 0.15})`,
            }}
          >
            <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]">
              {rocket.icon}
            </span>
            <div className="w-1.5 h-6 bg-gradient-to-b from-orange-400 to-transparent rounded-full animate-pulse mt-0.5" />
          </div>

          {/* Drone Ship Platform */}
          <div className="absolute bottom-6 w-32 h-3 bg-slate-800 border border-slate-600 rounded-sm flex items-center justify-center">
            <span className="text-[7px] font-mono text-yellow-400 font-bold tracking-widest">ASDS DRONE SHIP</span>
          </div>

          {/* Status Subtitle */}
          <div className="mt-8 font-mono text-[11px] text-purple-300 font-semibold uppercase tracking-wider text-center z-10">
            {progress < 0.25 && 'Entry burn active &bull; Calibrating trajectory'}
            {progress >= 0.25 && progress < 0.65 && 'Grid fins modulating dynamic pitch & roll'}
            {progress >= 0.65 && progress < 0.95 && 'Center engine ignited &bull; Suicide burn timing'}
            {progress >= 0.95 && !isResolved && 'Landing legs locked &bull; Touchdown contact'}
          </div>
        </div>

        {/* Right Status / Outcome Column */}
        <div className="space-y-3 font-mono text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Flight Mode Telemetry</div>
            <div className="flex items-center gap-2 text-purple-300">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="font-bold">Autonomous Routine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ARIA is piloting the booster descent automatically. Condition cost on success is -10 (manual costs -5 with +25% RP).
            </p>
          </div>

          {stagesCount === 2 && (
            <div className="bg-purple-950/40 border border-purple-800/60 p-3 rounded-xl text-[11px] text-slate-300">
              <span className="text-purple-300 font-bold block mb-0.5">Vahana Two-Stage Rule:</span>
              Both stage 1 booster and stage 2 return body roll separately for drone ship recovery.
            </div>
          )}

          {/* Outcome Alert Card */}
          {finalOutcome && (
            <div
              className={`p-3.5 rounded-xl border animate-fade-in ${
                finalOutcome.succeeded
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                {finalOutcome.succeeded ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>AUTOLAND SUCCESSFUL</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>AUTOLAND FAILED (CORE LOST)</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                {finalOutcome.succeeded
                  ? stagesCount === 2
                    ? `${finalOutcome.stagesRecovered} of 2 stages successfully returned to hangar!`
                    : `Booster secured on drone ship deck at ${finalOutcome.condition}% condition.`
                  : 'Booster lost during landing sequence. Contract payload bounty is secured!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Progress Bar */}
      <div className="relative z-10 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Scripted Descent Sequence ({((totalDurationMs - elapsedMs) / 1000).toFixed(1)}s remaining)</span>
        <span className="text-purple-400">ARIA Telemetry Stream v3</span>
      </div>
    </div>
  );
};
