import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HQView } from './components/HQ/HQView';
import { LaunchDirector } from './components/Launch/LaunchDirector';
import type {
  RocketModel,
  Contract,
  TechUpgrade,
  BoosterInventoryItem,
  MissionStats,
  ActiveMission,
} from './types/game';
import { INITIAL_ROCKETS, INITIAL_CONTRACTS, INITIAL_TECH } from './data/initialData';
import { sounds } from './utils/audio';

const STORAGE_KEY = 'spacey_save_v1';

interface SavedState {
  cash?: number;
  science?: number;
  satellites?: number;
  rockets?: RocketModel[];
  contracts?: Contract[];
  hangarBoosters?: BoosterInventoryItem[];
  techTree?: TechUpgrade[];
  stats?: MissionStats;
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

export function App() {
  const initial = getInitialSave();

  const [cash, setCash] = useState<number>(() => initial?.cash ?? 450000);
  const [science, setScience] = useState<number>(() => initial?.science ?? 15);
  const [satellites, setSatellites] = useState<number>(() => initial?.satellites ?? 0);
  const [companyName] = useState<string>('AETHER DYNAMICS');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [rockets, setRockets] = useState<RocketModel[]>(() => initial?.rockets ?? INITIAL_ROCKETS);
  const [contracts] = useState<Contract[]>(() => initial?.contracts ?? INITIAL_CONTRACTS);
  const [hangarBoosters, setHangarBoosters] = useState<BoosterInventoryItem[]>(() => initial?.hangarBoosters ?? []);
  const [techTree, setTechTree] = useState<TechUpgrade[]>(() => initial?.techTree ?? INITIAL_TECH);

  const [stats, setStats] = useState<MissionStats>(() => initial?.stats ?? {
    totalLaunches: 0,
    successfulOrbits: 0,
    boostersLanded: 0,
    totalEarnings: 0,
    totalSavings: 0,
  });

  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);

  // Save to local storage on state change
  const saveTimeout = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            cash,
            science,
            satellites,
            rockets,
            contracts,
            hangarBoosters,
            techTree,
            stats,
          })
        );
      } catch {
        // ignore
      }
    }, 400);
  }, [cash, science, satellites, rockets, contracts, hangarBoosters, techTree, stats]);

  // Calculate passive income rate ($/sec)
  const bandwidthTech = techTree.find(t => t.id === 'tech-satellite-bandwidth');
  const ratePerSat = 25 + (bandwidthTech ? bandwidthTech.level * bandwidthTech.statBonus : 0);
  const passiveRate = satellites * ratePerSat;

  // Passive income tick interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (passiveRate > 0) {
        setCash(prev => prev + passiveRate);
        setStats(prev => ({
          ...prev,
          totalEarnings: prev.totalEarnings + passiveRate,
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [passiveRate]);

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  // Launch Initiation
  const handleInitiateLaunch = (contract: Contract, rocket: RocketModel, boosterId?: string) => {
    const launchCost = boosterId
      ? Math.round(rocket.cost * rocket.refurbishCostPercent)
      : rocket.cost;

    if (cash < launchCost) return;

    // Deduct cost
    setCash(prev => prev - launchCost);

    // If booster was used, consume it from hangar
    if (boosterId) {
      setHangarBoosters(prev => prev.filter(b => b.id !== boosterId));
    }

    setActiveMission({
      contract,
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

    const { contract, rocket, usedBoosterId } = activeMission;
    const launchCost = usedBoosterId
      ? Math.round(rocket.cost * rocket.refurbishCostPercent)
      : rocket.cost;

    const savingsAchieved = usedBoosterId ? rocket.cost - launchCost : 0;

    // Award cash & science
    const scienceGained = contract.rewardScience + (outcome.boosterLanded ? 15 : 5);
    setCash(prev => prev + contract.rewardCash);
    setScience(prev => prev + scienceGained);

    // Add satellite to constellation if applicable
    if (contract.isConstellationMission) {
      setSatellites(prev => prev + 1);
    }

    // Add landed booster to hangar
    if (outcome.boosterLanded) {
      const serialNum = `B${Math.floor(1050 + Math.random() * 40)}-F${Math.floor(1 + Math.random() * 3)}`;
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
      totalEarnings: prev.totalEarnings + contract.rewardCash,
      totalSavings: prev.totalSavings + savingsAchieved,
    }));

    // Reset active mission
    setActiveMission(null);
  };

  // Unlock Rocket
  const handleUnlockRocket = (rocketId: string) => {
    const target = rockets.find(r => r.id === rocketId);
    if (!target || science < target.unlockCost) return;

    setScience(prev => prev - target.unlockCost);
    setRockets(prev =>
      prev.map(r => (r.id === rocketId ? { ...r, unlocked: true } : r))
    );
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
            onInitiateLaunch={handleInitiateLaunch}
            onUnlockRocket={handleUnlockRocket}
            onScrapBooster={handleScrapBooster}
            onUpgradeTech={handleUpgradeTech}
          />
        )}
      </main>

      {/* Footer Status Bar (Desktop) */}
      <footer className="hidden md:flex border-t border-slate-900 bg-slate-950/80 px-4 py-2.5 text-xs font-mono text-slate-500 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            SPACEY v1.1.0 Mobile MVP
          </span>
          <span>•</span>
          <span>Autosave: Active</span>
        </div>

        <button
          onClick={handleResetGame}
          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
        >
          Reset Campaign
        </button>
      </footer>
    </div>
  );
}

export default App;
