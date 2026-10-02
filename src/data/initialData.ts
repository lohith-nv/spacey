import type { RocketModel, Contract, TechUpgrade } from '../types/game';

export const INITIAL_ROCKETS: RocketModel[] = [
  {
    id: 'aether-hopper',
    name: 'Aether Hopper',
    tagline: 'Light sub-orbital & low-orbit test vehicle with spring legs',
    cost: 150000,
    payloadCapacityKg: 800,
    fuelCapacity: 100,
    engineThrust: 45,
    dryMass: 35,
    unlocked: true,
    unlockCost: 0,
    reusable: true,
    refurbishCostPercent: 0.35,
    icon: '🚀'
  },
  {
    id: 'falcon-strike',
    name: 'Falcon Strike-9',
    tagline: 'Two-stage orbital rocket with hypersonic drone-ship recovery',
    cost: 450000,
    payloadCapacityKg: 4500,
    fuelCapacity: 140,
    engineThrust: 65,
    dryMass: 55,
    unlocked: false,
    unlockCost: 50, // science
    reusable: true,
    refurbishCostPercent: 0.28,
    icon: '🛰️'
  },
  {
    id: 'titan-heavy',
    name: 'Titan Heavy V',
    tagline: 'Triple-core heavy-lift platform for massive constellations & deep space',
    cost: 1200000,
    payloadCapacityKg: 15000,
    fuelCapacity: 220,
    engineThrust: 110,
    dryMass: 90,
    unlocked: false,
    unlockCost: 150,
    reusable: true,
    refurbishCostPercent: 0.22,
    icon: '🪐'
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'contract-cubesat-1',
    title: 'StarSync CubeSat Deployment',
    client: 'Orbital IoT Labs',
    description: 'Deploy a cluster of weather monitoring micro-satellites into Low Earth Orbit.',
    rewardCash: 240000,
    rewardScience: 25,
    payloadMassKg: 500,
    minRocketTier: 'aether-hopper',
    isConstellationMission: false
  },
  {
    id: 'contract-starstream-alpha',
    title: 'StarStream Comms Relay Node #1',
    client: 'GlobalNet Telecommunications',
    description: 'Launch an internet satellite into equatorial orbit. Expands your passive constellation revenue stream!',
    rewardCash: 310000,
    rewardScience: 40,
    payloadMassKg: 750,
    minRocketTier: 'aether-hopper',
    isConstellationMission: true
  },
  {
    id: 'contract-sentinel-2',
    title: 'Earth Sentinel Radar Satellite',
    client: 'Planetary Defense Council',
    description: 'Heavy synthetic aperture radar payload for real-time climate telemetry.',
    rewardCash: 620000,
    rewardScience: 65,
    payloadMassKg: 3200,
    minRocketTier: 'falcon-strike',
    isConstellationMission: false
  },
  {
    id: 'contract-starstream-beta',
    title: 'StarStream Comms Relay Node #2',
    client: 'GlobalNet Telecommunications',
    description: 'Second generation broadband node with inter-satellite optical lasers.',
    rewardCash: 680000,
    rewardScience: 75,
    payloadMassKg: 3800,
    minRocketTier: 'falcon-strike',
    isConstellationMission: true
  },
  {
    id: 'contract-space-station-cargo',
    title: 'Astra Station Resupply Logistics',
    client: 'International Space Alliance',
    description: 'Deliver critical propellant, research hardware, and life support modules.',
    rewardCash: 950000,
    rewardScience: 110,
    payloadMassKg: 4400,
    minRocketTier: 'falcon-strike',
    isConstellationMission: false
  },
  {
    id: 'contract-deep-space-probe',
    title: 'Chronos Outer Planets Surveyor',
    client: 'AstroPhysics Institute',
    description: 'Super-heavy autonomous probe equipped with ion thrusters for Jupiter flyby.',
    rewardCash: 1850000,
    rewardScience: 220,
    payloadMassKg: 12000,
    minRocketTier: 'titan-heavy',
    isConstellationMission: true
  }
];

export const INITIAL_TECH: TechUpgrade[] = [
  {
    id: 'tech-grid-fins',
    name: 'Titanium Grid Fins',
    category: 'recovery',
    description: 'Improves aerodynamic pitch and roll control authority during hypersonic descent.',
    costScience: 30,
    level: 0,
    maxLevel: 3,
    unlocked: false,
    effectDescription: '+25% booster steering responsiveness per level',
    statBonus: 0.25
  },
  {
    id: 'tech-landing-legs',
    name: 'Pneumatic Landing Gear Dampers',
    category: 'recovery',
    description: 'Reinforced carbon-composite legs with crushable honeycomb shock absorbers.',
    costScience: 45,
    level: 0,
    maxLevel: 3,
    unlocked: false,
    effectDescription: '+1.5 m/s higher safe touchdown velocity threshold',
    statBonus: 1.5
  },
  {
    id: 'tech-rcs-thrusters',
    name: 'High-Impulse Cold Gas Thrusters',
    category: 'avionics',
    description: 'Nitrogen gas thruster pods along the interstage for rapid attitude correction.',
    costScience: 40,
    level: 0,
    maxLevel: 3,
    unlocked: false,
    effectDescription: 'Reduces wind turbulence drift during final approach',
    statBonus: 0.2
  },
  {
    id: 'tech-refurb-bay',
    name: 'Automated Recovery Bay Robotics',
    category: 'propulsion',
    description: 'X-ray ultrasonic weld scanners & robotic engine flushing rigs in the hangar.',
    costScience: 60,
    level: 0,
    maxLevel: 3,
    unlocked: false,
    effectDescription: '-15% booster refurbishment cost per level',
    statBonus: 0.15
  },
  {
    id: 'tech-satellite-bandwidth',
    name: 'Ka-Band Phased Array Nodes',
    category: 'constellation',
    description: 'Multi-beam phased array antennas for satellites in orbit, multiplying passive revenue.',
    costScience: 50,
    level: 0,
    maxLevel: 4,
    unlocked: false,
    effectDescription: '+$15/sec passive income per orbital satellite',
    statBonus: 15
  }
];
