import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HQView } from './components/HQ/HQView';
import { LaunchDirector } from './components/Launch/LaunchDirector';
import {
  INITIAL_ROCKETS,
  INITIAL_CONTRACTS,
  INITIAL_TECH,
  INITIAL_KOSHA_DEPOTS,
} from './data/initialData';
import type {
  RocketModel,
  Contract,
  BoosterInventoryItem,
  TechUpgrade,
  MissionStats,
  ActiveMission,
  KoshaDepot,
} from './types/game';
import { sounds } from './utils/audio';

const STORAGE_KEY = 'spacey_save_v1';

interface SavedState {
  cash?: number;
  science?: number;
  satellites?: number;
  ariaTier?: number;
  koshaDepots?: KoshaDepot[];
  rockets?: RocketModel[];
  contracts?: Contract[];
  hangarBoosters?: BoosterInventoryItem[];
  techTree?: TechUpgrade[];
  stats?: MissionStats[];
}

const getSavedData = (): SavedState | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let initialLoadedSave: SavedState | null | undefined;
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
    // Map legacy ids to canonical Sanskrit ids
    if (r.id === 'aether-hopper' || r.id === 'laghu') {
      const canon = INITIAL_ROCKETS.find(i => i.id === 'laghu')!;
      return { ...canon, unlocked: true };
    }
    if (r.id === 'falcon-strike' || r.id === 'vahana') {
      const canon = INITIAL_ROCKETS.find(i => i.id === 'vahana')!;
      return { ...canon, unlocked: r.unlocked };
    }
    if (r.id === 'titan-heavy' || r.id === 'airavata') {
      const canon = INITIAL_ROCKETS.find(i => i.id === 'airavata')!;
      return { ...canon, unlocked: r.unlocked };
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
  // If save had old contracts, upgrade to canonical manifest
  const hasLegacy = savedContracts.some(c => c.id === 'contract-cubesat-1' || c.minRocketTier === 'aether-hopper');
  if (hasLegacy) return INITIAL_CONTRACTS;

  const mapped = [...savedContracts];
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
  const [science, setScience] = useState<number>(() => initial?.science ?? 25);
  const [satellites, setSatellites] = useState<number>(() => initial?.satellites ?? 0);
  const [ariaTier, setAriaTier] = useState<number>(() => initial?.ariaTier ?? 0);
  const [koshaDepots, setKoshaDepots] = useState<KoshaDepot[]>(() => migrateDepots(initial?.koshaDepots));

  const [rockets, setRockets] = useState<RocketModel[]>(() => migrateRockets(initial?.rockets));
  const [contracts] = useState<Contract[]>(() => migrateContracts(initial?.contracts));
  const [hangarBoosters, setHangarBoosters] = useState<BoosterInventoryItem[]>(() => migrateBoosters(initial?.hangarBoosters));
  const [techTree, setTechTree] = useState<TechUpgrade[]>(() => migrateTechTree(initial?.techTree));

  const [stats, setStats] = useState<MissionStats>(() => {
    const s = initial?.stats as unknown as MissionStats | undefined;
    return (
      s ?? {
        totalLaunches: 0,
        successfulOrbits: 0,
        boostersLanded: 0,
        totalEarnings: 0,
        totalSavings: 0,
      }
    );
  });

  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const companyName = 'SPACEY';

  // Compute StarStream passive rate
  const bandwidthTech = techTree.find(t => t.id === 'tech-relay-tuning');
  const baseRatePerSat = 40;
  const bonusPerSat = bandwidthTech && bandwidthTech.unlocked ? bandwidthTech.level * bandwidthTech.statBonus : 0;
  const passiveRate = satellites * (baseRatePerSat + bonusPerSat);

  // Autosave tracking
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const stateToSave = {
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
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore quota storage errors
    }
  }, [cash, science, satellites, ariaTier, koshaDepots, rockets, contracts, hangarBoosters, techTree, stats]);

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
    bundledContracts?: Contract[]
  ) => {
    const launchCost = boosterId
      ? Math.round(rocket.cost * rocket.refurbishCostPercent)
      : rocket.cost;

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
    });
  };

  // Launch Finalization
  const handleMissionFinalized = (outcome: {
    orbitSuccess: boolean;
    boosterLanded: boolean;
    boosterCondition: number;
  }) => {
    if (!activeMission) return;

    const { contract, bundledContracts, rocket, usedBoosterId } = activeMission;
    const launchCost = usedBoosterId
      ? Math.round(rocket.cost * rocket.refurbishCostPercent)
      : rocket.cost;

    const savingsAchieved = usedBoosterId ? rocket.cost - launchCost : 0;

    const contractsToFinalize =
      bundledContracts && bundledContracts.length > 0 ? bundledContracts : [contract];

    const totalGrossCash = contractsToFinalize.reduce((sum, c) => sum + c.rewardCash, 0);
    const totalBaseScience = contractsToFinalize.reduce((sum, c) => sum + c.rewardScience, 0);
    const scienceGained = totalBaseScience + (outcome.boosterLanded ? 15 : 5);
    const constellationNodes = contractsToFinalize.filter(c => c.isConstellationMission).length;

    // Award cash & research points
    setCash(prev => prev + totalGrossCash);
    setScience(prev => prev + scienceGained);

    // Add satellite to StarStream mesh if applicable
    if (constellationNodes > 0) {
      setSatellites(prev => prev + constellationNodes);
    }

    // Check if any contract unlocked a Kosha depot (e.g. Kosha-LEO)
    const unlockedDepotContract = contractsToFinalize.find(c => c.unlocksDepotId);
    if (unlockedDepotContract && unlockedDepotContract.unlocksDepotId) {
      const depotId = unlockedDepotContract.unlocksDepotId;
      setKoshaDepots(prev =>
        prev.map(depot => (depot.id === depotId ? { ...depot, unlocked: true } : depot))
      );
    }

    // Add landed booster to hangar
    if (outcome.boosterLanded) {
      const serialNum = `${rocket.name.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 899)}`;
      const newBooster: BoosterInventoryItem = {
        id: serialNum,
        rocketId: rocket.id,
        rocketName: rocket.name,
        flightsCompleted: 1,
        condition: outcome.boosterCondition,
        refurbished: true,
      };
      setHangarBoosters(prev => [newBooster, ...prev]);
    }

    // Update Lifetime Stats
    setStats(prev => ({
      totalLaunches: prev.totalLaunches + 1,
      successfulOrbits: prev.successfulOrbits + 1,
      boostersLanded: prev.boostersLanded + (outcome.boosterLanded ? 1 : 0),
      totalEarnings: prev.totalEarnings + totalGrossCash,
      totalSavings: prev.totalSavings + savingsAchieved,
    }));

    // Reset active mission
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

  const handleResetGame = () => {
    if (window.confirm('Reset all progress and restart Spacey campaign?')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

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
            onMissionFinalized={handleMissionFinalized}
            onAbort={() => setActiveMission(null)}
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

      {/* Subtle Mobile-Friendly Footer */}
      <footer className="border-t border-slate-900/80 py-2.5 px-4 text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2">
        <span>SPACEY Canon v3 • ARIA Tier {ariaTier}</span>
        <span>•</span>
        <span className="text-emerald-500/80">Autosave: Active</span>
        <span>•</span>
        <button
          onClick={handleResetGame}
          className="text-slate-400 hover:text-rose-400 cursor-pointer transition-colors underline"
        >
          Reset Campaign
        </button>
      </footer>
    </div>
  );
}

export default App;
