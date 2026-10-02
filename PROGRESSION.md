# Spacey: Progression (Canon v3)

## Design Pillars

- **Landing is routine, logistics is the game.** ARIA handles recoveries. The challenge is routing, timing, propellant, and fleet scale.
- **The Marga grows with the player.** Each act adds a new vehicle, a new Kosha tier, and a new ARIA capability.
- **Propellant is the real economy.** Early on it is lifted from Earth. By the end, it is mined from ice.
- **Cash Invariant & Forgiving Fail-State.** Start cash always funds at least 3 worst-case flights. Bankruptcy is replaced with structured bridge loans and chapter reorganizations preserving research.

## Resources

| Resource | Use |
|---|---|
| **Credits (Cr)** | Buy vehicles, refurbish, build Koshas |
| **Research (RP)** | Unlock vehicles, ARIA tiers, and upgrades |
| **Propellant (Pr)** | Fuel for tugs, NTR stages, and sales to clients. Stored in Koshas |

## ARIA Tiers

| Tier | Name | Unlocks | Gate |
|---|---|---|---|
| 0 | Recovery | Automated landings and refurbishment tracking | Start |
| 1 | Manifest Planner | Multiple payloads on one flight | Act II |
| 2 | Rendezvous & Docking | Tugs, depot transfers, station berthing | Act III |
| 3 | Fleet Orchestration | Several missions in flight at once | Act IV |
| 4 | Deep-Space Autonomy | Missions beyond cislunar space, run without ground control | Act V |

---

## Fail-State & Insolvency Rules (The 3-Failure Guarantee)

1. **The Invariant:** `start cash ≥ 3 × cheapest launch cost`.
   - Start cash is **400,000 Cr**.
   - Laghu build cost is **120,000 Cr** (36,000 Cr refurbishment at 30%).
   - Three consecutive total-loss failures (ascent breakup, zero bounty, core lost) cost 360,000 Cr, ensuring the player survives all three.
2. **Insolvency Definition:**
   - A player is insolvent only when:
     `cash < cheapest launch cost AND hangar is empty AND passive rate == 0`
   - Temporary zero cash with passive StarStream income or cores in the hangar is *not* insolvent.
3. **One Founders' Bridge Loan Per Act:**
   - On the first insolvency in an act, the International Space Alliance (ISA) provides a non-predatory founders' bridge loan equal to **1.5× the current vehicle cost** (180,000 Cr in Act I; 495,000 Cr in Act II).
   - Repayment: Automatically deducted as a **25% withholding** across the next 3 contract payouts.
4. **Act Restart (No Full Wipe):**
   - If an insolvency occurs after the bridge loan has already been consumed in the same act, the current act restarts with the starting kit (400,000 Cr).
   - **All accumulated RP (science) and tech tree blueprints are permanently kept.**
5. **Hard Landings:**
   - Touchdowns between **4.2 m/s and 7.0 m/s** (with tilt ≤ 6.5°) save the core at **25% structural integrity**.
   - Refurbishment for hard landings is charged at **70% of vehicle build cost** (vs. 30% nominal).
   - Touchdowns > 7.0 m/s or tilt > 6.5° result in RUD (destruction).

---

## ARIA Auto-land (Idler Mode)

- **Unlock Gate:** Requires **3 successful manual landings** (cumulative across contracts).
- **Behavior:** Bypasses the manual landing canvas in favor of an ~8-second scripted telemetry descent sequence with skip support.
- **Success Probability Formula:**
  $$\text{Success Rate } P = \text{clamp}\left(0.50 + 0.15 \times \frac{\text{condition}}{100} + 0.04 \times \text{recovery\_upgrade\_levels} - 0.05 \times \text{acts\_beyond\_Act\_I}, 0.40, 0.95\right)$$
  - *Act I Starter Core (100% cond, 0 upgrades):* 65% success probability.
  - *Act I Fully Upgraded (6 recovery levels):* 89% success probability.
  - Two-stage vehicles (Vahana) roll independently per stage.
- **Risk / Reward Trade-offs:**
  - **Auto-land:** Standard contract RP, costs **10 condition** per flight. If roll fails, core is lost but payload bounty is still paid.
  - **Manual Landing:** Awards **+25% bonus RP**, costs only **5 condition** per flight, and offers player skill agency.

