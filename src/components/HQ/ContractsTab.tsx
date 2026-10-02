import React from 'react';
import type { Contract, RocketModel, BoosterInventoryItem } from '../../types/game';
import { ArrowUpRight, DollarSign, Atom, Weight, Satellite, AlertTriangle, ShieldCheck } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface ContractsTabProps {
  contracts: Contract[];
  rockets: RocketModel[];
  hangarBoosters: BoosterInventoryItem[];
  cash: number;
  onInitiateLaunch: (contract: Contract, rocket: RocketModel, boosterId?: string) => void;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({
  contracts,
  rockets,
  hangarBoosters,
  cash,
  onInitiateLaunch,
}) => {
  const [selectedContract, setSelectedContract] = React.useState<Contract | null>(null);
  const [selectedRocketId, setSelectedRocketId] = React.useState<string>('');
  const [selectedBoosterId, setSelectedBoosterId] = React.useState<string>('');

  // Default select first available rocket
  React.useEffect(() => {
    if (!selectedRocketId && rockets.length > 0) {
      const unlocked = rockets.find(r => r.unlocked);
      if (unlocked) setSelectedRocketId(unlocked.id);
    }
  }, [rockets, selectedRocketId]);

  const currentRocket = rockets.find(r => r.id === selectedRocketId);
  const availableBoosters = hangarBoosters.filter(b => b.rocketId === selectedRocketId);

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

  const handleLaunchClick = () => {
    if (!selectedContract || !currentRocket) return;
    sounds.playBeep(700, 0.12, 'sine');
    onInitiateLaunch(selectedContract, currentRocket, selectedBoosterId || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            Commercial & Defense Manifest
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Contract client payloads to generate treasury revenue and expand your global satellite network.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Telemetry Relay: <span className="text-cyan-300 font-mono">ONLINE</span>
        </div>
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contracts.map(contract => {
          const isSelected = selectedContract?.id === contract.id;
          return (
            <div
              key={contract.id}
              onClick={() => {
                setSelectedContract(contract);
                sounds.playBeep(520, 0.06);
              }}
              className={`relative cursor-pointer transition-all duration-200 p-5 rounded-xl border flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              {contract.isConstellationMission && (
                <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Satellite className="w-3 h-3" />
                  Constellation Node
                </div>
              )}

              <div>
                <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  {contract.client}
                </div>
                <h3 className="text-base font-bold text-white mt-1 leading-snug">{contract.title}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{contract.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Weight className="w-3.5 h-3.5 text-slate-500" /> Payload
                  </span>
                  <span className="font-semibold text-slate-200">
                    {contract.payloadMassKg.toLocaleString()} kg
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Atom className="w-3.5 h-3.5 text-purple-400" /> Science Reward
                  </span>
                  <span className="font-semibold text-purple-300">+{contract.rewardScience} PTS</span>
                </div>

                <div className="flex items-center justify-between text-sm font-mono-numbers">
                  <span className="text-slate-400 flex items-center gap-1 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Contract Bounty
                  </span>
                  <span className="font-bold text-emerald-400 text-base">
                    ${contract.rewardCash.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flight Preparation Drawer if Contract is Selected */}
      {selectedContract && (
        <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Selected Payload</div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {selectedContract.title}
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedContract.payloadMassKg} kg
                </span>
              </h3>
            </div>
            <button
              onClick={() => setSelectedContract(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Rocket Selection & Booster Reuse selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rocket Model Picker */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Select Launch Vehicle
              </label>
              <div className="space-y-2">
                {rockets
                  .filter(r => r.unlocked)
                  .map(rocket => {
                    const isSelected = selectedRocketId === rocket.id;
                    const canCarry = rocket.payloadCapacityKg >= selectedContract.payloadMassKg;
                    return (
                      <div
                        key={rocket.id}
                        onClick={() => {
                          setSelectedRocketId(rocket.id);
                          setSelectedBoosterId('');
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-800 border-cyan-500 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{rocket.icon}</span>
                          <div>
                            <div className="font-semibold text-white text-sm">{rocket.name}</div>
                            <div className="text-xs text-slate-400 font-mono">
                              Payload Cap: {rocket.payloadCapacityKg.toLocaleString()} kg
                            </div>
                          </div>
                        </div>

                        {!canCarry && (
                          <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1 bg-rose-950/40 px-2 py-1 rounded border border-rose-900/50">
                            <AlertTriangle className="w-3 h-3" /> Under-capacity
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Booster Reusability / Refurbished unit picker */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Booster Core Source
              </label>

              <div className="space-y-2">
                {/* Brand new rocket option */}
                <div
                  onClick={() => setSelectedBoosterId('')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedBoosterId === ''
                      ? 'bg-slate-800 border-cyan-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-white">Manufacture Brand New Core</div>
                    <div className="text-xs text-slate-400 font-mono">Fresh factory build, 100% integrity</div>
                  </div>
                  <div className="text-right font-mono-numbers">
                    <div className="text-sm font-bold text-slate-200">
                      ${currentRocket ? currentRocket.cost.toLocaleString() : 0}
                    </div>
                    <div className="text-[10px] text-slate-500">Standard Cost</div>
                  </div>
                </div>

                {/* Available recovered boosters in hangar */}
                {availableBoosters.length === 0 ? (
                  <div className="p-3 rounded-lg border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
                    No recovered {currentRocket?.name} boosters in stock. Land a booster to unlock 65%+ flight savings!
                  </div>
                ) : (
                  availableBoosters.map(booster => {
                    const isSelected = selectedBoosterId === booster.id;
                    const reuseCost = currentRocket
                      ? Math.round(currentRocket.cost * currentRocket.refurbishCostPercent)
                      : 0;
                    return (
                      <div
                        key={booster.id}
                        onClick={() => setSelectedBoosterId(booster.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-emerald-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="text-sm font-semibold text-white font-mono">
                              Booster #{booster.id} ({booster.flightsCompleted} flights)
                            </div>
                            <div className="text-xs text-emerald-400 font-mono">
                              Refurbished & Flight Ready ({booster.condition}% integrity)
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono-numbers">
                          <div className="text-sm font-bold text-emerald-400">${reuseCost.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-500 font-semibold uppercase">
                            Reuse Discount ({Math.round((1 - (currentRocket?.refurbishCostPercent || 0)) * 100)}% OFF)
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 font-mono text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Launch Expense:</span>
                <span className={`font-bold font-mono-numbers text-base ${canAfford ? 'text-white' : 'text-rose-400'}`}>
                  ${currentCost.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Net Expected Profit:</span>
                <span className="font-bold font-mono-numbers text-emerald-400 text-base">
                  +${(selectedContract.rewardCash - currentCost).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              disabled={!canAfford || !canCarryPayload}
              onClick={handleLaunchClick}
              className={`px-8 py-3.5 rounded-xl font-bold font-mono tracking-wider flex items-center gap-2 shadow-lg transition-all ${
                canAfford && canCarryPayload
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>GO FOR LAUNCH</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
