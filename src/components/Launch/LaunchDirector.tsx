import React, { useState } from 'react';
import type { ActiveMission, TechUpgrade } from '../../types/game';
import { CountdownPhase } from './CountdownPhase';
import { AscentPhase } from './AscentPhase';
import { BoosterLandingCanvas } from './BoosterLandingCanvas';
import { AriaAutoLandSequence } from './AriaAutoLandSequence';
import { MissionDebriefModal } from './MissionDebriefModal';
import { Radio, ArrowLeft, Layers } from 'lucide-react';

interface LaunchDirectorProps {
  mission: ActiveMission;
  techTree: TechUpgrade[];
  usedBoosterCondition?: number;
  loanWithholding?: number;
  loanPayoutsRemaining?: number;
  act?: number;
  onMissionFinalized: (outcome: {
    orbitSuccess: boolean;
    boosterLanded: boolean;
    boosterCondition: number;
    isHardLanding?: boolean;
    isAutoLand?: boolean;
    ascentFailed?: boolean;
    stagesRecovered?: number;
    totalStages?: number;
  }) => void;
  onAbort: () => void;
}

export const LaunchDirector: React.FC<LaunchDirectorProps> = ({
  mission,
  techTree,
  usedBoosterCondition = 100,
  loanWithholding = 0,
  loanPayoutsRemaining = 0,
  act = 1,
  onMissionFinalized,
  onAbort,
}) => {
  const [phase, setPhase] = useState<'countdown' | 'ascent' | 'landing' | 'debrief'>('countdown');
  const [boosterLanded, setBoosterLanded] = useState(false);
  const [boosterCondition, setBoosterCondition] = useState(0);
  const [isHardLanding, setIsHardLanding] = useState(false);
  const [ascentFailed, setAscentFailed] = useState(false);
  const [stagesRecovered, setStagesRecovered] = useState<number | undefined>(undefined);
  const [totalStages, setTotalStages] = useState<number | undefined>(undefined);

  const isBundled = Boolean(mission.bundledContracts && mission.bundledContracts.length > 1);

  const launchCost = mission.usedBoosterId
    ? Math.round(mission.rocket.cost * mission.rocket.refurbishCostPercent)
    : mission.rocket.cost;

  const handleLiftoff = () => {
    setPhase('ascent');
  };

  const handleAscentComplete = () => {
    // Stage 1 separation complete, proceed to booster recovery
    setPhase('landing');
  };

  const handleAscentFailure = () => {
    setAscentFailed(true);
    setBoosterLanded(false);
    setBoosterCondition(0);
    setPhase('debrief');
  };

  const handleLandingComplete = (success: boolean, condition: number, hardLanding?: boolean) => {
    setBoosterLanded(success);
    setBoosterCondition(condition);
    setIsHardLanding(Boolean(hardLanding));
    setPhase('debrief');
  };

  const handleAutoLandingComplete = (outcome: {
    orbitSuccess: boolean;
    boosterLanded: boolean;
    boosterCondition: number;
    isAutoLand: boolean;
    stagesRecovered?: number;
    totalStages?: number;
  }) => {
    setBoosterLanded(outcome.boosterLanded);
    setBoosterCondition(outcome.boosterCondition);
    setStagesRecovered(outcome.stagesRecovered);
    setTotalStages(outcome.totalStages);
    setPhase('debrief');
  };

  const handleDebriefClose = () => {
    onMissionFinalized({
      orbitSuccess: !ascentFailed,
      boosterLanded,
      boosterCondition,
      isHardLanding,
      isAutoLand: mission.isAutoLand,
      ascentFailed,
      stagesRecovered,
      totalStages,
    });
  };

  const phases = [
    { id: 'countdown', label: 'COUNTDOWN' },
    { id: 'ascent', label: 'ASCENT & MECO' },
    { id: 'landing', label: mission.isAutoLand ? 'ARIA AUTOLAND' : 'BOOSTER RECOVERY' },
    { id: 'debrief', label: 'DEBRIEF' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-3">
      {/* Mobile Mission Header & Phase Breadcrumb */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onAbort}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors cursor-pointer shrink-0"
            title="Abort Mission"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
              <span>{mission.rocket.name}</span>
              <span className="text-slate-500">•</span>
              {isBundled ? (
                <span className="text-purple-300 flex items-center gap-1 truncate font-bold">
                  <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                  {mission.bundledContracts!.length} Bundled Payloads
                </span>
              ) : (
                <span className="text-slate-300 truncate">{mission.contract.title}</span>
              )}
            </div>
          </div>
        </div>

        {/* Phase Pill Stepper */}
        <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] sm:text-[10px]">
          {phases.map((p, idx) => {
            const isCurrent = phase === p.id;
            const isPast =
              (phase === 'ascent' && idx === 0) ||
              (phase === 'landing' && idx <= 1) ||
              (phase === 'debrief' && idx <= 2);

            return (
              <span
                key={p.id}
                className={`px-1.5 sm:px-2 py-0.5 rounded ${
                  isCurrent
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50'
                    : isPast
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                    : 'text-slate-600 hidden sm:inline-block'
                }`}
              >
                {isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1 animate-ping"></span>}
                {p.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Phase View */}
      <div>
        {phase === 'countdown' && (
          <CountdownPhase
            rocket={mission.rocket}
            contract={mission.contract}
            bundledContracts={mission.bundledContracts}
            onLiftoff={handleLiftoff}
            onAbort={onAbort}
          />
        )}

        {phase === 'ascent' && (
          <AscentPhase
            rocket={mission.rocket}
            contract={mission.contract}
            bundledContracts={mission.bundledContracts}
            onAscentComplete={handleAscentComplete}
            onAscentFailure={handleAscentFailure}
            onAbort={onAbort}
          />
        )}

        {phase === 'landing' &&
          (mission.isAutoLand ? (
            <AriaAutoLandSequence
              rocket={mission.rocket}
              techTree={techTree}
              usedBoosterCondition={usedBoosterCondition}
              act={act}
              onAutoLandingComplete={handleAutoLandingComplete}
            />
          ) : (
            <BoosterLandingCanvas
              rocket={mission.rocket}
              techTree={techTree}
              onLandingComplete={handleLandingComplete}
            />
          ))}

        {phase === 'debrief' && (
          <MissionDebriefModal
            contract={mission.contract}
            bundledContracts={mission.bundledContracts}
            rocket={mission.rocket}
            boosterLanded={boosterLanded}
            boosterCondition={boosterCondition}
            isHardLanding={isHardLanding}
            isAutoLand={mission.isAutoLand}
            ascentFailed={ascentFailed}
            launchCost={launchCost}
            loanWithholding={loanWithholding}
            loanPayoutsRemaining={loanPayoutsRemaining}
            onClose={handleDebriefClose}
          />
        )}
      </div>
    </div>
  );
};
