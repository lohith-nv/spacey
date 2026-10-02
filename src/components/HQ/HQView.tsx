import React, { useState } from 'react';
import type { Contract, RocketModel, BoosterInventoryItem, TechUpgrade, MissionStats, KoshaDepot } from '../../types/game';
import { OverviewTab } from './OverviewTab';
import { ContractsTab } from './ContractsTab';
import { HangarTab } from './HangarTab';
import { TechTab } from './TechTab';
import { LayoutDashboard, Rocket, Warehouse, Atom } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface HQViewProps {
  cash: number;
  science: number;
  satellites: number;
  passiveRate: number;
  stats: MissionStats;
  contracts: Contract[];
  rockets: RocketModel[];
  hangarBoosters: BoosterInventoryItem[];
  techTree: TechUpgrade[];
  ariaTier?: number;
  koshaDepots?: KoshaDepot[];
  onInitiateLaunch: (
    contract: Contract,
    rocket: RocketModel,
    boosterId?: string,
    bundledContracts?: Contract[],
    isAutoLand?: boolean
  ) => void;
  onUnlockRocket: (rocketId: string) => void;
  onScrapBooster: (boosterId: string) => void;
  onUpgradeTech: (techId: string) => void;
}

export const HQView: React.FC<HQViewProps> = ({
  cash,
  science,
  satellites,
  passiveRate,
  stats,
  contracts,
  rockets,
  hangarBoosters,
  techTree,
  ariaTier = 0,
  koshaDepots = [],
  onInitiateLaunch,
  onUnlockRocket,
  onScrapBooster,
  onUpgradeTech,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'hangar' | 'tech'>('overview');

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'contracts' as const, label: 'Missions', icon: Rocket, badge: contracts.length },
    { id: 'hangar' as const, label: 'Hangar', icon: Warehouse, badge: hangarBoosters.length },
    { id: 'tech' as const, label: 'R&D Lab', icon: Atom },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Desktop Top Segmented Pill Bar */}
      <div className="hidden md:flex items-center gap-2 border-b border-slate-800 pb-3">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                sounds.playBeep(600, 0.04);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Render Active Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            satellites={satellites}
            passiveRate={passiveRate}
            cash={cash}
            science={science}
            contracts={contracts}
            rockets={rockets}
            ariaTier={ariaTier}
            onNavigateToContracts={() => setActiveTab('contracts')}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsTab
            contracts={contracts}
            rockets={rockets}
            hangarBoosters={hangarBoosters}
            cash={cash}
            ariaTier={ariaTier}
            koshaDepots={koshaDepots}
            manualLandingsCount={stats.manualLandingsCount}
            techTree={techTree}
            onInitiateLaunch={onInitiateLaunch}
          />
        )}

        {activeTab === 'hangar' && (
          <HangarTab
            rockets={rockets}
            hangarBoosters={hangarBoosters}
            science={science}
            onUnlockRocket={onUnlockRocket}
            onScrapBooster={onScrapBooster}
          />
        )}

        {activeTab === 'tech' && (
          <TechTab
            techTree={techTree}
            science={science}
            onUpgradeTech={onUpgradeTech}
          />
        )}
      </div>
    </div>
  );
};
