import React, { useState } from 'react';
import type { ActiveMission, TechUpgrade } from '../../types/game';
import { CountdownPhase } from './CountdownPhase';
import { AscentPhase } from './AscentPhase';
import { BoosterLandingCanvas } from './BoosterLandingCanvas';
import { MissionDebriefModal } from './MissionDebriefModal';

interface LaunchDirectorProps {
  mission: ActiveMission;
  techTree: TechUpgrade[];
  onMissionFinalized: (outcome: {
    orbitSuccess: boolean;
    boosterLanded: boolean;
    boosterCondition: number;
  }) => void;
  onAbort: () => void;
}

export const LaunchDirector: React.FC<LaunchDirectorProps> = ({
  mission,
  techTree,
  onMissionFinalized,
  onAbort,
}) => {
  const [phase, setPhase] = useState<'countdown' | 'ascent' | 'landing' | 'debrief'>('countdown');
  const [boosterLanded, setBoosterLanded] = useState(false);
  const [boosterCondition, setBoosterCondition] = useState(0);

  const launchCost = mission.usedBoosterId
    ? Math.round(mission.rocket.cost * mission.rocket.refurbishCostPercent)
    : mission.rocket.cost;

  const handleLiftoff = () => {
    setPhase('ascent');
  };

  const handleAscentComplete = () => {
    // Stage 1 separation complete, proceed to booster recovery!
    setPhase('landing');
  };

  const handleLandingComplete = (success: boolean, condition: number) => {
    setBoosterLanded(success);
    setBoosterCondition(condition);
    setPhase('debrief');
  };

  const handleDebriefClose = () => {
    onMissionFinalized({
      orbitSuccess: true,
      boosterLanded,
      boosterCondition,
    });
  };

  return (
    <div className="py-6 px-4">
      {phase === 'countdown' && (
        <CountdownPhase
          rocket={mission.rocket}
          contract={mission.contract}
          onLiftoff={handleLiftoff}
          onAbort={onAbort}
        />
      )}

      {phase === 'ascent' && (
        <AscentPhase
          rocket={mission.rocket}
          contract={mission.contract}
          onAscentComplete={handleAscentComplete}
          onAbort={onAbort}
        />
      )}

      {phase === 'landing' && (
        <BoosterLandingCanvas
          rocket={mission.rocket}
          techTree={techTree}
          onLandingComplete={handleLandingComplete}
        />
      )}

      {phase === 'debrief' && (
        <MissionDebriefModal
          contract={mission.contract}
          rocket={mission.rocket}
          boosterLanded={boosterLanded}
          boosterCondition={boosterCondition}
          launchCost={launchCost}
          onClose={handleDebriefClose}
        />
      )}
    </div>
  );
};
