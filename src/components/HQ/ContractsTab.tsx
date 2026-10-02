import React, { useState, useMemo, useEffect } from 'react';
import type { Contract, RocketModel, BoosterInventoryItem, KoshaDepot, TechUpgrade } from '../../types/game';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  X,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { sounds } from '../../utils/audio';

interface ContractsTabProps {
  contracts: Contract[];
  rockets: RocketModel[];
  hangarBoosters: BoosterInventoryItem[];
  cash: number;
  ariaTier?: number;
  koshaDepots?: KoshaDepot[];
  manualLandingsCount?: number;
  techTree?: TechUpgrade[];
  onInitiateLaunch: (
    contract: Contract,
    rocket: RocketModel,
    boosterId?: string,
    bundledContracts?: Contract[],
    isAutoLand?: boolean
  ) => void;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({
  contracts,
  rockets,
  hangarBoosters,
  cash,
  ariaTier = 0,
  koshaDepots = [],
  manualLandingsCount = 0,
  techTree = [],
  onInitiateLaunch,
}) => {
  const [filter, setFilter] = useState<'all' | 'act1' | 'act2' | 'constellation'>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // ARIA Tier 1 Manifest Planner multi-payload bundling
  const [manifestMode, setManifestMode] = useState(false);
  const [manifestIds, setManifestIds] = useState<string[]>([]);
  const [isAutoLand, setIsAutoLand] = useState(false);

  // Auto-land unlock check (requires 3 manual landings)
  const autoLandUnlocked = manualLandingsCount >= 3;

  // Find first unlocked rocket as default selection (prefer Vahana in manifest mode if unlocked)
  const defaultRocketId = useMemo(() => {
    if (manifestMode) {
      const vahana = rockets.find(r => r.id === 'vahana' && r.unlocked);
      if (vahana) return vahana.id;
    }
    const unlocked = rockets.find(r => r.unlocked);
    return unlocked ? unlocked.id : '';
  }, [rockets, manifestMode]);

  const [selectedRocketId, setSelectedRocketId] = useState<string>(defaultRocketId);
  const [selectedBoosterId, setSelectedBoosterId] = useState<string>('');

  // Active rocket
  const activeRocketId = selectedRocketId || defaultRocketId;
  const currentRocket = rockets.find(r => r.id === activeRocketId);
  const availableBoosters = hangarBoosters.filter(b => b.rocketId === activeRocketId);

  // Helper to calculate booster refurbishment cost
  const getBoosterRefurbCost = (booster: BoosterInventoryItem, rocket: RocketModel) => {
    const rate = booster.refurbCostMultiplier ?? (booster.isHardLanding ? 0.70 : rocket.refurbishCostPercent);
    return Math.round(rocket.cost * rate);
  };

  // Default to the cheapest hangar core whenever a contract is selected or rocket changes!
  useEffect(() => {
    if (currentRocket && availableBoosters.length > 0) {
      const sorted = [...availableBoosters].sort((a, b) => {
        return getBoosterRefurbCost(a, currentRocket) - getBoosterRefurbCost(b, currentRocket);
      });
      setSelectedBoosterId(sorted[0].id);
    } else {
      setSelectedBoosterId('');
    }
  }, [selectedContract?.id, activeRocketId]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    if (filter === 'act1') {
      return contracts.filter(c => c.act === 1);
    }
    if (filter === 'act2') {
      return contracts.filter(c => c.act === 2);
    }
    if (filter === 'constellation') {
      return contracts.filter(c => c.isConstellationMission);
    }
    return contracts;
  }, [contracts, filter]);

  // Manifest calculation
  const bundledContracts = useMemo(() => {
    return contracts.filter(c => manifestIds.includes(c.id));
  }, [contracts, manifestIds]);

  const manifestTotalMass = useMemo(() => {
    return bundledContracts.reduce((sum, c) => sum + c.payloadMassKg, 0);
  }, [bundledContracts]);

  const manifestTotalCash = useMemo(() => {
    return bundledContracts.reduce((sum, c) => sum + c.rewardCash, 0);
  }, [bundledContracts]);



