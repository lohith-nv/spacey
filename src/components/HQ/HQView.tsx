import React, { useState } from 'react';
import type { Contract, RocketModel, BoosterInventoryItem, TechUpgrade, MissionStats } from '../../types/game';
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

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 z-50 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
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
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 font-normal hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'} transition-transform`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.2 rounded-full text-[9px] font-mono font-bold bg-cyan-500 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-mono">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