---

## Act I: Laghu Yard

*Learn to launch, land, and reuse. Light cargo, thin margins, one big bet.*

**Start:** Laghu (1,000 kg to LEO) · 400k Cr · 0 RP · ARIA Tier 0

| Contract | Client | Payload | Reward | Notes |
|---|---|---|---|---|
| Sensor Seeding I | Orbital IoT Labs | 300 kg | 180k Cr / 20 RP | Tutorial flight |
| Suborbital Cargo Hop | Open Manifest | 200 kg | 100k Cr / 10 RP | Spot market, market-rate pay, repeatable filler |
| StarStream Relay Node #1 | GlobalNet | 800 kg | 260k Cr / 35 RP | Revenue-share stake: first passive income |

**Upgrades:**
- Lattice Fins I (25 RP, recovery)
- Cold-Gas Settling Thrusters (35 RP, recovery)
- Relay Array Tuning (45 RP, +25 Cr/s passive income per node)
- Recovery Bay Robotics I (40 RP, −15% refurb cost)

**Economy:** Laghu build cost is 120,000 Cr. Nominal refurbishment is 36,000 Cr (30%). Hard landing refurbishment is 84,000 Cr (70%). Spot-market flights keep the lights on and provide steady margins.

**UX & Prep Drawer:** Defaults to the cheapest hangar booster automatically, with side-by-side net profit projection for fresh vs. reused core.

**Milestones:** First landing · First reflight · First passive-income tick · 3 Manual landings (Unlocks ARIA Autoland)

---

## Act II: Vahana Line

*The cash engine arrives. Two stages home, the first depot in orbit.*

**Unlock:** Vahana (70 RP, 330k Cr, ~100k refurb) · 9,000 kg to LEO · both stages return · ARIA Tier 1

| Contract | Client | Payload | Reward | Notes |
|---|---|---|---|---|
| Sensor Seeding II | Orbital IoT Labs | 2,500 kg | 520k Cr / 55 RP | Manifest Planner tutorial |
| StarStream Relay Node #2 | GlobalNet | 4,000 kg | 780k Cr / 80 RP | Second stake, passive income compounds |
| Earth Sentinel Radar | Planetary Defense Council | 5,200 kg | 900k Cr / 95 RP | Heavy radar contract |
| Astra Station Resupply | International Space Alliance | 8,500 kg | 1.4M Cr / 140 RP | Repeating route sustaining fleet cash flow |
| **Kosha-LEO Foundation** | In-house | 9,000 kg propellant | Builds Kosha-LEO | Fuel lifted entirely from Earth |

**Upgrades:** Stage-Return Guidance (60 RP), Recovery Bay Robotics II–III (−15% refurb per level, up to −45%), Cryo-Storage I (Kosha capacity)

**Milestones:** First double-stage recovery · Kosha-LEO online · First passenger flight to Astra Station

---

## Act III: The Marga Opens

*Orbit is routine. Now build the lanes beyond it.*

**Unlock:** Setu tug (130 RP, 900k Cr) · Kosha-Cislunar · ARIA Tier 2

| Contract | Client | Payload | Reward | Notes |
|---|---|---|---|---|
| Cislunar Picket Line | Orbital IoT Labs | 3,000 kg | 1.1M Cr / 120 RP | First Vahana-to-Setu handoff |
| Earth–Moon Relay Chain | GlobalNet | 2 nodes, 3,500 kg each | 1.8M Cr / 160 RP | Cislunar telemetry coverage, more passive income |
| Ring Segment Delivery | International Space Alliance | 11,000 kg (two flights) | 2.3M Cr / 190 RP | Setu tows segments to Astra Station |
| Near-Earth Asteroid Survey | Planetary Defense Council | 2,400 kg | 1.5M Cr / 170 RP | First Setu mission beyond the Moon |
| Prospector Landers | Belt Consortium | 6,000 kg | 1.7M Cr / 180 RP | Opens the ice economy |
| **Kosha-Cislunar Foundation** | In-house | 12,000 kg propellant | Builds Kosha-Cislunar | Still on Earth-lifted fuel |

**Upgrades:** Docking Collars, Efficiency Tuning for Setu, Cryo-Storage II

