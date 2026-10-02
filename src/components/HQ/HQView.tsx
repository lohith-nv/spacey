import React, { useState } from 'react';
import type { Contract, RocketModel, BoosterInventoryItem, TechUpgrade, MissionStats } from '../../types/game';
import { OverviewTab } from './OverviewTab';
import { ContractsTab } from './ContractsTab';
import { HangarTab } from './HangarTab';
import { TechTab } from './TechTab';
import { LayoutDashboard, FileText, Warehouse, Atom } from 'lucide-react';
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
  onInitiateLaunch: (contract: Contract, rocket: RocketModel, boosterId?: string) => void;
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
  onInitiateLaunch,
  onUnlockRocket,
  onScrapBooster,
  onUpgradeTech,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'hangar' | 'tech'>('overview');

  const navItems = [
    { id: 'overview' as const, label: 'Overview & Constellation', icon: LayoutDashboard },
    { id: 'contracts' as const, label: 'Mission Contracts', icon: FileText, badge: contracts.length },
    { id: 'hangar' as const, label: 'Fleet & Hangar', icon: Warehouse, badge: hangarBoosters.length },
    { id: 'tech' as const, label: 'R&D Laboratory', icon: Atom },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Tab Navigation Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                sounds.playBeep(600, 0.05);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
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

      {/* Render Active Tab */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            satellites={satellites}
            passiveRate={passiveRate}
            cash={cash}
            science={science}
            onNavigateToContracts={() => setActiveTab('contracts')}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsTab
            contracts={contracts}
            rockets={rockets}
            hangarBoosters={hangarBoosters}
            cash={cash}
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
