import { useState, useEffect, useRef, useMemo } from 'react';
import type {
  RocketModel,
  Contract,
  BoosterInventoryItem,
  TechUpgrade,
  MissionStats,
  ActiveMission,
  KoshaDepot,
  BridgeLoan,
  MissionOutcome,
} from './types/game';
import {
  INITIAL_ROCKETS,
  INITIAL_CONTRACTS,
  INITIAL_TECH,
  INITIAL_KOSHA_DEPOTS,
} from './data/initialData';
import { Header } from './components/Header';
import { HQView } from './components/HQ/HQView';
import { LaunchDirector } from './components/Launch/LaunchDirector';
import { InsolvencyModal } from './components/HQ/InsolvencyModal';
import { sounds } from './utils/audio';

const STORAGE_KEY = 'spacey_save_v1';

interface SavedState {
  cash: number;
  science: number;
  satellites: number;
  ariaTier: number;
  koshaDepots: KoshaDepot[];
  rockets: RocketModel[];
  contracts: Contract[];
  hangarBoosters: BoosterInventoryItem[];
  techTree: TechUpgrade[];
  stats: MissionStats;
  bridgeLoansTakenPerAct?: Record<number, boolean>;
  activeLoan?: BridgeLoan | null;
}

const getSavedData = (): SavedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

let initialLoadedSave: SavedState | null | undefined = undefined;
const getInitialSave = (): SavedState | null => {
  if (initialLoadedSave === undefined) {
    initialLoadedSave = getSavedData();
  }
  return initialLoadedSave;
};

// Canon v3 Migration helpers for backward-compatibility
const migrateRockets = (savedRockets?: RocketModel[]): RocketModel[] => {
  if (!savedRockets || savedRockets.length === 0) return INITIAL_ROCKETS;
  const mapped = savedRockets.map(r => {
    let targetId = r.id;
    if (targetId === 'aether-hopper') targetId = 'laghu';
    if (targetId === 'falcon-strike') targetId = 'vahana';
    if (targetId === 'titan-heavy') targetId = 'airavata';

    const canon = INITIAL_ROCKETS.find(i => i.id === targetId);
    if (canon) {
      return { ...canon, unlocked: targetId === 'laghu' ? true : r.unlocked };
    }
    return r;
  });

  // Ensure all canonical vehicles are present in fleet
  INITIAL_ROCKETS.forEach(canon => {
    if (!mapped.some(m => m.id === canon.id)) {
      mapped.push(canon);
    }
  });

  return mapped;
};

const migrateBoosters = (savedBoosters?: BoosterInventoryItem[]): BoosterInventoryItem[] => {
  if (!savedBoosters) return [];
  return savedBoosters.map(b => {
    let rocketId = b.rocketId;
    let rocketName = b.rocketName;
    if (rocketId === 'aether-hopper') {
      rocketId = 'laghu';
      rocketName = 'Laghu';
    } else if (rocketId === 'falcon-strike') {
      rocketId = 'vahana';
      rocketName = 'Vahana';
    } else if (rocketId === 'titan-heavy') {
      rocketId = 'airavata';
      rocketName = 'Airavata';
    }
    return { ...b, rocketId, rocketName };
  });
};

const migrateContracts = (savedContracts?: Contract[]): Contract[] => {
  if (!savedContracts || savedContracts.length === 0) return INITIAL_CONTRACTS;
  const hasLegacy = savedContracts.some(c => c.id === 'contract-cubesat-1' || c.minRocketTier === 'aether-hopper');
  if (hasLegacy) return INITIAL_CONTRACTS;

  const mapped = savedContracts.map(c => {
    const canon = INITIAL_CONTRACTS.find(i => i.id === c.id);
    if (canon) {
      return { ...canon, completed: c.completed };
    }
    return c;
  });

  INITIAL_CONTRACTS.forEach(canon => {
    if (!mapped.some(m => m.id === canon.id)) {
      mapped.push(canon);
    }
  });
  return mapped;
};

const migrateDepots = (savedDepots?: KoshaDepot[]): KoshaDepot[] => {
  if (!savedDepots || savedDepots.length === 0) return INITIAL_KOSHA_DEPOTS;
  const mapped = [...savedDepots];
  INITIAL_KOSHA_DEPOTS.forEach(canon => {
    if (!mapped.some(m => m.id === canon.id)) {
      mapped.push(canon);
    }
  });
  return mapped;
};

