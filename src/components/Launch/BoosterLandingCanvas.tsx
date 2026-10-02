import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { RocketModel, TechUpgrade } from '../../types/game';
import { sounds } from '../../utils/audio';
import { ArrowLeft, ArrowRight, Flame, ShieldAlert, Award, RefreshCw } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tech upgrades bonuses
  const legUpgrade = techTree.find(t => t.id === 'tech-landing-legs');
  const maxSafeVy = 4.2 + (legUpgrade ? legUpgrade.level * legUpgrade.statBonus : 0);

  const gridFinUpgrade = techTree.find(t => t.id === 'tech-grid-fins');
  const steeringMultiplier = 1 + (gridFinUpgrade ? gridFinUpgrade.level * gridFinUpgrade.statBonus : 0);

  const rcsUpgrade = techTree.find(t => t.id === 'tech-rcs-thrusters');
  const windResistanceMultiplier = 1 - (rcsUpgrade ? rcsUpgrade.level * rcsUpgrade.statBonus : 0);

  // Game state
  const [fuel, setFuel] = useState(100);
  const [verticalSpeed, setVerticalSpeed] = useState(0);
  const [horizontalSpeed, setHorizontalSpeed] = useState(0);
  const [tiltDeg, setTiltDeg] = useState(0);
  const [altitudeM, setAltitudeM] = useState(900);
  const [gameResult, setGameResult] = useState<'playing' | 'landed' | 'crashed' | 'splashdown'>('playing');

  // Interactive throttle and steering input states
  const keysPressed = useRef<{ left: boolean; right: boolean; thrust: boolean }>({
    left: false,
    right: false,
    thrust: false,
  });

  const boosterState = useRef({
    x: 400,
    y: 60,
    vx: (Math.random() - 0.5) * 1.5,
    vy: 3.5,
    angle: (Math.random() - 0.5) * 0.15,
    angularVelocity: 0,
    fuel: 100,
    legsDeployed: false,
    throttle: 0,
  });

  const particles = useRef<Particle[]>([]);
  const finishedRef = useRef(false);

  // Keyboard handlers
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
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // silent
      }
      setTimeout(() => {
        onLandingComplete(true, condition);
      }, 2500);
    } else {
      sounds.playExplosion();
      setTimeout(() => {
        onLandingComplete(false, 0);
      }, 2500);
    }
  }, [onLandingComplete]);

  // Main Canvas Animation and Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const droneShipX = canvas.width / 2;
    const droneShipWidth = 160;
    const deckY = canvas.height - 40;

    const render = () => {
      const state = boosterState.current;
      const keys = keysPressed.current;

      if (!finishedRef.current) {
        // Apply steering torque
        const torque = 0.0035 * steeringMultiplier;
        if (keys.left) {
          state.angularVelocity -= torque;
        }
        if (keys.right) {
          state.angularVelocity += torque;
        }

        // Aerodynamic self-righting damping
        state.angularVelocity += -state.angle * 0.015;
        state.angularVelocity *= 0.92;
        state.angle += state.angularVelocity;

        // Thrust
        const hasFuel = state.fuel > 0;
        const targetThrottle = keys.thrust && hasFuel ? 1.0 : 0;
        state.throttle += (targetThrottle - state.throttle) * 0.25;

        if (state.throttle > 0.05) {
          sounds.startEngine(state.throttle);
          // Consume fuel
          state.fuel = Math.max(0, state.fuel - 0.22);
          setFuel(Math.round(state.fuel));

          // Calculate thrust vector
          const thrustPower = (0.24 * (rocket.engineThrust / 50)) * state.throttle;
          state.vx += Math.sin(state.angle) * thrustPower;
          state.vy -= Math.cos(state.angle) * thrustPower;

          // Exhaust flame particles
          const exhaustX = state.x - Math.sin(state.angle) * 36;
          const exhaustY = state.y + Math.cos(state.angle) * 36;
          for (let i = 0; i < 3; i++) {
            particles.current.push({
              x: exhaustX + (Math.random() - 0.5) * 4,
              y: exhaustY + (Math.random() - 0.5) * 4,
              vx: -Math.sin(state.angle) * (5 + Math.random() * 4) + (Math.random() - 0.5) * 1.5,
              vy: Math.cos(state.angle) * (5 + Math.random() * 4) + (Math.random() - 0.5) * 1.5,
              life: 1,
              maxLife: 20 + Math.random() * 15,
              size: 5 + Math.random() * 6,
              color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444'
            });
          }
        } else {
          sounds.updateEngineThrottle(0.01);
        }

        // Gravity
        state.vy += 0.085;

        // Atmospheric drag
        state.vx *= 0.985;
        state.vy *= 0.992;

        // Gentle wind shear
        state.vx += ((Math.sin(Date.now() / 2000) * 0.03) * windResistanceMultiplier);

        // Update positions
        state.x += state.vx;
        state.y += state.vy;

        // Deploy legs when altitude is close to deck
        const currentAltitudeM = Math.max(0, Math.round(((deckY - state.y) / (deckY - 60)) * 900));
        setAltitudeM(currentAltitudeM);

        if (currentAltitudeM < 180 && !state.legsDeployed) {
          state.legsDeployed = true;
          sounds.playBeep(700, 0.08);
        }

        // Update telemetry states
        setVerticalSpeed(parseFloat(state.vy.toFixed(1)));
        setHorizontalSpeed(parseFloat(Math.abs(state.vx).toFixed(1)));
        setTiltDeg(parseFloat((Math.abs(state.angle) * (180 / Math.PI)).toFixed(1)));

        // Touchdown detection
        if (state.y >= deckY - 32) {
          const onDroneShip =
            state.x >= droneShipX - droneShipWidth / 2 + 10 &&
            state.x <= droneShipX + droneShipWidth / 2 - 10;

          const safeVertical = state.vy <= maxSafeVy;
          const safeHorizontal = Math.abs(state.vx) <= 2.2;
          const safeTilt = Math.abs(state.angle) * (180 / Math.PI) <= 6.5;

          if (onDroneShip && safeVertical && safeHorizontal && safeTilt) {
            // Perfect landing! Calculate condition based on hardness
            const condition = Math.round(98 - (state.vy / maxSafeVy) * 15);
            triggerOutcome('landed', condition);
          } else if (onDroneShip) {
            // Hit deck too hard or tilted
            triggerOutcome('crashed', 0);
          } else {
            // Missed ship, hit water
            triggerOutcome('splashdown', 0);
          }
        }
      }

      // DRAW CANVAS FRAME
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky gradient (dark space at top to twilight blue at sea)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, deckY);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant Ocean
      const oceanGrad = ctx.createLinearGradient(0, deckY, 0, canvas.height);
      oceanGrad.addColorStop(0, '#0369a1');
      oceanGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, deckY, canvas.width, canvas.height - deckY);

      // Ocean animated waves
      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < canvas.width; i += 24) {
        const waveY = deckY + Math.sin((i + Date.now() / 150) * 0.05) * 3;
        ctx.fillRect(i, waveY, 14, 2);
      }

      // Drone Ship Deck ("Of Course I Still Love You")
      ctx.save();
      const shipY = deckY + Math.sin(Date.now() / 400) * 1.5;
      const shipLeft = droneShipX - droneShipWidth / 2;

      // Drone ship hull
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(shipLeft, shipY - 6, droneShipWidth, 16);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(shipLeft, shipY - 6, droneShipWidth, 16);

      // Yellow caution deck stripes
      ctx.fillStyle = '#eab308';
      ctx.fillRect(shipLeft + 5, shipY - 5, 10, 4);
      ctx.fillRect(shipLeft + droneShipWidth - 15, shipY - 5, 10, 4);

      // Target Circle [ X ]
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(droneShipX, shipY, 24, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing bullseye X
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(droneShipX - 10, shipY - 10);
      ctx.lineTo(droneShipX + 10, shipY + 10);
      ctx.moveTo(droneShipX + 10, shipY - 10);
      ctx.lineTo(droneShipX - 10, shipY + 10);
      ctx.stroke();

      // Drone Ship Name
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OCISLY DRONE SHIP', droneShipX, shipY + 18);
      ctx.restore();

      // Update and Draw Particles (Exhaust & Explosions)
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = 1 - p.life / p.maxLife;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.life / 10), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particles.current.splice(i, 1);
        }
      }

      // Draw Booster Rocket
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.angle);

      // Rocket cylinder body
      const rocketWidth = 14;
      const rocketHeight = 70;

      // Booster body
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-rocketWidth / 2, -rocketHeight / 2, rocketWidth, rocketHeight);

      // Interstage black band at top
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-rocketWidth / 2, -rocketHeight / 2, rocketWidth, 12);

      // Grid Fins (deployed at top)
      ctx.fillStyle = '#334155';
      // Left fin (deflects with key)
      ctx.fillRect(-rocketWidth / 2 - 8, -rocketHeight / 2 + 10, 8, keys.left ? 5 : 3);
      // Right fin
      ctx.fillRect(rocketWidth / 2, -rocketHeight / 2 + 10, 8, keys.right ? 5 : 3);

      // Cold gas RCS puffs
      if (keys.left) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(-rocketWidth / 2 - 9, -rocketHeight / 2 + 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (keys.right) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(rocketWidth / 2 + 9, -rocketHeight / 2 + 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Engine Nozzle
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-rocketWidth / 2 + 2, rocketHeight / 2);
      ctx.lineTo(rocketWidth / 2 - 2, rocketHeight / 2);
      ctx.lineTo(rocketWidth / 2, rocketHeight / 2 + 6);
      ctx.lineTo(-rocketWidth / 2, rocketHeight / 2 + 6);
      ctx.closePath();
      ctx.fill();

      // Landing Legs (deployed when near ground)
      if (state.legsDeployed) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;

        // Left leg
        ctx.beginPath();
        ctx.moveTo(-rocketWidth / 2 + 1, rocketHeight / 2 - 12);
        ctx.lineTo(-rocketWidth / 2 - 14, rocketHeight / 2 + 8);
        ctx.stroke();

        // Right leg
        ctx.beginPath();
        ctx.moveTo(rocketWidth / 2 - 1, rocketHeight / 2 - 12);
        ctx.lineTo(rocketWidth / 2 + 14, rocketHeight / 2 + 8);
        ctx.stroke();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
      sounds.stopEngine();
    };
  }, [rocket, maxSafeVy, steeringMultiplier, windResistanceMultiplier, triggerOutcome]);

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4 md:p-6 shadow-2xl flex flex-col justify-between">
      {/* Top Telemetry Overlay */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Hypersonic Propulsive Landing Telemetry
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            Autonomous Drone Ship Approach (LZ-Ocean)
          </h2>
        </div>

        {/* Telemetry Numbers */}
        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Vertical Velocity */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-center">
            <div className="text-[10px] text-slate-400">DESCENT (Vy)</div>
            <div className={`font-bold font-mono-numbers text-sm ${verticalSpeed > maxSafeVy ? 'text-rose-400' : 'text-emerald-400'}`}>
              {verticalSpeed} m/s
            </div>
          </div>

          {/* Horizontal Velocity */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-center">
            <div className="text-[10px] text-slate-400">DRIFT (Vx)</div>
            <div className={`font-bold font-mono-numbers text-sm ${horizontalSpeed > 2.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {horizontalSpeed} m/s
            </div>
          </div>

          {/* Tilt */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-center">
            <div className="text-[10px] text-slate-400">TILT ANGLE</div>
            <div className={`font-bold font-mono-numbers text-sm ${tiltDeg > 6.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {tiltDeg}°
            </div>
          </div>

          {/* Fuel */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-center min-w-[75px]">
            <div className="text-[10px] text-slate-400">RETRO FUEL</div>
            <div className={`font-bold font-mono-numbers text-sm ${fuel < 15 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
              {fuel}%
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full h-[380px] md:h-[440px] my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={440}
          className="w-full h-full object-contain"
        />

        {/* Altitude Marker on HUD */}
        <div className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-xs text-slate-300 backdrop-blur-sm">
          Radar Altitude: <strong className="text-cyan-300 font-mono-numbers">{altitudeM}m</strong>
        </div>

        {/* Safe thresholds helper pill */}
        <div className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-[11px] text-slate-400 backdrop-blur-sm hidden sm:block">
          Safe Touchdown: Vy &lt; {maxSafeVy.toFixed(1)} m/s | Tilt &lt; 6°
        </div>

        {/* Game Result Banner */}
        {gameResult !== 'playing' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in z-20">
            {gameResult === 'landed' ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
                  THE FALCON HAS LANDED! 🚀
                </h3>
                <p className="text-emerald-300 font-mono text-sm max-w-md mx-auto">
                  Precision touchdown confirmed on the drone ship deck. Booster secured for recovery hangar and reuse!
                </p>
              </div>
            ) : gameResult === 'crashed' ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/50 mx-auto flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
                  RAPID UNSCHEDULED DISASSEMBLY (RUD)
                </h3>
                <p className="text-rose-300 font-mono text-sm max-w-md mx-auto">
                  Hard impact or excessive tilt at deck touchdown. Telemetry recorded for flight analysis (+Science gathered).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 mx-auto flex items-center justify-center text-amber-400">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
                  OCEAN WATER SPLASHDOWN
                </h3>
                <p className="text-amber-300 font-mono text-sm max-w-md mx-auto">
                  Booster missed the autonomous drone ship and splashed into the Atlantic.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons for Mobile & Laptop Mouse */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Flight Controls:</span>
          <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">A / ←</kbd>
          <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">D / →</kbd>
          <span>Steer</span>
          <span className="text-slate-600">|</span>
          <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">W / ↑ / Space</kbd>
          <span>Retro-Burn Engine</span>
        </div>

        {/* Touch/Click Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Steer Left */}
          <button
            onMouseDown={() => (keysPressed.current.left = true)}
            onMouseUp={() => (keysPressed.current.left = false)}
            onTouchStart={() => (keysPressed.current.left = true)}
            onTouchEnd={() => (keysPressed.current.left = false)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 font-mono text-xs cursor-pointer select-none"
          >
            <ArrowLeft className="w-4 h-4" /> Left
          </button>

          {/* Main Throttle Burn */}
          <button
            onMouseDown={() => (keysPressed.current.thrust = true)}
            onMouseUp={() => (keysPressed.current.thrust = false)}
            onTouchStart={() => (keysPressed.current.thrust = true)}
            onTouchEnd={() => (keysPressed.current.thrust = false)}
            className="flex-2 sm:flex-none px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 active:scale-95 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer select-none"
          >
            <Flame className="w-4 h-4" /> RETRO-BURN
          </button>

          {/* Steer Right */}
          <button
            onMouseDown={() => (keysPressed.current.right = true)}
            onMouseUp={() => (keysPressed.current.right = false)}
            onTouchStart={() => (keysPressed.current.right = true)}
            onTouchEnd={() => (keysPressed.current.right = false)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 font-mono text-xs cursor-pointer select-none"
          >
            Right <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
