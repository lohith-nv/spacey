export type VehicleClassType = 'surface-launcher' | 'orbital-tug' | 'bulk-hauler';

export interface RocketModel {
  id: string;
  name: string;
  sanskritRoot?: string;
  sanskritMeaning?: string;
  role?: string;
  classType?: VehicleClassType;
  tagline: string;
  cost: number; // Credits (Cr)
  payloadCapacityKg: number;
  fuelCapacity: number;
  engineThrust: number;
  dryMass: number;
  unlocked: boolean;
  unlockCost: number; // Research (RP)
  reusable: boolean;
  refurbishCostPercent: number; // e.g., 0.3 = 30% of cost if reused
  stages?: number;
  requiresKosha?: boolean;
  icon: string;
}

export interface Contract {
  id: string;
  title: string;
  client: string;
  description: string;
  rewardCash: number; // Credits (Cr)
  rewardScience: number; // Research Points (RP)
  rewardPropellant?: number; // Propellant (Pr)
  payloadMassKg: number;
  minRocketTier: string;
  act?: number; // Act 1 to 5
  isSpotMarket?: boolean; // Repeatable open manifest spot market
  isConstellationMission?: boolean; // Adds a passive StarStream relay node
  completed?: boolean;
}

export interface TechUpgrade {
  id: string;
  name: string;
  category: 'propulsion' | 'avionics' | 'recovery' | 'constellation' | 'depot';
  description: string;
  costScience: number; // RP
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
  totalEarnings: number; // Cr
  totalSavings: number; // Cr
}

export interface ActiveMission {
  contract: Contract;
  rocket: RocketModel;
  usedBoosterId?: string;
  phase: 'countdown' | 'ascent' | 'meco' | 'landing' | 'debrief';
}

export interface AriaTierInfo {
  tier: number; // 0 to 4
  name: string;
  gate: string;
  description: string;
  features: string[];
}

export interface KoshaDepot {
  id: string;
  name: string;
  location: 'LEO' | 'Cislunar' | 'Belt';
  unlocked: boolean;
  propellantCapacityKg: number;
  currentPropellantKg: number;
  iceSupplyEstablished: boolean; // self-sustaining from Moon/Belt ice
  refurbishmentBayOnline: boolean;
}