  // Calculate launch cost based on whether reusing a booster
  const getLaunchCost = () => {
    if (!currentRocket) return 0;
    if (selectedBoosterId) {
      const booster = availableBoosters.find(b => b.id === selectedBoosterId);
      if (booster) return getBoosterRefurbCost(booster, currentRocket);
      return Math.round(currentRocket.cost * currentRocket.refurbishCostPercent);
    }
    return currentRocket.cost;
  };

  const currentCost = getLaunchCost();
  const canAfford = cash >= currentCost;
  const hasKoshaOnline = koshaDepots.some(k => k.unlocked);
  const koshaBlocked = currentRocket?.requiresKosha && !hasKoshaOnline;

  // Single flight capacity check
  const singleCanCarry =
    selectedContract && currentRocket ? currentRocket.payloadCapacityKg >= selectedContract.payloadMassKg : true;

  // Manifest capacity check
  const manifestCanCarry =
    currentRocket ? currentRocket.payloadCapacityKg >= manifestTotalMass && manifestIds.length > 0 : false;

  const toggleContractInManifest = (contractId: string) => {
    sounds.playBeep(manifestIds.includes(contractId) ? 480 : 640, 0.05);
    setManifestIds(prev =>
      prev.includes(contractId) ? prev.filter(id => id !== contractId) : [...prev, contractId]
    );
  };

  const handleSingleLaunch = () => {
    if (!selectedContract || !currentRocket) return;
    sounds.playSuccess();
    onInitiateLaunch(selectedContract, currentRocket, selectedBoosterId || undefined, undefined, isAutoLand);
    setSelectedContract(null);
  };

  const handleManifestLaunch = () => {
    if (!currentRocket || bundledContracts.length === 0) return;
    sounds.playSuccess();
    onInitiateLaunch(bundledContracts[0], currentRocket, selectedBoosterId || undefined, bundledContracts, isAutoLand);
    setManifestIds([]);
    setManifestMode(false);
  };

  // Calculate live auto-land probability for display
  const recoveryTechLevels = useMemo(() => {
    const recoveryTechs = techTree.filter(
      t => t.category === 'recovery' || t.id === 'tech-lattice-fins' || t.id === 'tech-settling-thrusters'
    );
    return Math.min(6, recoveryTechs.reduce((acc, t) => acc + (t.unlocked ? t.level : 0), 0));
  }, [techTree]);

  const activeBooster = availableBoosters.find(b => b.id === selectedBoosterId);
  const boosterCond = activeBooster ? activeBooster.condition : 100;
  const actNumber = selectedContract?.act || 1;
  const actsBeyondActI = Math.max(0, actNumber - 1);
  const autoLandProb = Math.max(
    0.40,
    Math.min(0.95, 0.50 + 0.15 * (boosterCond / 100) + 0.04 * recoveryTechLevels - 0.05 * actsBeyondActI)
  );

