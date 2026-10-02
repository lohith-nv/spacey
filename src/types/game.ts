export interface RocketModel {
  id: string;
  name: string;
  tagline: string;
  cost: number;
  payloadCapacityKg: number;
  fuelCapacity: number;
  engineThrust: number;
  dryMass: number;
  unlocked: boolean;
  unlockCost: number;
  reusable: boolean;
  refurbishCostPercent: number; // e.g., 0.3 = 30% of cost if reused
  icon: string;
}

export interface Contract {
  id: string;
  title: string;
  client: string;
  description: string;
  rewardCash: number;
  rewardScience: number;
  payloadMassKg: number;
  minRocketTier: string;
  isConstellationMission?: boolean; // Adds a passive satellite
  completed?: boolean;
}

export interface TechUpgrade {
  id: string;
  name: string;
  category: 'propulsion' | 'avionics' | 'recovery' | 'constellation';
  description: string;
  costScience: number;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  effectDescription: string;
  statBonus: number; // multiplier or flat bonus
}

export interface BoosterInventoryItem {
  id: string;
  rocketId: string;
  rocketName: string;
  flightsCompleted: number;
  condition: number; // 0-100%
  refurbished: boolean;
}

export interface MissionStats {
  totalLaunches: number;
  successfulOrbits: number;
  boostersLanded: number;
  totalEarnings: number;
  totalSavings: number;
}

export interface ActiveMission {
  contract: Contract;
  rocket: RocketModel;
  usedBoosterId?: string;
  phase: 'countdown' | 'ascent' | 'meco' | 'landing' | 'debrief';
}