const migrateTechTree = (savedTech?: TechUpgrade[]): TechUpgrade[] => {
  if (!savedTech || savedTech.length === 0) return INITIAL_TECH;
  return INITIAL_TECH.map(canon => {
    const existing = savedTech.find(s => s.id === canon.id || (canon.id === 'tech-relay-tuning' && s.id === 'tech-satellite-bandwidth'));
    if (existing) {
      return { ...canon, level: existing.level, unlocked: existing.unlocked };
    }
    return canon;
  });
};

export function App() {
  const initial = getInitialSave();

  // Primary Resources (Cr, RP, Relays, ARIA Tier)
  const [cash, setCash] = useState<number>(() => initial?.cash ?? 400000);
  const [science, setScience] = useState<number>(() => initial?.science ?? 0);
  const [satellites, setSatellites] = useState<number>(() => initial?.satellites ?? 0);
  const [ariaTier, setAriaTier] = useState<number>(() => initial?.ariaTier ?? 0);
  const [koshaDepots, setKoshaDepots] = useState<KoshaDepot[]>(() => migrateDepots(initial?.koshaDepots));
  const [rockets, setRockets] = useState<RocketModel[]>(() => migrateRockets(initial?.rockets));
  const [contracts, setContracts] = useState<Contract[]>(() => migrateContracts(initial?.contracts));
  const [hangarBoosters, setHangarBoosters] = useState<BoosterInventoryItem[]>(() => migrateBoosters(initial?.hangarBoosters));
  const [techTree, setTechTree] = useState<TechUpgrade[]>(() => migrateTechTree(initial?.techTree));

  const [stats, setStats] = useState<MissionStats>(() => {
    const s = initial?.stats as unknown as MissionStats | undefined;
    return (
      s ?? {
        totalLaunches: 0,
        successfulOrbits: 0,
        boostersLanded: 0,
        manualLandingsCount: 0,
        totalEarnings: 0,
        totalSavings: 0,
      }
    );
  });

  // Bridge Loans & Insolvency Tracking
  const [bridgeLoansTakenPerAct, setBridgeLoansTakenPerAct] = useState<Record<number, boolean>>(
    () => initial?.bridgeLoansTakenPerAct ?? {}
  );
  const [activeLoan, setActiveLoan] = useState<BridgeLoan | null>(
    () => initial?.activeLoan ?? null
  );

  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const companyName = 'SPACEY';

  // Compute Current Act from unlocked vehicle tiers
  const currentAct = useMemo(() => {
    if (rockets.find(r => r.id === 'airavata')?.unlocked || rockets.find(r => r.id === 'bharavaha')?.unlocked) return 4;
    if (rockets.find(r => r.id === 'setu')?.unlocked) return 3;
    if (rockets.find(r => r.id === 'vahana')?.unlocked) return 2;
    return 1;
  }, [rockets]);

  // Current primary vehicle cost for bridge loan sizing
  const currentVehicleCost = useMemo(() => {
    const targetVehicleId = currentAct === 1 ? 'laghu' : currentAct === 2 ? 'vahana' : currentAct === 3 ? 'setu' : 'airavata';
    return rockets.find(r => r.id === targetVehicleId)?.cost ?? 120000;
  }, [rockets, currentAct]);

  const bridgeLoanAmount = Math.round(1.5 * currentVehicleCost);

  // Compute StarStream passive rate
  const bandwidthTech = techTree.find(t => t.id === 'tech-relay-tuning');
  const baseRatePerSat = 40;
  const bonusPerSat = bandwidthTech && bandwidthTech.unlocked ? bandwidthTech.level * bandwidthTech.statBonus : 0;
  const passiveRate = satellites * (baseRatePerSat + bonusPerSat);

  // Insolvency Condition:
  // Cash < cheapest launch AND hangar empty AND passive income == 0 (not just negative cash!)
  const cheapestLaunchCost = useMemo(() => {
    const unlocked = rockets.filter(r => r.unlocked);
    if (unlocked.length === 0) return 120000;
    return Math.min(...unlocked.map(r => r.cost));
  }, [rockets]);

  const isInsolvent = useMemo(() => {
    if (activeMission) return false;
    return cash < cheapestLaunchCost && hangarBoosters.length === 0 && passiveRate === 0;
  }, [activeMission, cash, cheapestLaunchCost, hangarBoosters.length, passiveRate]);

  // Autosave tracking
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const stateToSave: SavedState = {
      cash,
      science,
      satellites,
      ariaTier,
      koshaDepots,
      rockets,
      contracts,
      hangarBoosters,
      techTree,
      stats,
      bridgeLoansTakenPerAct,
      activeLoan,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore quota storage errors
    }
  }, [
    cash,
    science,
    satellites,
    ariaTier,
    koshaDepots,
    rockets,
    contracts,
    hangarBoosters,
    techTree,
    stats,
    bridgeLoansTakenPerAct,
    activeLoan,
  ]);

  // Passive StarStream Revenue Tick (Every 1 second)
  useEffect(() => {
    if (passiveRate <= 0) return;
    const timer = setInterval(() => {
      setCash(prev => prev + passiveRate);
      if (stats) {
        setStats(prev => ({
          ...prev,
          totalEarnings: prev.totalEarnings + passiveRate,
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [passiveRate, stats]);

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  // Launch Initiation
  const handleInitiateLaunch = (
    contract: Contract,
    rocket: RocketModel,
    boosterId?: string,
    bundledContracts?: Contract[],
    isAutoLand?: boolean
  ) => {
    let launchCost = rocket.cost;
    if (boosterId) {
      const booster = hangarBoosters.find(b => b.id === boosterId);
      const rate = booster?.refurbCostMultiplier ?? (booster?.isHardLanding ? 0.70 : rocket.refurbishCostPercent);
      launchCost = Math.round(rocket.cost * rate);
    }

    if (cash < launchCost) {
      sounds.playAlarm();
      return;
    }

    // Deduct cost
    setCash(prev => prev - launchCost);

    // If booster was used, consume it from hangar
    if (boosterId) {
      setHangarBoosters(prev => prev.filter(b => b.id !== boosterId));
    }

    setActiveMission({
      contract,
      bundledContracts,
      rocket,
      usedBoosterId: boosterId,
      phase: 'countdown',
      isAutoLand: Boolean(isAutoLand),
    });
  };

  // Launch Finalization
  const handleMissionFinalized = (outcome: MissionOutcome) => {
    if (!activeMission) return;

    const { contract, bundledContracts, rocket, usedBoosterId, isAutoLand } = activeMission;
    let launchCost = rocket.cost;
    if (usedBoosterId) {
      const rate = outcome.isHardLanding ? 0.70 : rocket.refurbishCostPercent;
      launchCost = Math.round(rocket.cost * rate);
    }

    const savingsAchieved = usedBoosterId ? rocket.cost - launchCost : 0;

    const contractsToFinalize =
      bundledContracts && bundledContracts.length > 0 ? bundledContracts : [contract];

    const totalGrossCash = outcome.ascentFailed
      ? 0
      : contractsToFinalize.reduce((sum, c) => sum + c.rewardCash, 0);

    const totalBaseScience = outcome.ascentFailed
      ? 0
      : contractsToFinalize.reduce((sum, c) => sum + c.rewardScience, 0);

    // Manual landing gives +25% RP bonus
    const manualBonusScience =
      !isAutoLand && outcome.boosterLanded && !outcome.ascentFailed
        ? Math.max(5, Math.round(totalBaseScience * 0.25))
        : 0;

    const scienceGained = outcome.ascentFailed
      ? 0
      : totalBaseScience + (outcome.boosterLanded ? 15 : 5) + manualBonusScience;

    const constellationNodes = outcome.ascentFailed
      ? 0
      : contractsToFinalize.filter(c => c.isConstellationMission).length;

    // ISA Founders' Bridge loan withholding (25% deducted on next 3 payouts)
    let netCashToAward = totalGrossCash;
    if (activeLoan && activeLoan.payoutsRemaining > 0 && totalGrossCash > 0) {
      const withholding = Math.round(totalGrossCash * activeLoan.withholdingPercent);
      netCashToAward = Math.max(0, totalGrossCash - withholding);
      const remainingPayouts = activeLoan.payoutsRemaining - 1;
      if (remainingPayouts <= 0) {
        setActiveLoan(null);
      } else {
        setActiveLoan(prev => (prev ? { ...prev, payoutsRemaining: remainingPayouts } : null));
      }
    }

    // Award cash & research points
    setCash(prev => prev + netCashToAward);
    setScience(prev => prev + scienceGained);

    // Add satellite to StarStream mesh if applicable
    if (constellationNodes > 0) {
      setSatellites(prev => prev + constellationNodes);
    }

    // Check if any contract unlocked a Kosha depot (e.g. Kosha-LEO)
    if (!outcome.ascentFailed) {
      const unlockedDepotContract = contractsToFinalize.find(c => c.unlocksDepotId);
      if (unlockedDepotContract && unlockedDepotContract.unlocksDepotId) {
        const depotId = unlockedDepotContract.unlocksDepotId;
        setKoshaDepots(prev =>
          prev.map(depot => (depot.id === depotId ? { ...depot, unlocked: true } : depot))
        );
      }
    }

    // Add landed booster to hangar
    if (outcome.boosterLanded) {
      const serialNum = `${rocket.name.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 899)}`;
      const isHard = Boolean(outcome.isHardLanding);
      const newBooster: BoosterInventoryItem = {
        id: serialNum,
        rocketId: rocket.id,
        rocketName: rocket.name,
        flightsCompleted: 1,
        condition: isHard ? 25 : outcome.boosterCondition,
        refurbished: true,
        isHardLanding: isHard,
        refurbCostMultiplier: isHard ? 0.70 : rocket.refurbishCostPercent,
      };
      setHangarBoosters(prev => [newBooster, ...prev]);
    }

    // Update Lifetime Stats
    setStats(prev => ({
      totalLaunches: prev.totalLaunches + 1,
      successfulOrbits: prev.successfulOrbits + (outcome.orbitSuccess ? 1 : 0),
      boostersLanded: prev.boostersLanded + (outcome.boosterLanded ? 1 : 0),
      manualLandingsCount:
        prev.manualLandingsCount + (!isAutoLand && outcome.boosterLanded ? 1 : 0),
      autoLandingsCount: (prev.autoLandingsCount || 0) + (isAutoLand && outcome.boosterLanded ? 1 : 0),
      hardLandingsCount: (prev.hardLandingsCount || 0) + (outcome.isHardLanding ? 1 : 0),
      totalEarnings: prev.totalEarnings + netCashToAward,
      totalSavings: prev.totalSavings + savingsAchieved,
    }));

    // Reset active mission
    setActiveMission(null);

    // Mark contracts completed if orbit succeeded
    if (outcome.orbitSuccess) {
      setContracts(prev =>
        prev.map(c =>
          contractsToFinalize.some(tc => tc.id === c.id) ? { ...c, completed: true } : c
        )
      );
    }
  };

  // Abort: refund the launch cost and return to mission control
  const handleAbortMission = () => {
    if (activeMission) {
      const { rocket, usedBoosterId } = activeMission;
      const refund = usedBoosterId
        ? Math.round(rocket.cost * rocket.refurbishCostPercent)
        : rocket.cost;
      setCash(prev => prev + refund);
    }
    setActiveMission(null);
  };

  // Unlock Rocket & check ARIA tier progression
  const handleUnlockRocket = (rocketId: string) => {
    const target = rockets.find(r => r.id === rocketId);
    if (!target || science < target.unlockCost) return;

    setScience(prev => prev - target.unlockCost);
    setRockets(prev =>
      prev.map(r => (r.id === rocketId ? { ...r, unlocked: true } : r))
    );

    // Advance ARIA tier if applicable
    if (rocketId === 'vahana' && ariaTier < 1) {
      setAriaTier(1);
    } else if (rocketId === 'setu' && ariaTier < 2) {
      setAriaTier(2);
    } else if ((rocketId === 'airavata' || rocketId === 'bharavaha') && ariaTier < 3) {
      setAriaTier(3);
    }
  };

  // Scrap booster for salvage
  const handleScrapBooster = (boosterId: string) => {
    sounds.playBeep(440, 0.1);
    setHangarBoosters(prev => prev.filter(b => b.id !== boosterId));
    setCash(prev => prev + 35000);
    setScience(prev => prev + 10);
  };

  // Upgrade Tech
  const handleUpgradeTech = (techId: string) => {
    const target = techTree.find(t => t.id === techId);
    if (!target) return;
    const cost = target.costScience * (target.level + 1);
    if (science < cost) return;

    setScience(prev => prev - cost);
    setTechTree(prev =>
      prev.map(t =>
        t.id === techId
          ? { ...t, level: t.level + 1, unlocked: true }
          : t
      )
    );
  };

  // Insolvency Action 1: Accept ISA Founders' Bridge Loan
  const handleAcceptBridgeLoan = () => {
    setCash(prev => prev + bridgeLoanAmount);
    setActiveLoan({
      active: true,
      principal: bridgeLoanAmount,
      payoutsRemaining: 3,
      withholdingPercent: 0.25,
      actTaken: currentAct,
    });
    setBridgeLoansTakenPerAct(prev => ({
      ...prev,
      [currentAct]: true,
    }));
  };

  // Insolvency Action 2: Chapter 11 Reorganization (Restart Act, Keep RP & Blueprints)
  const handleRestartAct = () => {
    // Reset cash to starting kit
    setCash(400000);
    // Clear hangar
    setHangarBoosters([]);
    // Clear loan
    setActiveLoan(null);
    setBridgeLoansTakenPerAct(prev => ({
      ...prev,
      [currentAct]: false,
    }));
    // If Act 1, reset satellites
    if (currentAct === 1) {
      setSatellites(0);
    }
    // Reopen incomplete/completed contracts for this act
    setContracts(prev =>
      prev.map(c => (c.act === currentAct ? { ...c, completed: false } : c))
    );
    // Keep RP (science), techTree, and unlocked rockets!
  };

  // Calculate live loan withholding for debrief
  const activeMissionGross = useMemo(() => {
    if (!activeMission) return 0;
    const { contract, bundledContracts } = activeMission;
    const activeContracts = bundledContracts && bundledContracts.length > 0 ? bundledContracts : [contract];
    return activeContracts.reduce((sum, c) => sum + c.rewardCash, 0);
  }, [activeMission]);

  const currentLoanWithholding =
    activeLoan && activeLoan.payoutsRemaining > 0
      ? Math.round(activeMissionGross * activeLoan.withholdingPercent)
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white pb-20 md:pb-0">
      {/* Top Telemetry & Economy Navbar */}
      <Header
        cash={cash}
        science={science}
        satellites={satellites}
        passiveRate={passiveRate}
        hangarCount={hangarBoosters.length}
        ariaTier={ariaTier}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        companyName={companyName}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        {activeMission ? (
          <LaunchDirector
            mission={activeMission}
            techTree={techTree}
            loanWithholding={currentLoanWithholding}
            loanPayoutsRemaining={activeLoan?.payoutsRemaining ?? 0}
            act={currentAct}
            onMissionFinalized={handleMissionFinalized}
            onAbort={handleAbortMission}
          />
        ) : (
          <HQView
            cash={cash}
            science={science}
            satellites={satellites}
            passiveRate={passiveRate}
            stats={stats}
            contracts={contracts}
            rockets={rockets}
            hangarBoosters={hangarBoosters}
            techTree={techTree}
            ariaTier={ariaTier}
            koshaDepots={koshaDepots}
            onInitiateLaunch={handleInitiateLaunch}
            onUnlockRocket={handleUnlockRocket}
            onScrapBooster={handleScrapBooster}
            onUpgradeTech={handleUpgradeTech}
          />
        )}
      </main>

      {/* Insolvency / Fail-state Modal */}
      {isInsolvent && (
        <InsolvencyModal
          currentAct={currentAct}
          loanAlreadyTaken={Boolean(bridgeLoansTakenPerAct[currentAct])}
          loanAmount={bridgeLoanAmount}
          science={science}
          onAcceptLoan={handleAcceptBridgeLoan}
          onRestartAct={handleRestartAct}
        />
      )}

      {/* Global Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-950/80 px-4 py-2 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            SPACEY CANON v3
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">Act {currentAct}: Autonomous Space Logistics</span>
          {activeLoan && activeLoan.payoutsRemaining > 0 && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-semibold">
                ISA Bridge Active (25% Withholding &bull; {activeLoan.payoutsRemaining}/3 left)
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Manual Landings: {stats.manualLandingsCount}</span>
          <span className="text-slate-600">|</span>
          <span>ARIA-{ariaTier} Systems Nominal</span>
        </div>
      </footer>
    </div>
  );
}
export default App;