  return (
    <div className="space-y-4">
      {/* Top Bar: Filters + ARIA Manifest Planner Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-800">
        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All Contracts' },
            { id: 'act1', label: 'Act I (Laghu)' },
            { id: 'act2', label: 'Act II (Vahana)' },
            { id: 'constellation', label: 'StarStream Mesh' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setFilter(tab.id as typeof filter);
                sounds.playBeep(700, 0.04);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 cursor-pointer ${
                filter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ARIA Manifest Toggle (Tier 1+) */}
        {ariaTier >= 1 ? (
          <button
            onClick={() => {
              setManifestMode(!manifestMode);
              sounds.playBeep(manifestMode ? 440 : 880, 0.08);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
              manifestMode
                ? 'bg-purple-600/30 text-purple-300 border-purple-500 shadow-sm shadow-purple-500/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-purple-500/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>MANIFEST PLANNER: {manifestMode ? 'ACTIVE' : 'OFF'}</span>
          </button>
        ) : (
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            ARIA-1 Manifest Bundling: Locked (Act II)
          </div>
        )}
      </div>

      {/* Manifest Mode Banner */}
      {manifestMode && (
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-600/50 rounded-xl p-3.5 sm:p-4 text-xs font-mono flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div>
            <div className="text-purple-300 font-bold flex items-center gap-1.5 text-sm">
              <Layers className="w-4 h-4 text-purple-400" />
              ARIA Multi-Payload Manifest Bundler
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Select multiple payloads to bundle onto a single Vahana or heavy launcher flight. Maximize orbital margins.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Payload Selected:</div>
              <div className="font-bold text-white">
                {manifestIds.length} {manifestIds.length === 1 ? 'Payload' : 'Payloads'} &bull; {manifestTotalMass.toLocaleString()} kg
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400">Combined Gross:</div>
              <div className="font-bold text-emerald-400 font-mono-numbers">
                +{manifestTotalCash.toLocaleString()} Cr
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredContracts.map(contract => {
          const isSelected = selectedContract?.id === contract.id;
          const isInManifest = manifestIds.includes(contract.id);

          return (
            <div
              key={contract.id}
              className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all ${
                isInManifest
                  ? 'bg-purple-950/30 border-purple-500 shadow-md shadow-purple-500/10'
                  : isSelected
                  ? 'bg-slate-900/90 border-cyan-500 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header Tag / Client */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">
                    {contract.client}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {contract.isSpotMarket && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                        SPOT MARKET
                      </span>
                    )}
                    {contract.isConstellationMission && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                        +RELAY NODE
                      </span>
                    )}
                    {contract.act && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        Act {contract.act}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {contract.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {contract.description}
                </p>

                {/* Details Pill Row */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-800/80 pt-2.5">
                  <div>
                    <span className="text-slate-400 text-[10px] block">PAYLOAD MASS</span>
                    <span className="text-white font-semibold">{contract.payloadMassKg.toLocaleString()} kg</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">RESEARCH YIELD</span>
                    <span className="text-purple-300 font-semibold">+{contract.rewardScience} RP</span>
                  </div>
                </div>
              </div>

              {/* Reward & Action */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-400">BOUNTY</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono-numbers">
                    +{contract.rewardCash.toLocaleString()} Cr
                  </div>
                </div>

                {manifestMode ? (
                  <button
                    onClick={() => toggleContractInManifest(contract.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      isInManifest
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60'
                    }`}
                  >
                    {isInManifest ? '✓ IN MANIFEST' : '+ BUNDLE'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sounds.playBeep(800, 0.05);
                      setSelectedContract(contract);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1"
                  >
                    <span>ASSIGN FLIGHT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flight Preparation Drawer / Modal (Single Flight Mode) */}
      {selectedContract && !manifestMode && (() => {
        const freshNet = selectedContract.rewardCash - (currentRocket?.cost || 0);
        const lowestRefurbCost =
          availableBoosters.length > 0 && currentRocket
            ? Math.min(...availableBoosters.map(b => getBoosterRefurbCost(b, currentRocket)))
            : currentRocket
            ? Math.round(currentRocket.cost * currentRocket.refurbishCostPercent)
            : 0;
        const reusedNet = selectedContract.rewardCash - lowestRefurbCost;
        const reusedSavings = currentRocket ? currentRocket.cost - lowestRefurbCost : 0;

        return (
          <div className="fixed inset-x-0 bottom-0 sm:static bg-slate-900 border-t sm:border border-cyan-500/50 sm:rounded-2xl p-4 pb-24 sm:p-6 sm:pb-6 shadow-2xl z-50 max-h-[85vh] sm:max-h-none overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  Payload Selected
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  {selectedContract.title}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {selectedContract.payloadMassKg.toLocaleString()} kg
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side-by-Side Economics Comparison Pill */}
            {currentRocket && (
              <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {/* Fresh Core Projection */}
                <div
                  onClick={() => setSelectedBoosterId('')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedBoosterId === ''
                      ? 'border-cyan-500/80 bg-cyan-950/20'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" /> Fresh Core Flight
                    </span>
                    {selectedBoosterId === '' && (
                      <span className="text-[9px] text-cyan-400 font-bold">SELECTED</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Launch Cost:</span>
                    <span className="text-rose-400 font-bold">-{currentRocket.cost.toLocaleString()} Cr</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Projected Net:</span>
                    <span className={`font-bold ${freshNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {freshNet >= 0 ? '+' : ''}{freshNet.toLocaleString()} Cr
                    </span>
                  </div>
                </div>

                {/* Reused Core Projection */}
                <div
                  onClick={() => {
                    if (availableBoosters.length > 0) {
                      const sorted = [...availableBoosters].sort(
                        (a, b) => getBoosterRefurbCost(a, currentRocket) - getBoosterRefurbCost(b, currentRocket)
                      );
                      setSelectedBoosterId(sorted[0].id);
                    }
                  }}
                  className={`p-2.5 rounded-lg border transition-all ${
                    availableBoosters.length === 0
                      ? 'border-slate-800/40 bg-slate-900/20 opacity-60 cursor-not-allowed'
                      : selectedBoosterId !== ''
                      ? 'border-emerald-500/80 bg-emerald-950/20 cursor-pointer'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Reused Core Flight
                    </span>
                    {selectedBoosterId !== '' && (
                      <span className="text-[9px] text-emerald-400 font-bold">SELECTED</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Launch Cost:</span>
                    <span className="text-emerald-400 font-bold">
                      -{lowestRefurbCost.toLocaleString()} Cr
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Projected Net:</span>
                    <span className="text-emerald-400 font-bold font-mono-numbers">
                      +{reusedNet.toLocaleString()} Cr
                    </span>
                  </div>
                  {reusedSavings > 0 && availableBoosters.length > 0 && (
                    <div className="text-[9px] text-cyan-300 mt-1 font-semibold">
                      ✨ Saves {reusedSavings.toLocaleString()} Cr on core turnaround
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rocket Selection & Booster Reuse selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rocket Model Picker */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-2">
                  1. Select Vehicle Class
                </label>
                <div className="space-y-1.5">
                  {rockets
                    .filter(r => r.unlocked)
                    .map(rocket => {
                      const isSelected = activeRocketId === rocket.id;
                      const canCarry = rocket.payloadCapacityKg >= selectedContract.payloadMassKg;
                      return (
                        <div
                          key={rocket.id}
                          onClick={() => {
                            setSelectedRocketId(rocket.id);
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-slate-800 border-cyan-500 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{rocket.icon}</span>
                            <div>
                              <div className="font-semibold text-white text-xs sm:text-sm">
                                {rocket.name} {rocket.sanskritRoot ? `(${rocket.sanskritRoot})` : ''}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                Payload Cap: {rocket.payloadCapacityKg.toLocaleString()} kg
                              </div>
                            </div>
                          </div>

                          {!canCarry && (
                            <div className="text-[10px] font-mono text-rose-400 flex items-center gap-1 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/50">
                              <AlertTriangle className="w-3 h-3" /> Under-capacity
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Booster Selection */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-2">
                  2. Booster Core Assignment (Default: Cheapest Core)
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {/* Brand new core option */}
                  <div
                    onClick={() => setSelectedBoosterId('')}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      selectedBoosterId === ''
                        ? 'bg-slate-800 border-cyan-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs font-semibold text-white">Fabricate New Booster</div>
                        <div className="text-[10px] text-slate-400">100% factory spec integrity</div>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-white">
                      {currentRocket ? `${currentRocket.cost.toLocaleString()} Cr` : ''}
                    </div>
                  </div>

                  {/* Reused boosters from hangar */}
                  {availableBoosters.map(booster => {
                    const isSelected = selectedBoosterId === booster.id;
                    const refurbPrice = currentRocket ? getBoosterRefurbCost(booster, currentRocket) : 0;
                    return (
                      <div
                        key={booster.id}
                        onClick={() => setSelectedBoosterId(booster.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                              <span>{booster.id}</span>
                              <span
                                className={`text-[10px] px-1 rounded ${
                                  booster.isHardLanding
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-emerald-950 text-emerald-400'
                                }`}
                              >
                                {booster.condition}% cond {booster.isHardLanding ? '(Hard Landing)' : ''}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {booster.flightsCompleted} flight{booster.flightsCompleted === 1 ? '' : 's'} logged
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-xs text-emerald-400 font-bold">
                            {refurbPrice.toLocaleString()} Cr
                          </div>
                          <div className="text-[9px] text-emerald-300 font-mono">
                            {booster.isHardLanding ? 'Heavy 70% refurb' : 'Refurb re-flight'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ARIA Auto-land Subroutine Toggle Bar */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-purple-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    autoLandUnlocked
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">ARIA Auto-Land Subroutine</span>
                    {autoLandUnlocked ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        {Math.round(autoLandProb * 100)}% Chance
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        Requires 3 manual landings ({manualLandingsCount}/3)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {autoLandUnlocked
                      ? isAutoLand
                        ? 'Idler mode: ~8s scripted descent. -10 condition on success. (Manual awards +25% RP and costs -5 condition).'
                        : 'Manual recovery engaged: Fly the landing burn to earn +25% RP and only -5 condition.'
                      : 'Achieve 3 successful manual drone ship landings to unlock ARIA automated booster recovery.'}
                  </p>
                </div>
              </div>

              {autoLandUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playBeep(isAutoLand ? 450 : 750, 0.05);
                    setIsAutoLand(!isAutoLand);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isAutoLand
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isAutoLand ? 'AUTOLAND: ON' : 'MANUAL: ON'}
                </button>
              )}
            </div>

            {/* Action Row & Confirmation */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs font-mono w-full sm:w-auto justify-between sm:justify-start">
                <div>
                  <span className="text-slate-400">Launch Cost:</span>{' '}
                  <strong className={canAfford ? 'text-white' : 'text-rose-400'}>
                    {currentCost.toLocaleString()} Cr
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Net Bounty:</span>{' '}
                  <strong className="text-emerald-400">
                    +{(selectedContract.rewardCash - currentCost).toLocaleString()} Cr
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedContract(null)}
                  className="w-1/3 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-mono text-xs cursor-pointer"
                >
                  Back
                </button>

                <button
                  disabled={!canAfford || !singleCanCarry || Boolean(koshaBlocked)}
                  onClick={handleSingleLaunch}
                  className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                    canAfford && singleCanCarry && !koshaBlocked
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white cursor-pointer active:scale-95 shadow-cyan-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>GO FOR LAUNCH</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manifest Mode Drawer */}
      {manifestMode && manifestIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 sm:static bg-slate-900 border-t sm:border border-purple-500/50 sm:rounded-2xl p-4 pb-24 sm:p-6 sm:pb-6 shadow-2xl z-50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">
                Manifest Assembly
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{bundledContracts.length} Payloads Bundled</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  {manifestTotalMass.toLocaleString()} kg Total
                </span>
              </h3>
            </div>
            <button
              onClick={() => setManifestIds([])}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ARIA Auto-land in Manifest */}
          {autoLandUnlocked && (
            <div className="mb-4 p-2.5 rounded-xl bg-slate-950/80 border border-purple-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>ARIA Auto-Land for Manifest:</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoLand(!isAutoLand)}
                className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  isAutoLand
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isAutoLand ? 'AUTOLAND: ON' : 'MANUAL: ON'}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400">Launch Cost:</span>{' '}
                <strong className={canAfford ? 'text-white' : 'text-rose-400'}>
                  {currentCost.toLocaleString()} Cr
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Gross Bounty:</span>{' '}
                <strong className="text-emerald-400">+{manifestTotalCash.toLocaleString()} Cr</strong>
              </div>
              <div>
                <span className="text-slate-400">Net Profit:</span>{' '}
                <strong className="text-emerald-400">
                  +{(manifestTotalCash - currentCost).toLocaleString()} Cr
                </strong>
              </div>
            </div>

            <button
              disabled={!canAfford || !manifestCanCarry}
              onClick={handleManifestLaunch}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                canAfford && manifestCanCarry
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white cursor-pointer active:scale-95 shadow-purple-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>DISPATCH MANIFEST FLIGHT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
