import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { RocketModel, TechUpgrade } from '../../types/game';
import { sounds } from '../../utils/audio';
import { ArrowLeft, ArrowRight, Flame, ShieldAlert, Award, Waves, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BoosterLandingProps {
  rocket: RocketModel;
  techTree: TechUpgrade[];
  onLandingComplete: (success: boolean, condition: number, isHardLanding?: boolean) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const BoosterLandingCanvas: React.FC<BoosterLandingProps> = ({
  rocket,
  techTree,
  onLandingComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tech upgrades bonuses
  const legUpgrade = techTree.find(t => t.id === 'tech-landing-legs');
  const maxSafeVy = 4.2 + (legUpgrade ? legUpgrade.level * legUpgrade.statBonus : 0);
  const maxHardVy = 7.0;

  const gridFinUpgrade = techTree.find(t => t.id === 'tech-grid-fins');
  const steeringMultiplier = 1 + (gridFinUpgrade ? gridFinUpgrade.level * gridFinUpgrade.statBonus : 0);

  const rcsUpgrade = techTree.find(t => t.id === 'tech-rcs-thrusters');
  const windResistanceMultiplier = 1 - (rcsUpgrade ? rcsUpgrade.level * rcsUpgrade.statBonus : 0);

  // Telemetry HUD state
  const [fuel, setFuel] = useState(100);
  const [verticalSpeed, setVerticalSpeed] = useState(0);
  const [horizontalSpeed, setHorizontalSpeed] = useState(0);
  const [tiltDeg, setTiltDeg] = useState(0);
  const [altitudeM, setAltitudeM] = useState(3000);
  const [gameResult, setGameResult] = useState<'playing' | 'landed' | 'hard' | 'crashed' | 'splashdown'>('playing');

  // Input states
  const keysPressed = useRef<{ left: boolean; right: boolean; thrust: boolean }>({
    left: false,
    right: false,
    thrust: false,
  });

  // Physical simulation state in ref
  const boosterState = useRef({
    x: 300,
    y: 80,
    vx: 0,
    vy: 1.8,
    angle: 0,
    angularVelocity: 0,
    fuel: 100,
    legsDeployed: false,
    legsExtension: 0, // 0 to 1
    throttle: 0,
    gimbalAngle: 0,
    initialized: false,
  });

  const particles = useRef<Particle[]>([]);
  const finishedRef = useRef(false);

  // Haptic feedback helper for mobile
  const triggerHaptic = (ms: number = 30) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // silent
      }
    }
  };

  // Setup keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysPressed.current.left = true;
        sounds.playThrusterPulse();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysPressed.current.right = true;
        sounds.playThrusterPulse();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysPressed.current.thrust = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysPressed.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysPressed.current.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysPressed.current.thrust = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const triggerOutcome = useCallback((outcome: 'landed' | 'hard' | 'crashed' | 'splashdown', condition: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setGameResult(outcome);
    sounds.stopEngine();

    if (outcome === 'landed') {
      sounds.playSuccess();
      triggerHaptic(60);
      try {
        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.65 },
        });
      } catch {
        // silent
      }
      setTimeout(() => {
        onLandingComplete(true, condition, false);
      }, 2500);
    } else if (outcome === 'hard') {
      sounds.playSuccess();
      triggerHaptic(100);
      setTimeout(() => {
        onLandingComplete(true, 25, true);
      }, 2500);
    } else {
      sounds.playExplosion();
      triggerHaptic(150);
      setTimeout(() => {
        onLandingComplete(false, 0, false);
      }, 2500);
    }
  }, [onLandingComplete]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Simulation virtual bounds
    const worldWidth = 600;
    const worldHeight = 900;
    const droneShipX = worldWidth / 2;
    const droneShipWidth = 140;
    const deckY = worldHeight - 55;

    // Initialize randomized initial conditions once
    if (!boosterState.current.initialized) {
      boosterState.current.initialized = true;
      boosterState.current.x = worldWidth / 2 + (Math.random() - 0.5) * 80;
      boosterState.current.y = 80;
      boosterState.current.vx = (Math.random() - 0.5) * 0.8;
      boosterState.current.vy = 1.6;
      boosterState.current.angle = (Math.random() - 0.5) * 0.12;
      boosterState.current.fuel = 100;
      sounds.startEngine(0.01);
    }

    const state = boosterState.current;

    const render = () => {
      // High-DPI canvas sizing
      const displayW = canvas.clientWidth;
      const displayH = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
      }

      // PHYSICS UPDATE IF PLAYING
      if (!finishedRef.current) {
        // Handle RCS Steering Input
        const rcsPower = 0.0035 * steeringMultiplier;
        if (keysPressed.current.left) {
          state.angularVelocity -= rcsPower;
          state.vx -= 0.04;
          // Spawn cold-gas RCS particles from top right
          particles.current.push({
            x: state.x + Math.sin(state.angle) * 35 + 8,
            y: state.y - Math.cos(state.angle) * 35,
            vx: 3 + Math.random() * 2,
            vy: (Math.random() - 0.5) * 1.5,
            life: 0,
            maxLife: 15,
            size: 2,
            color: 'rgba(255, 255, 255, 0.7)',
          });
        }
        if (keysPressed.current.right) {
          state.angularVelocity += rcsPower;
          state.vx += 0.04;
          // Spawn cold-gas RCS particles from top left
          particles.current.push({
            x: state.x - Math.sin(state.angle) * 35 - 8,
            y: state.y - Math.cos(state.angle) * 35,
            vx: -3 - Math.random() * 2,
            vy: (Math.random() - 0.5) * 1.5,
            life: 0,
            maxLife: 15,
            size: 2,
            color: 'rgba(255, 255, 255, 0.7)',
          });
        }

        // Natural aerodynamic damping & stabilizing torque from grid fins
        state.angularVelocity *= 0.94;
        state.angle += state.angularVelocity;
        state.angle *= 0.985; // Aerodynamic self-righting

        // Main Retro Engine Throttle
        const hasFuel = state.fuel > 0;
        if (keysPressed.current.thrust && hasFuel) {
          state.throttle = Math.min(1.0, state.throttle + 0.15);
          state.fuel = Math.max(0, state.fuel - 0.22);
          setFuel(Math.round(state.fuel));
        } else {
          state.throttle = Math.max(0, state.throttle - 0.12);
        }

        // Apply engine thrust vector
        if (state.throttle > 0.01) {
          const thrust = state.throttle * 0.078;
          state.vx += Math.sin(state.angle) * thrust * 0.9;
          state.vy -= Math.cos(state.angle) * thrust;

          sounds.updateEngineThrottle(state.throttle);

          // Spawn retro rocket exhaust particles
          const exhaustCount = Math.round(state.throttle * 4);
          for (let i = 0; i < exhaustCount; i++) {
            const spread = (Math.random() - 0.5) * 0.4;
            const pSpeed = 6 + Math.random() * 8;
            particles.current.push({
              x: state.x - Math.sin(state.angle) * 35,
              y: state.y + Math.cos(state.angle) * 35,
              vx: state.vx - Math.sin(state.angle + spread) * pSpeed * 0.5,
              vy: state.vy + Math.cos(state.angle + spread) * pSpeed,
              life: 0,
              maxLife: 20 + Math.random() * 15,
              size: 4 + Math.random() * 4,
              color:
                Math.random() > 0.4
                  ? 'rgba(251, 146, 60, 0.85)'
                  : Math.random() > 0.2
                  ? 'rgba(254, 215, 170, 0.9)'
                  : 'rgba(239, 68, 68, 0.7)',
            });
          }
        } else {
          sounds.updateEngineThrottle(0.01);
        }

        // Gravity
        state.vy += 0.035;

        // Atmospheric drag (aerodynamic terminal velocity)
        state.vx *= 0.986;
        state.vy *= 0.99;

        // Gentle ocean wind shear
        state.vx += Math.sin(Date.now() / 1800) * 0.032 * windResistanceMultiplier;

        // Integrate positions
        state.x += state.vx;
        state.y += state.vy;

        // Altitude calculation (3000m to 0m)
        const currentAlt = Math.max(0, Math.round(((deckY - state.y) / (deckY - 80)) * 3000));
        setAltitudeM(currentAlt);

        // Deploy legs when close
        if (currentAlt < 140) {
          state.legsDeployed = true;
          state.legsExtension = Math.min(1.0, state.legsExtension + 0.1);
        }

        // Update telemetry states
        setVerticalSpeed(parseFloat(state.vy.toFixed(1)));
        setHorizontalSpeed(parseFloat(Math.abs(state.vx).toFixed(1)));
        setTiltDeg(parseFloat((Math.abs(state.angle) * (180 / Math.PI)).toFixed(1)));

        // Touchdown detection
        if (state.y >= deckY - 32) {
          const onDroneShip =
            state.x >= droneShipX - droneShipWidth / 2 + 8 &&
            state.x <= droneShipX + droneShipWidth / 2 - 8;

          const safeVertical = state.vy <= maxSafeVy;
          const hardLandingVertical = state.vy > maxSafeVy && state.vy <= maxHardVy;
          const safeHorizontal = Math.abs(state.vx) <= 2.2;
          const safeTilt = Math.abs(state.angle) * (180 / Math.PI) <= 6.5;

          if (onDroneShip && safeVertical && safeHorizontal && safeTilt) {
            // Nominal Touchdown success! Calculate integrity
            const condition = Math.round(98 - (state.vy / maxSafeVy) * 14);
            triggerOutcome('landed', condition);
          } else if (onDroneShip && hardLandingVertical && safeHorizontal && safeTilt) {
            // Hard Landing! 4.2 to 7.0 m/s saves the core at 25% condition (70% refurbish cost)
            triggerOutcome('hard', 25);
          } else if (onDroneShip) {
            triggerOutcome('crashed', 0);
          } else {
            triggerOutcome('splashdown', 0);
          }
        }
      }

      // RENDER CANVAS
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displayW, displayH);

      // Coordinate scaling from virtual world to display
      const scaleX = displayW / worldWidth;
      const scaleY = displayH / worldHeight;
      const scale = Math.min(scaleX, scaleY);

      // Dynamic camera zoom as booster nears deck
      const altNorm = Math.max(0, Math.min(1, state.y / deckY));
      const dynamicZoom = 1.0 + altNorm * 0.22; // 1.0x at top, 1.22x near deck

      // Center camera between rocket and deck
      const camTargetX = state.x * 0.5 + droneShipX * 0.5;
      const camTargetY = Math.min(deckY, state.y * 0.6 + deckY * 0.4);

      ctx.save();
      ctx.translate(displayW / 2, displayH / 2);
      ctx.scale(scale * dynamicZoom, scale * dynamicZoom);
      ctx.translate(-camTargetX, -camTargetY);

      // 1. Sky & Ocean Background
      const skyGradient = ctx.createLinearGradient(0, 0, 0, worldHeight);
      skyGradient.addColorStop(0, '#020617'); // Space black/deep navy
      skyGradient.addColorStop(0.65, '#0f172a');
      skyGradient.addColorStop(0.88, '#1e293b');
      skyGradient.addColorStop(0.92, '#0c4a6e'); // Ocean horizon
      skyGradient.addColorStop(1, '#082f49');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(-200, 0, worldWidth + 400, worldHeight);

      // Stars in upper sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let s = 0; s < 30; s++) {
        const starX = (s * 47) % worldWidth;
        const starY = (s * 31) % 400;
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      // Animated ocean waves
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.moveTo(-200, deckY + 8);
      const waveT = Date.now() / 900;
      for (let wx = -200; wx <= worldWidth + 200; wx += 40) {
        ctx.lineTo(wx, deckY + 8 + Math.sin(wx * 0.03 + waveT) * 3);
      }
      ctx.lineTo(worldWidth + 200, worldHeight);
      ctx.lineTo(-200, worldHeight);
      ctx.closePath();
      ctx.fill();

      // 2. Autonomous Spaceport Drone Ship (ASDS) Platform
      const shipLeft = droneShipX - droneShipWidth / 2;
      const shipTop = deckY;
      const shipH = 22;

      // Drone ship barge hull
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(shipLeft, shipTop, droneShipWidth, shipH, [3, 3, 6, 6]);
      ctx.fill();
      ctx.stroke();

      // Yellow chevron warning stripes along deck edge
      ctx.fillStyle = '#eab308';
      for (let sx = shipLeft + 4; sx < shipLeft + droneShipWidth - 8; sx += 16) {
        ctx.fillRect(sx, shipTop, 8, 3);
      }

      // ASDS Deck Landing Bullseye / Logo
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(droneShipX, shipTop + shipH / 2, 24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(droneShipX, shipTop + shipH / 2, 10, 0, Math.PI * 2);
      ctx.stroke();

      // ASDS Crosshairs
      ctx.beginPath();
      ctx.moveTo(droneShipX - 32, shipTop + shipH / 2);
      ctx.lineTo(droneShipX + 32, shipTop + shipH / 2);
      ctx.stroke();

      // 3. Render Particles (Exhaust & RCS)
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Render First-Stage Rocket Booster
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.angle);

      const rocketW = 18;
      const rocketH = 70;

      // Booster Main Body (cylindrical carbon-composite core)
      const boosterGrad = ctx.createLinearGradient(-rocketW / 2, 0, rocketW / 2, 0);
      boosterGrad.addColorStop(0, '#cbd5e1');
      boosterGrad.addColorStop(0.5, '#f8fafc');
      boosterGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = boosterGrad;
      ctx.fillRect(-rocketW / 2, -rocketH / 2, rocketW, rocketH);

      // Interstage black band at top
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-rocketW / 2, -rocketH / 2, rocketW, 14);

      // Falcon / Spacey vertical logo
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.rotate(Math.PI / 2);
      ctx.fillText(rocket.name.toUpperCase(), 0, 3);
      ctx.restore();

      // Grid Fins (deployable at interstage)
      ctx.fillStyle = '#334155';
      ctx.fillRect(-rocketW / 2 - 7, -rocketH / 2 + 10, 7, 3);
      ctx.fillRect(rocketW / 2, -rocketH / 2 + 10, 7, 3);

      // Rocket Engine Bell Nozzle
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-rocketW / 2 + 3, rocketH / 2);
      ctx.lineTo(rocketW / 2 - 3, rocketH / 2);
      ctx.lineTo(rocketW / 2 - 1, rocketH / 2 + 8);
      ctx.lineTo(-rocketW / 2 + 1, rocketH / 2 + 8);
      ctx.closePath();
      ctx.fill();

      // Landing Legs (carbon-fiber A-frames)
      if (state.legsDeployed) {
        const ext = state.legsExtension;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;

        // Left Leg
        ctx.beginPath();
        ctx.moveTo(-rocketW / 2 + 1, rocketH / 2 - 14);
        ctx.lineTo(-rocketW / 2 - 16 * ext, rocketH / 2 + 8 * ext);
        ctx.stroke();

        // Right Leg
        ctx.beginPath();
        ctx.moveTo(rocketW / 2 - 1, rocketH / 2 - 14);
        ctx.lineTo(rocketW / 2 + 16 * ext, rocketH / 2 + 8 * ext);
        ctx.stroke();

        // Hydraulic Struts
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-rocketW / 2, rocketH / 2 - 4);
        ctx.lineTo(-rocketW / 2 - 9 * ext, rocketH / 2 + 2 * ext);
        ctx.moveTo(rocketW / 2, rocketH / 2 - 4);
        ctx.lineTo(rocketW / 2 + 9 * ext, rocketH / 2 + 2 * ext);
        ctx.stroke();
      }

      ctx.restore(); // Restore booster transform
      ctx.restore(); // Restore camera transform
      ctx.restore(); // Restore scale

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
      sounds.stopEngine();
    };
  }, [rocket, maxSafeVy, steeringMultiplier, windResistanceMultiplier, triggerOutcome]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-3 sm:p-5 shadow-2xl flex flex-col justify-between">
      {/* Top HUD Telemetry Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
            LZ-Ocean Drone Ship Approach
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-white truncate">
            Propulsive Booster Recovery
          </h2>
        </div>

        {/* Compact Telemetry Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs shrink-0">
          {/* Vertical Velocity */}
          <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-center">
            <div className="text-[9px] text-slate-400">DESCENT (Vy)</div>
            <div className={`font-bold font-mono-numbers text-xs sm:text-sm ${
              verticalSpeed > maxHardVy
                ? 'text-rose-400 animate-pulse'
                : verticalSpeed > maxSafeVy
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {verticalSpeed} m/s
            </div>
          </div>

          {/* Drift Vx */}
          <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-center">
            <div className="text-[9px] text-slate-400">DRIFT (Vx)</div>
            <div className={`font-bold font-mono-numbers text-xs sm:text-sm ${
              horizontalSpeed > 2.2 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {horizontalSpeed} m/s
            </div>
          </div>

          {/* Tilt */}
          <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-center">
            <div className="text-[9px] text-slate-400">TILT</div>
            <div className={`font-bold font-mono-numbers text-xs sm:text-sm ${
              tiltDeg > 6.5 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {tiltDeg}°
            </div>
          </div>

          {/* Fuel */}
          <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-center min-w-[55px]">
            <div className="text-[9px] text-slate-400">FUEL</div>
            <div className={`font-bold font-mono-numbers text-xs sm:text-sm ${
              fuel < 20 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
            }`}>
              {fuel}%
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] sm:h-[460px] my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center touch-none select-none"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Altitude Digital HUD Badge */}
        <div className="absolute top-3 left-3 bg-slate-950/85 border border-slate-800 px-2.5 py-1 rounded-lg font-mono text-xs text-slate-300 backdrop-blur-md">
          Alt: <strong className="text-cyan-300 font-mono-numbers">{altitudeM}m</strong>
        </div>

        {/* Safe thresholds pill */}
        <div className="absolute top-3 right-3 bg-slate-950/85 border border-slate-800 px-2.5 py-1 rounded-lg font-mono text-[10px] text-slate-400 backdrop-blur-md hidden sm:block">
          Nominal: Vy &lt; {maxSafeVy.toFixed(1)} m/s &bull; Hard: 4.2–7.0 m/s &bull; Tilt &le; 6.5°
        </div>

        {/* Outcome Overlay Banner */}
        {gameResult !== 'playing' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in z-20">
            {gameResult === 'landed' ? (
              <div className="space-y-2.5 max-w-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  TOUCHDOWN CONFIRMED! 🚀
                </h3>
                <p className="text-emerald-300 font-mono text-xs">
                  Precision landing on the drone ship deck. Booster secured for recovery and discounted re-flight!
                </p>
              </div>
            ) : gameResult === 'hard' ? (
              <div className="space-y-2.5 max-w-sm">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/50 mx-auto flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  HARD TOUCHDOWN CONFIRMED! ⚠️
                </h3>
                <p className="text-amber-300 font-mono text-xs">
                  Booster survived hard landing (4.2–7.0 m/s) on deck at 25% integrity. Core salvaged; heavy refurbishment required (70% build cost).
                </p>
              </div>
            ) : gameResult === 'crashed' ? (
              <div className="space-y-2.5 max-w-sm">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 mx-auto flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  HARD IMPACT (RUD)
                </h3>
                <p className="text-rose-300 font-mono text-xs">
                  Booster exceeded structural touchdown velocity (&gt;7.0 m/s) or tilt limit (&gt;6.5°). Telemetry gathered for R&D.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-w-sm">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/50 mx-auto flex items-center justify-center text-amber-400">
                  <Waves className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  OCEAN SPLASHDOWN
                </h3>
                <p className="text-amber-300 font-mono text-xs">
                  Booster drifted outside drone ship bounds into the Atlantic sea.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile-First Touch Controls Dock */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 sm:p-3 rounded-xl flex items-center justify-between gap-2">
        {/* Left Thumb: Directional Steering Buttons */}
        <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
          <button
            onPointerDown={() => {
              keysPressed.current.left = true;
              triggerHaptic(20);
              sounds.playThrusterPulse();
            }}
            onPointerUp={() => (keysPressed.current.left = false)}
            onPointerLeave={() => (keysPressed.current.left = false)}
            className="flex-1 py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:text-white text-slate-200 border border-slate-700 flex items-center justify-center gap-1 font-mono text-xs cursor-pointer select-none transition-all active:scale-95 touch-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[11px] font-bold">LEFT</span>
          </button>

          <button
            onPointerDown={() => {
              keysPressed.current.right = true;
              triggerHaptic(20);
              sounds.playThrusterPulse();
            }}
            onPointerUp={() => (keysPressed.current.right = false)}
            onPointerLeave={() => (keysPressed.current.right = false)}
            className="flex-1 py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:text-white text-slate-200 border border-slate-700 flex items-center justify-center gap-1 font-mono text-xs cursor-pointer select-none transition-all active:scale-95 touch-none"
          >
            <span className="text-[11px] font-bold">RIGHT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center Desktop Keyboard Hint */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-500">
          <span>Keys:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">A / D</kbd>
          <span>Steer</span>
          <span>•</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Space / W</kbd>
          <span>Burn</span>
        </div>

        {/* Right Thumb: Big Primary Retro-Burn Throttle */}
        <div className="flex-1 max-w-[200px]">
          <button
            onPointerDown={() => {
              keysPressed.current.thrust = true;
              triggerHaptic(35);
            }}
            onPointerUp={() => (keysPressed.current.thrust = false)}
            onPointerLeave={() => (keysPressed.current.thrust = false)}
            className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 active:scale-95 text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/25 cursor-pointer select-none transition-all touch-none"
          >
            <Flame className="w-4 h-4" />
            <span>RETRO-BURN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
