export type VehicleClassType = 'surface-launcher' | 'orbital-tug' | 'bulk-hauler';

export interface RocketModel {
  id: string;
  name: string;
  sanskritRoot?: string;
  sanskritMeaning?: string;
  role?: string;
  classType: VehicleClassType;
  tagline: string;
  cost: number; // Cr
  payloadCapacityKg: number;
  fuelCapacity: number;
  engineThrust: number;
  dryMass: number;
  unlocked: boolean;
  unlockCost: number; // RP
  reusable: boolean;
  refurbishCostPercent: number;
  requiresKosha?: boolean;
  stages?: number;
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
  unlocksDepotId?: string; // e.g. 'kosha-leo'
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
  isHardLanding?: boolean;
  refurbCostMultiplier?: number; // 0.70 for hard landing
}

export interface MissionStats {
  totalLaunches: number;
  successfulOrbits: number;
  boostersLanded: number;
  manualLandingsCount: number; // 3 manual landings unlock ARIA auto-land
  autoLandingsCount?: number;
  hardLandingsCount?: number;
  totalEarnings: number; // Cr
  totalSavings: number; // Cr
}

export interface ActiveMission {
  contract: Contract;
  bundledContracts?: Contract[]; // ARIA Tier 1 multi-payload bundling
  rocket: RocketModel;
  usedBoosterId?: string;
  phase: 'countdown' | 'ascent' | 'meco' | 'landing' | 'debrief';
  isAutoLand?: boolean;
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

export interface BridgeLoan {
  active: boolean;
  principal: number;
  payoutsRemaining: number;
  withholdingPercent: number;
  actTaken: number;
}

export interface MissionOutcome {
  orbitSuccess: boolean;
  boosterLanded: boolean;
  boosterCondition: number;
  isHardLanding?: boolean;
  isAutoLand?: boolean;
  ascentFailed?: boolean;
  stagesRecovered?: number;
  totalStages?: number;
}
