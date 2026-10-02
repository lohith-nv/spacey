import React, { useState, useMemo } from 'react';
import type { Contract, RocketModel, BoosterInventoryItem, KoshaDepot } from '../../types/game';
import { Atom, Weight, Satellite, AlertTriangle, ShieldCheck, X, Zap, ArrowRight } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface ContractsTabProps {
  contracts: Contract[];
  rockets: RocketModel[];
  hangarBoosters: BoosterInventoryItem[];
  cash: number;
  ariaTier?: number;
  koshaDepots?: KoshaDepot[];
  onInitiateLaunch: (contract: Contract, rocket: RocketModel, boosterId?: string) => void;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({
  contracts,
  rockets,
  hangarBoosters,
  cash,
  koshaDepots = [],
  onInitiateLaunch,
}) => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filter, setFilter] = useState<'all' | 'act1' | 'act2' | 'constellation'>('all');

  // Find first unlocked rocket as default selection
  const defaultRocketId = useMemo(() => {
    const unlocked = rockets.find(r => r.unlocked);
    return unlocked ? unlocked.id : '';
  }, [rockets]);

  const [selectedRocketId, setSelectedRocketId] = useState<string>(defaultRocketId);
  const [selectedBoosterId, setSelectedBoosterId] = useState<string>('');

  // Active rocket
  const activeRocketId = selectedRocketId || defaultRocketId;
  const currentRocket = rockets.find(r => r.id === activeRocketId);
  const availableBoosters = hangarBoosters.filter(b => b.rocketId === activeRocketId);

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

  // Calculate launch cost based on whether reusing a booster
  const getLaunchCost = () => {
    if (!currentRocket) return 0;
    if (selectedBoosterId) {
      return Math.round(currentRocket.cost * currentRocket.refurbishCostPercent);
    }
    return currentRocket.cost;
  };

  const currentCost = getLaunchCost();
  const canAfford = cash >= currentCost;
  const canCarryPayload =
    selectedContract && currentRocket ? currentRocket.payloadCapacityKg >= selectedContract.payloadMassKg : true;

  const hasKoshaOnline = koshaDepots.some(k => k.unlocked);
  const koshaBlocked = currentRocket?.requiresKosha && !hasKoshaOnline;

  const handleLaunchClick = () => {
    if (!selectedContract || !currentRocket || koshaBlocked) return;
    sounds.playBeep(700, 0.12, 'sine');
    onInitiateLaunch(selectedContract, currentRocket, selectedBoosterId || undefined);
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            Mission Contracts Manifest
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Accept payloads from client partners to earn Credits, Research, and StarStream relay nodes.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({contracts.length})
          </button>
          <button
            onClick={() => setFilter('act1')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'act1' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Act I (Laghu)
          </button>
          <button
            onClick={() => setFilter('act2')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'act2' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Act II (Vahana)
          </button>
          <button
            onClick={() => setFilter('constellation')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'constellation' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3 h-3 text-cyan-400" /> StarStream
          </button>
        </div>
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredContracts.map(contract => {
          const isSelected = selectedContract?.id === contract.id;
          return (
            <div
              key={contract.id}
              onClick={() => {
                setSelectedContract(contract);
                sounds.playBeep(520, 0.05);
              }}
              className={`relative cursor-pointer transition-all p-3.5 sm:p-4 rounded-xl border flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {contract.act && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      ACT {contract.act}
                    </span>
                  )}
                  {contract.isSpotMarket && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                      SPOT MARKET
                    </span>
                  )}
                </div>

                {contract.isConstellationMission && (
                  <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Satellite className="w-3 h-3" />
                    StarStream Node
                  </div>
                )}
              </div>

              <div>
                <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  {contract.client}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 leading-snug">
                  {contract.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {contract.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Weight className="w-3 h-3 text-slate-500" />
                    {contract.payloadMassKg.toLocaleString()} kg
                  </span>
                  <span className="text-purple-300 flex items-center gap-0.5 text-[11px]">
                    <Atom className="w-3 h-3 text-purple-400" />
                    +{contract.rewardScience} RP
                  </span>
                </div>

                <div className="font-mono-numbers font-bold text-emerald-400 text-sm">
                  {contract.rewardCash.toLocaleString()} Cr
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flight Preparation Drawer / Modal */}
      {selectedContract && (
        <div className="fixed inset-x-0 bottom-0 sm:static bg-slate-900 border-t sm:border border-cyan-500/50 sm:rounded-2xl p-4 sm:p-6 shadow-2xl z-50 max-h-[85vh] sm:max-h-none overflow-y-auto">
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
                          setSelectedBoosterId('');
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
                2. Booster Core Assignment
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
                  const refurbPrice = currentRocket
                    ? Math.round(currentRocket.cost * currentRocket.refurbishCostPercent)
                    : 0;
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
                            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1 rounded">
                              {booster.condition}% cond
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
                          Re-flight discount
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
                disabled={!canAfford || !canCarryPayload || Boolean(koshaBlocked)}
                onClick={handleLaunchClick}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  canAfford && canCarryPayload && !koshaBlocked
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
      )}
    </div>
  );
};