**Milestones:** First Setu rendezvous · Kosha-Cislunar online · First pilot ice shipment from the Moon (first self-sustaining depot)

---

## Act IV: Airavata and the Long Lanes

*Heavy lift, nuclear transfer, and the first bulk ice.*

**Unlock:** Airavata (320 RP, 2.8M Cr, ~560k refurb) · 40,000 kg to LEO · booster lands · NTR stage fires above LEO (14,000 kg to the Belt) · **requires an online Kosha to refurbish the NTR stage**

**Unlock:** Bharavaha hauler (300 RP, 2.6M Cr) · ARIA Tier 3

| Contract | Client | Payload | Reward | Notes |
|---|---|---|---|---|
| Belt Outpost Foundation | Belt Consortium | 14,000 kg | 4.5M Cr / 260 RP | First Airavata NTR mission |
| Ice Run I | Belt Consortium | 50,000 kg ice | 3.8M Cr / 240 RP | First Bharavaha bulk haul to Kosha-Cislunar |
| Asteroid Redirection | Planetary Defense Council | 12,000 kg | 5.2M Cr / 280 RP | Tests Fleet Orchestration |
| Ring Expansion | International Space Alliance | 3 Vahana flights + Setu tows | 4.0M Cr / 250 RP | Parallel missions |
| Deep Relay Chain | GlobalNet | 3 nodes, 4,000 kg each | 4.8M Cr / 270 RP | Belt-range coverage, big passive income |
| **Kosha-Belt Foundation** | In-house | Setu-hauled | Builds Kosha-Belt | Fueled by Belt ice |

**Upgrades:** NTR Stage Refurbishment, Bulk Ice Handling, Electrolysis Bays (Kosha propellant output)

**Milestones:** First NTR burn · First NTR stage refurbished at a Kosha · First bulk ice haul · **Marga self-sustaining**

---

## Act V: The Jovian Run

*A long lane, no ground control, and a surveyor that has to stay alive.*

**Unlock:** ARIA Tier 4: Deep-Space Autonomy (360 RP)

| Contract | Client | Payload | Reward | Notes |
|---|---|---|---|---|
| Jovian Relay Chain | GlobalNet | 4 nodes, 3,500 kg each | 7.0M Cr / 320 RP | Telemetry backbone for Chronos |
| Outer Lane Staging | In-house | 20,000 kg propellant | Stages Kosha-Belt for long burns | Prepares the Jupiter route |
| **Chronos Surveyor** | AstroPhysics Institute | 10,000 kg | 9.0M Cr / 400 RP | First permanent Jovian orbiter (NTR + ion cruise) |
| **Chronos Resupply Cycle I** | AstroPhysics Institute | 6,000 kg | 5.5M Cr / 300 RP | **Campaign complete** when delivered |

**Milestones:** Chronos injected · First Jovian resupply delivered · Campaign complete

---

## Progression Summary

| Stage | Vehicle gained | Unlock cost | Payload | Key contract | RP gate |
|---|---|---|---|---|---|
| Act I | Laghu | Start (120k Cr) | 1,000 kg | StarStream Node #1 | 0 |
| Act II | Vahana | 70 RP / 330k Cr | 9,000 kg | Astra Resupply | ~70–140 |
| Act III | Setu | 130 RP / 900k Cr | tug | Prospector Landers | ~130–190 |
| Act IV | Airavata, Bharavaha | 320 RP / 2.8M Cr, 300 RP / 2.6M Cr | 40,000 kg | Belt Outpost | ~250–280 |
| Act V | none | 360 RP (ARIA 4) | 10,000 kg | Chronos Surveyor | ~320–400 |

## Core Loops

- **Launch loop:** Fly, recover (manual or ARIA auto-land), refurbish, reflight. Condition drops each flight.
- **Manifest loop:** Bundle payloads onto fewer flights. Open Manifest spot-market jobs fill gaps at market-rate pay.
- **Marga loop:** Earn Cr and RP, build Koshas, shorten lanes, sell propellant.
- **Passive loop:** StarStream revenue-share stakes pay out continuously and cushion failed or marginal missions.
- **Solvency loop:** 3-failure cash buffer, Founders' Bridge Loan safety net, and RP-preserving act restarts.
