import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { RocketModel, TechUpgrade } from '../../types/game';
import { sounds } from '../../utils/audio';
import { ArrowLeft, ArrowRight, Flame, ShieldAlert, Award, Waves } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BoosterLandingProps {
  rocket: RocketModel;
  techTree: TechUpgrade[];
  onLandingComplete: (success: boolean, condition: number) => void;
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
  const [gameResult, setGameResult] = useState<'playing' | 'landed' | 'crashed' | 'splashdown'>('playing');

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

  // Mobile haptics helper
  const triggerHaptic = (ms = 25) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // ignore
    }
  };

  // Keyboard listeners
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

  const triggerOutcome = useCallback((outcome: 'landed' | 'crashed' | 'splashdown', condition: number) => {
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
        onLandingComplete(true, condition);
      }, 2500);
    } else {
      sounds.playExplosion();
      triggerHaptic(150);
      setTimeout(() => {
        onLandingComplete(false, 0);
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
      boosterState.current.x = droneShipX + (Math.random() - 0.5) * 120;
      boosterState.current.vx = (Math.random() - 0.5) * 1.6;
      boosterState.current.angle = (Math.random() - 0.5) * 0.12;
      boosterState.current.initialized = true;
    }

    const render = () => {
      // Responsive DPR handling
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.round(rect.width * dpr);
        const targetH = Math.round(rect.height * dpr);

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = canvas.width / dpr;
      const displayH = canvas.height / dpr;

      const state = boosterState.current;
      const keys = keysPressed.current;

      // PHYSICS UPDATE
      if (!finishedRef.current) {
        // Steering
        const torque = 0.0038 * steeringMultiplier;
        if (keys.left) {
          state.angularVelocity -= torque;
          state.gimbalAngle = Math.min(0.2, state.gimbalAngle + 0.04);
        } else if (keys.right) {
          state.angularVelocity += torque;
          state.gimbalAngle = Math.max(-0.2, state.gimbalAngle - 0.04);
        } else {
          state.gimbalAngle *= 0.85;
        }

        // Aerodynamic self-righting damping
        state.angularVelocity += -state.angle * 0.016;
        state.angularVelocity *= 0.92;
        state.angle += state.angularVelocity;

        // Thrust
        const hasFuel = state.fuel > 0;
        const targetThrottle = keys.thrust && hasFuel ? 1.0 : 0;
        state.throttle += (targetThrottle - state.throttle) * 0.28;

        if (state.throttle > 0.05) {
          sounds.startEngine(state.throttle);
          state.fuel = Math.max(0, state.fuel - 0.23);
          setFuel(Math.round(state.fuel));

          // Thrust vector with engine gimbal
          const effectiveAngle = state.angle + state.gimbalAngle;
          const thrustPower = (0.245 * (rocket.engineThrust / 50)) * state.throttle;
          state.vx += Math.sin(effectiveAngle) * thrustPower;
          state.vy -= Math.cos(effectiveAngle) * thrustPower;

          // Exhaust flame particles
          const exhaustX = state.x - Math.sin(state.angle) * 36;
          const exhaustY = state.y + Math.cos(state.angle) * 36;

          for (let i = 0; i < 3; i++) {
            particles.current.push({
              x: exhaustX + (Math.random() - 0.5) * 5,
              y: exhaustY + (Math.random() - 0.5) * 5,
              vx: -Math.sin(effectiveAngle) * (6 + Math.random() * 5) + (Math.random() - 0.5) * 1.8,
              vy: Math.cos(effectiveAngle) * (6 + Math.random() * 5) + (Math.random() - 0.5) * 1.8,
              life: 1,
              maxLife: 22 + Math.random() * 16,
              size: 5 + Math.random() * 7,
              color: Math.random() > 0.35 ? '#f59e0b' : '#ef4444',
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
          const safeHorizontal = Math.abs(state.vx) <= 2.2;
          const safeTilt = Math.abs(state.angle) * (180 / Math.PI) <= 6.5;

          if (onDroneShip && safeVertical && safeHorizontal && safeTilt) {
            // Touchdown success! Calculate integrity
            const condition = Math.round(98 - (state.vy / maxSafeVy) * 14);
            triggerOutcome('landed', condition);
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
      const camTargetY = state.y * 0.6 + deckY * 0.4;

      ctx.save();
      ctx.translate(displayW / 2, displayH / 2);
      ctx.scale(scale * dynamicZoom, scale * dynamicZoom);
      ctx.translate(-camTargetX, -camTargetY);

      // 1. Sky Gradient (Atmosphere transition)
      const skyGrad = ctx.createLinearGradient(0, -200, 0, deckY);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.4, '#0b1329');
      skyGrad.addColorStop(0.8, '#0f1f3d');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-worldWidth, -300, worldWidth * 3, worldHeight * 2);

      // Distant stars / atmospheric particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 73) % (worldWidth * 2)) - worldWidth / 2;
        const sy = ((i * 47) % 350) - 200;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // 2. Distant Clouds passing upwards (Parallax)
      const cloudOffset = (Date.now() / 40) % 600;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let c = 0; c < 4; c++) {
        const cy = 200 - cloudOffset + c * 180;
        ctx.beginPath();
        ctx.arc(worldWidth / 2 - 120 + c * 90, cy, 65, 0, Math.PI * 2);
        ctx.arc(worldWidth / 2 - 70 + c * 90, cy - 15, 80, 0, Math.PI * 2);
        ctx.arc(worldWidth / 2 - 20 + c * 90, cy, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Ocean Surface & Waves
      const oceanGrad = ctx.createLinearGradient(0, deckY, 0, worldHeight + 200);
      oceanGrad.addColorStop(0, '#0369a1');
      oceanGrad.addColorStop(0.3, '#082f49');
      oceanGrad.addColorStop(1, '#020617');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(-worldWidth, deckY, worldWidth * 3, worldHeight);

      // Dynamic animated wave layers
      const time = Date.now() / 200;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      for (let i = -worldWidth; i < worldWidth * 2; i += 28) {
        const waveY = deckY + Math.sin(i * 0.05 + time) * 3 + 1;
        ctx.fillRect(i, waveY, 16, 2);
      }

      // 4. Drone Ship ("Of Course I Still Love You")
      const shipWaveY = deckY + Math.sin(Date.now() / 450) * 1.8;
      const shipLeft = droneShipX - droneShipWidth / 2;

      // Drone Ship Floodlight Cones
      ctx.save();
      const floodGrad = ctx.createLinearGradient(droneShipX, shipWaveY, droneShipX, shipWaveY - 180);
      floodGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      floodGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = floodGrad;
      ctx.beginPath();
      ctx.moveTo(droneShipX - 45, shipWaveY);
      ctx.lineTo(droneShipX - 110, shipWaveY - 180);
      ctx.lineTo(droneShipX + 110, shipWaveY - 180);
      ctx.lineTo(droneShipX + 45, shipWaveY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Drone Ship Hull
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(shipLeft, shipWaveY - 8, droneShipWidth, 18);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(shipLeft, shipWaveY - 8, droneShipWidth, 18);

      // Yellow Perimeter Warning Stripes
      ctx.fillStyle = '#eab308';
      for (let s = shipLeft + 4; s < shipLeft + droneShipWidth - 8; s += 20) {
        ctx.fillRect(s, shipWaveY - 7, 8, 3);
      }

      // Landing Target Circle [ X ]
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(droneShipX, shipWaveY, 26, 0, Math.PI * 2);
      ctx.stroke();

      // Bullseye Crosshair X
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(droneShipX - 12, shipWaveY - 12);
      ctx.lineTo(droneShipX + 12, shipWaveY + 12);
      ctx.moveTo(droneShipX + 12, shipWaveY - 12);
      ctx.lineTo(droneShipX - 12, shipWaveY + 12);
      ctx.stroke();

      // Drone Ship Title
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OF COURSE I STILL LOVE YOU', droneShipX, shipWaveY + 22);

      // 5. Landing Trajectory Predictor Line
      if (!finishedRef.current) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(state.x, state.y);
        const projectedLandingX = state.x + state.vx * ((deckY - state.y) / Math.max(1, state.vy));
        ctx.lineTo(projectedLandingX, deckY);
        ctx.stroke();

        // Projected Impact Marker
        ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
        ctx.beginPath();
        ctx.arc(projectedLandingX, deckY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Particles (Exhaust, Water Spray, Sparks)
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.life / 12), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particles.current.splice(i, 1);
        }
      }

      // 7. Booster Rocket Rendering
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.angle);

      const rocketW = 14;
      const rocketH = 72;

      // Booster Body (Falcon 9 style white with re-entry soot gradient)
      const bodyGrad = ctx.createLinearGradient(-rocketW / 2, 0, rocketW / 2, 0);
      bodyGrad.addColorStop(0, '#cbd5e1');
      bodyGrad.addColorStop(0.5, '#f8fafc');
      bodyGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(-rocketW / 2, -rocketH / 2, rocketW, rocketH);

      // Re-entry Soot weathering
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.fillRect(-rocketW / 2, 0, rocketW, rocketH / 2);

      // Carbon Interstage at Top
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-rocketW / 2, -rocketH / 2, rocketW, 14);

      // Titanium Grid Fins (Top - Actuate with Steering)
      ctx.fillStyle = '#334155';
      const finTilt = keys.left ? -4 : keys.right ? 4 : 0;
      // Left fin
      ctx.fillRect(-rocketW / 2 - 9, -rocketH / 2 + 10 + finTilt, 9, 4);
      // Right fin
      ctx.fillRect(rocketW / 2, -rocketH / 2 + 10 - finTilt, 9, 4);

      // Cold Gas RCS Thruster Puffs (White nitrogen gas jets)
      if (keys.left) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(-rocketW / 2 - 12, -rocketH / 2 + 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (keys.right) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(rocketW / 2 + 12, -rocketH / 2 + 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center Engine Bell with Gimbal
      ctx.save();
      ctx.translate(0, rocketH / 2);
      ctx.rotate(state.gimbalAngle);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.lineTo(5, 7);
      ctx.lineTo(-5, 7);
      ctx.closePath();
      ctx.fill();

      // Engine Nozzle Glow when firing
      if (state.throttle > 0.05) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 7, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Deployable Carbon Fiber Landing Legs
      if (state.legsDeployed) {
        const ext = state.legsExtension;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3.5;

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
              verticalSpeed > maxSafeVy ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}>
              {verticalSpeed} m/s
            </div>
          </div>

          {/* Drift Vx */}
          <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-center">
            <div className="text-[9px] text-slate-400">DRIFT (Vx)</div>
            <div className={`font-bold font-mono-numbers text-xs sm:text-sm ${
              horizontalSpeed > 2.0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {horizontalSpeed} m/s
            </div>
          </div>

          {/* Tilt */}
          <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-center">
            <div className="text-[9px] text-slate-400">TILT</div>
            <div className={`font-bold font-mono-numbers text-xs sm:text-sm ${
              tiltDeg > 6.0 ? 'text-rose-400' : 'text-emerald-400'
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
          Safe Limit: Vy &lt; {maxSafeVy.toFixed(1)} m/s • Tilt &lt; 6°
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
            ) : gameResult === 'crashed' ? (
              <div className="space-y-2.5 max-w-sm">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 mx-auto flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  HARD IMPACT (RUD)
                </h3>
                <p className="text-rose-300 font-mono text-xs">
                  Booster exceeded structural touchdown velocity or tilt limit. Telemetry gathered for R&D.
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
