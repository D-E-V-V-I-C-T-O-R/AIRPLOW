import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
  Wind,
  Compass,
  AlertTriangle,
  Radio,
  Zap,
  Sliders,
  AudioWaveform,
  Activity,
  Layers,
  TrendingUp,
  Flame,
  ShieldAlert,
  Trash2,
  Download,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { PRESET_SCENARIOS, SoundWavefront, PresetScenario } from '../types/physics';
import { audioSynth, EngineSoundProfile } from '../utils/audioSynth';

export interface MachHistoryPoint {
  timeStr: string;
  timeSec: number;
  mach: number;
  speedKmh: number;
  regime: string;
}

interface AeroSimCanvasProps {
  onSelectTheory?: (topicId: string) => void;
  onAskGemini?: (promptText: string) => void;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
}

export const AeroSimCanvas: React.FC<AeroSimCanvasProps> = ({
  onSelectTheory,
  onAskGemini,
  audioEnabled: externalAudioEnabled,
  onToggleAudio: externalOnToggleAudio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simulation parameters
  const [mach, setMach] = useState<number>(1.4);
  const [temperature, setTemperature] = useState<number>(-25); // typical flight temp in °C
  const [altitude, setAltitude] = useState<number>(8500); // meters
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0); // 0.25x, 0.5x, 1.0x

  // Audio state
  const [localAudioEnabled, setLocalAudioEnabled] = useState<boolean>(false);
  const audioEnabled = externalAudioEnabled !== undefined ? externalAudioEnabled : localAudioEnabled;
  const [audioVolume, setAudioVolume] = useState<number>(0.75);
  const [engineProfile, setEngineProfile] = useState<EngineSoundProfile>('fighter');

  // Visual toggles
  const [showMachCone, setShowMachCone] = useState<boolean>(true);
  const [showDoubleShock, setShowDoubleShock] = useState<boolean>(true);
  const [showVaporCone, setShowVaporCone] = useState<boolean>(true);
  const [showWaveCircles, setShowWaveCircles] = useState<boolean>(true);
  const [showWaveCenters, setShowWaveCenters] = useState<boolean>(false);
  const [showLineOfSight, setShowLineOfSight] = useState<boolean>(true);

  // Observer position
  const [observerXRatio, setObserverXRatio] = useState<number>(0.55);
  const [observerHitNotice, setObserverHitNotice] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('mach-14');

  // Real-time Doppler telemetry
  const [telemetry, setTelemetry] = useState({
    vRelMs: 0,
    vRelKmh: 0,
    freqRatio: 1.0,
    baseFreq: 160,
    perceivedFreq: 160,
    isInsideCone: false,
    distanceMeters: 1000,
    isApproaching: true,
  });

  // Real-time Recharts Mach telemetry history
  const [machHistory, setMachHistory] = useState<MachHistoryPoint[]>([]);
  const [maxRecordedMach, setMaxRecordedMach] = useState<number>(1.4);
  const flightDurationRef = useRef<number>(0);
  const lastChartSampleTimeRef = useRef<number>(0);

  // Animation state references
  const stateRef = useRef({
    planeX: 100,
    planeY: 180,
    wavefronts: [] as SoundWavefront[],
    lastWaveTime: 0,
    waveIdCounter: 0,
    lastFrameTime: performance.now(),
    lastTelemetryUpdate: 0,
    hasShockHitObserver: false,
    soundSpeedPx: 140,
  });

  // Calculate speed of sound from Slide 10 formula: v = 331 + 0.6 * T
  const soundSpeedMs = 331 + 0.6 * temperature;
  const soundSpeedKmh = soundSpeedMs * 3.6;
  const planeSpeedMs = mach * soundSpeedMs;
  const planeSpeedKmh = planeSpeedMs * 3.6;

  // Mach angle: sin(mu) = 1 / Mach
  const machAngleRad = mach >= 1 ? Math.asin(1 / mach) : Math.PI / 2;
  const machAngleDeg = (machAngleRad * 180) / Math.PI;

  // Flight regime
  const flightRegime =
    mach < 0.85
      ? { label: 'Subsônico', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
      : mach <= 1.15
      ? { label: 'Transônico (Barreira do Som)', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' }
      : mach < 5.0
      ? { label: 'Supersônico', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' }
      : { label: 'Hipersônico', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' };

  // Handle Preset Selection
  const applyPreset = (preset: PresetScenario) => {
    setSelectedPresetId(preset.id);
    setMach(preset.mach);
    setTemperature(preset.temperature);
  };

  // Throttle adjustments (+/- Mach step)
  const adjustMach = (delta: number) => {
    setMach((prev) => {
      const next = Math.max(0.0, Math.min(3.5, parseFloat((prev + delta).toFixed(2))));
      if (next > maxRecordedMach) setMaxRecordedMach(next);
      return next;
    });
    setSelectedPresetId('');
  };

  // Toggle Audio
  const toggleAudio = () => {
    if (externalOnToggleAudio) {
      externalOnToggleAudio();
    } else {
      const next = !localAudioEnabled;
      setLocalAudioEnabled(next);
      audioSynth.setMuted(!next);
    }
    audioSynth.initContext();
  };

  // Change Volume
  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    audioSynth.setVolume(vol);
  };

  // Change Engine Sound Profile
  const handleProfileChange = (profile: EngineSoundProfile) => {
    setEngineProfile(profile);
    audioSynth.setEngineProfile(profile);
  };

  // Reset plane position & waves & history
  const handleReset = () => {
    const s = stateRef.current;
    s.planeX = -50;
    s.wavefronts = [];
    s.hasShockHitObserver = false;
    setObserverHitNotice(null);
  };

  const handleClearHistory = () => {
    flightDurationRef.current = 0;
    setMachHistory([]);
    setMaxRecordedMach(mach);
  };

  const [exportedNotice, setExportedNotice] = useState<boolean>(false);

  // Export Recharts captured telemetry data to CSV for physics analysis
  const handleExportCSV = () => {
    if (machHistory.length === 0) return;

    const headers = [
      'Tempo de Voo (s)',
      'Numero Mach (M)',
      'Velocidade (km/h)',
      'Velocidade (m/s)',
      'Regime Aerodinamico',
      'Angulo Cone de Mach (graus)',
      'Velocidade do Som v(T) (m/s)',
      'Temperatura Atmosferica (C)',
    ];

    const rows = machHistory.map((pt) => {
      const ptSpeedMs = (pt.speedKmh / 3.6).toFixed(1);
      const coneAngle = pt.mach >= 1.0 ? ((Math.asin(1 / pt.mach) * 180) / Math.PI).toFixed(2) : 'N/A';
      return [
        pt.timeSec.toFixed(2),
        pt.mach.toFixed(2),
        pt.speedKmh,
        ptSpeedMs,
        `"${pt.regime}"`,
        coneAngle,
        soundSpeedMs.toFixed(1),
        temperature,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.setAttribute('download', `telemetria_voo_mach_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedNotice(true);
    setTimeout(() => setExportedNotice(false), 3000);
  };

  // Trigger manual sonic boom test
  const handleTestBoom = () => {
    audioSynth.initContext();
    audioSynth.triggerDoubleSonicBoom(1.0);
    setObserverHitNotice('💥 DUPLO ESTRONDO DISPARADO (Choque de Proa + Choque de Cauda)!');
    setTimeout(() => setObserverHitNotice(null), 2500);
  };

  // Simulation Render Loop
  useEffect(() => {
    let animId: number;

    const render = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = stateRef.current;
      const dt = Math.min((now - s.lastFrameTime) / 1000, 0.1);
      s.lastFrameTime = now;

      const width = canvas.width;
      const height = canvas.height;
      const groundY = height - 90;
      s.planeY = height * 0.38;

      // Simulated sound speed in canvas pixels per second
      const baseSoundSpeedPx = 170;
      const tempFactor = soundSpeedMs / 343;
      const soundSpeedPx = baseSoundSpeedPx * tempFactor;
      s.soundSpeedPx = soundSpeedPx;

      // Plane speed in pixels per second
      const planeSpeedPx = soundSpeedPx * mach;

      // Update simulation if playing
      if (isPlaying) {
        s.planeX += planeSpeedPx * dt * simSpeed;
        flightDurationRef.current += dt * simSpeed;

        // Loop plane back when exiting right margin
        if (s.planeX > width + 280) {
          s.planeX = -120;
          s.wavefronts = [];
          s.hasShockHitObserver = false;
          setObserverHitNotice(null);
        }

        // Emit new acoustic wavefront periodically
        const waveInterval = 0.16 / simSpeed;
        if (now - s.lastWaveTime > waveInterval * 1000) {
          s.wavefronts.push({
            id: s.waveIdCounter++,
            originX: s.planeX,
            originY: s.planeY,
            radius: 4,
            timestamp: now,
            opacity: 1.0,
          });
          s.lastWaveTime = now;
        }

        // Expand existing wavefronts at the speed of sound
        for (let i = s.wavefronts.length - 1; i >= 0; i--) {
          const w = s.wavefronts[i];
          w.radius += soundSpeedPx * dt * simSpeed;
          w.opacity = Math.max(0, 1 - w.radius / (width * 1.15));

          if (w.radius > width * 1.2 || w.opacity <= 0.01) {
            s.wavefronts.splice(i, 1);
          }
        }

        // Record real-time Mach vs Time history for Recharts (~every 250ms)
        if (now - lastChartSampleTimeRef.current >= 240) {
          lastChartSampleTimeRef.current = now;
          const currentFlightSec = flightDurationRef.current;
          const currentPoint: MachHistoryPoint = {
            timeStr: `${currentFlightSec.toFixed(1)}s`,
            timeSec: parseFloat(currentFlightSec.toFixed(1)),
            mach: parseFloat(mach.toFixed(2)),
            speedKmh: Math.round(planeSpeedKmh),
            regime: mach < 0.85 ? 'Subsônico' : mach <= 1.15 ? 'Transônico' : 'Supersônico',
          };

          setMachHistory((prev) => {
            const updated = [...prev, currentPoint];
            return updated.length > 40 ? updated.slice(updated.length - 40) : updated;
          });

          if (mach > maxRecordedMach) {
            setMaxRecordedMach(mach);
          }
        }
      }

      // Observer coordinates
      const observerX = width * observerXRatio;
      const observerY = groundY;
      const dx = observerX - s.planeX;
      const dy = observerY - s.planeY;
      const distancePx = Math.hypot(dx, dy);
      const distanceMeters = distancePx * 10;

      // Relative velocity along line of sight
      const theta = Math.atan2(dy, dx);
      const cosTheta = Math.cos(theta);
      const vRelMs = planeSpeedMs * cosTheta;
      const vRelKmh = vRelMs * 3.6;

      // Doppler frequency ratio: f' = f0 * (c / (c - v_rel))
      const effectiveDenominator = Math.max(soundSpeedMs * 0.035, soundSpeedMs - vRelMs);
      const freqRatio = Math.max(0.25, Math.min(18.0, soundSpeedMs / effectiveDenominator));

      // Check if observer is inside the Mach cone
      let isInsideCone = false;
      if (mach >= 1.0) {
        if (observerX <= s.planeX) {
          const distanceBehindApex = s.planeX - observerX;
          const coneRadiusAtObserverX = distanceBehindApex / Math.tan(machAngleRad);
          const observerVerticalDistance = Math.abs(observerY - s.planeY);
          if (observerVerticalDistance <= coneRadiusAtObserverX) {
            isInsideCone = true;
          }
        }
      } else {
        isInsideCone = true;
      }

      // Shock wave arrival detection
      if (mach >= 1.0 && isPlaying) {
        const distanceBehind = s.planeX - observerX;
        if (distanceBehind >= 0) {
          const coneHalfWidthAtObserver = distanceBehind / Math.tan(machAngleRad);
          const verticalDist = Math.abs(observerY - s.planeY);
          const shockDist = Math.abs(verticalDist - coneHalfWidthAtObserver);

          if (shockDist < 18 && !s.hasShockHitObserver) {
            s.hasShockHitObserver = true;
            setObserverHitNotice('💥 DUPLO ESTRONDO SÔNICO DETECTADO NO SOLO!');
            if (audioEnabled) {
              audioSynth.triggerDoubleSonicBoom(1.0);
            }
            setTimeout(() => {
              setObserverHitNotice((prev) => (prev ? 'Zona de Som (Dentro do Cone de Mach)' : null));
            }, 1800);
          }
        }
      }

      // Dynamic Audio Synth integration
      audioSynth.updateFromRelativeVelocity(
        vRelMs,
        soundSpeedMs,
        distanceMeters,
        mach >= 1.0,
        isInsideCone,
        isPlaying && audioEnabled
      );

      // Throttle telemetry update to React state
      if (now - s.lastTelemetryUpdate > 55) {
        s.lastTelemetryUpdate = now;
        const synthTel = audioSynth.getTelemetry();
        setTelemetry({
          vRelMs,
          vRelKmh,
          freqRatio,
          baseFreq: synthTel.baseFreq,
          perceivedFreq: synthTel.shiftedFreq,
          isInsideCone,
          distanceMeters,
          isApproaching: vRelMs > 0,
        });
      }

      // ================= CLEAR & DRAW CANVAS =================
      ctx.clearRect(0, 0, width, height);

      // 1. Atmosphere Gradient Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#060d1a');
      skyGrad.addColorStop(0.5, '#0b192e');
      skyGrad.addColorStop(1, '#0e2442');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, groundY);

      // Altitude lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = 40; y < groundY; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Mach Cone Interior & Exterior Shading (Supersonic)
      if (mach >= 1.0 && showMachCone) {
        const coneApexX = s.planeX;
        const coneApexY = s.planeY;
        const coneLength = width * 1.5;

        const topEndX = coneApexX - coneLength * Math.cos(machAngleRad);
        const topEndY = coneApexY - coneLength * Math.sin(machAngleRad);
        const btmEndX = coneApexX - coneLength * Math.cos(machAngleRad);
        const btmEndY = coneApexY + coneLength * Math.sin(machAngleRad);

        // Zone of Silence
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.beginPath();
        ctx.rect(coneApexX, 0, width - coneApexX, groundY);
        ctx.fill();

        // Zone of Action (Inside Mach Cone)
        const coneWash = ctx.createLinearGradient(coneApexX, coneApexY, coneApexX - 400, coneApexY);
        coneWash.addColorStop(0, 'rgba(6, 182, 212, 0.16)');
        coneWash.addColorStop(0.5, 'rgba(6, 182, 212, 0.06)');
        coneWash.addColorStop(1, 'rgba(6, 182, 212, 0.01)');

        ctx.fillStyle = coneWash;
        ctx.beginPath();
        ctx.moveTo(coneApexX, coneApexY);
        ctx.lineTo(topEndX, topEndY);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, groundY);
        ctx.lineTo(btmEndX, btmEndY);
        ctx.closePath();
        ctx.fill();

        // Mach Cone Primary Envelope (Bow Shock)
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(topEndX, topEndY);
        ctx.lineTo(coneApexX, coneApexY);
        ctx.lineTo(btmEndX, btmEndY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Mach Angle (μ) arc
        const arcRadius = 48;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(coneApexX, coneApexY, arcRadius, Math.PI, Math.PI + machAngleRad, false);
        ctx.stroke();

        ctx.fillStyle = '#22d3ee';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(
          `μ = ${machAngleDeg.toFixed(1)}°`,
          coneApexX - arcRadius - 46,
          coneApexY - 14
        );

        // Secondary Shock Wave: Tail Shock (Double Sonic Boom from Slide 15)
        if (showDoubleShock) {
          const tailOffset = 38;
          const tailApexX = s.planeX - tailOffset;
          const tailApexY = s.planeY;

          const tailTopX = tailApexX - coneLength * Math.cos(machAngleRad);
          const tailTopY = tailApexY - coneLength * Math.sin(machAngleRad);
          const tailBtmX = tailApexX - coneLength * Math.cos(machAngleRad);
          const tailBtmY = tailApexY + coneLength * Math.sin(machAngleRad);

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(tailTopX, tailTopY);
          ctx.lineTo(tailApexX, tailApexY);
          ctx.lineTo(tailBtmX, tailBtmY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 3. Draw Acoustic Wavefronts (Sound Waves)
      if (showWaveCircles) {
        for (const w of s.wavefronts) {
          ctx.beginPath();
          ctx.arc(w.originX, w.originY, w.radius, 0, Math.PI * 2);

          let strokeColor = 'rgba(56, 189, 248, ';
          if (mach === 1.0) {
            strokeColor = 'rgba(251, 191, 36, ';
          } else if (mach > 1.0) {
            strokeColor = 'rgba(147, 197, 253, ';
          }

          ctx.strokeStyle = `${strokeColor}${w.opacity * 0.75})`;
          ctx.lineWidth = mach === 1.0 && Math.abs(w.originX + w.radius - s.planeX) < 15 ? 2.5 : 1.2;
          ctx.stroke();

          if (showWaveCenters) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(w.originX - 1.5, w.originY - 1.5, 3, 3);
          }
        }
      }

      // 4. Line of Sight & Relative Velocity Vector (Doppler Ray)
      if (showLineOfSight) {
        ctx.save();
        ctx.setLineDash([4, 4]);

        let rayColor = '#38bdf8';
        let rayStatus = 'f\' ≈ f₀ (Ponto Mais Próximo)';
        if (vRelMs > 12) {
          rayColor = '#34d399';
          rayStatus = `v_rel = +${vRelMs.toFixed(0)} m/s (Aproximação · Tom Agudo)`;
        } else if (vRelMs < -12) {
          rayColor = '#f43f5e';
          rayStatus = `v_rel = ${vRelMs.toFixed(0)} m/s (Afastamento · Tom Grave)`;
        }

        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(s.planeX, s.planeY);
        ctx.lineTo(observerX, observerY);
        ctx.stroke();
        ctx.setLineDash([]);

        const midX = (s.planeX + observerX) / 2;
        const midY = (s.planeY + observerY) / 2;

        ctx.font = '10px "JetBrains Mono", monospace';
        const tagText = `${rayStatus} · d=${(distanceMeters / 1000).toFixed(1)}km`;
        const textWidth = ctx.measureText(tagText).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 1;
        ctx.fillRect(midX - textWidth / 2 - 8, midY - 11, textWidth + 16, 22);
        ctx.strokeRect(midX - textWidth / 2 - 8, midY - 11, textWidth + 16, 22);

        ctx.fillStyle = rayColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, midX, midY);

        ctx.restore();
      }

      // 5. Prandtl-Glauert Condensation Cloud (Slide 16)
      if (showVaporCone && mach >= 0.92 && mach <= 1.55) {
        const vaporGrad = ctx.createRadialGradient(
          s.planeX - 22,
          s.planeY,
          4,
          s.planeX - 22,
          s.planeY,
          34
        );
        vaporGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        vaporGrad.addColorStop(0.35, 'rgba(240, 249, 255, 0.65)');
        vaporGrad.addColorStop(0.7, 'rgba(224, 242, 254, 0.25)');
        vaporGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.save();
        ctx.translate(s.planeX - 16, s.planeY);
        ctx.scale(1.1, 1.8);
        ctx.fillStyle = vaporGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Draw Aircraft Silhouette
      ctx.save();
      ctx.translate(s.planeX, s.planeY);

      if (isPlaying) {
        const flameLength = 18 + Math.sin(now * 0.05) * 6 + mach * 10;
        const flameGrad = ctx.createLinearGradient(0, 0, -flameLength, 0);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.25, '#38bdf8');
        flameGrad.addColorStop(0.65, '#f97316');
        flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-36, -3);
        ctx.lineTo(-36 - flameLength, 0);
        ctx.lineTo(-36, 3);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(4, -3);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-12, -4);
      ctx.lineTo(-24, -22);
      ctx.lineTo(-26, -20);
      ctx.lineTo(-24, -4);
      ctx.lineTo(-32, -12);
      ctx.lineTo(-35, -12);
      ctx.lineTo(-36, -3);
      ctx.lineTo(-36, 3);
      ctx.lineTo(-35, 12);
      ctx.lineTo(-32, 12);
      ctx.lineTo(-24, 4);
      ctx.lineTo(-26, 20);
      ctx.lineTo(-24, 22);
      ctx.lineTo(-12, 4);
      ctx.lineTo(-4, 5);
      ctx.lineTo(4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(-2, 0, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 7. Ground Terrain
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#0f172a');
      groundGrad.addColorStop(0.3, '#1e293b');
      groundGrad.addColorStop(1, '#020617');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let x = 60; x < width; x += 120) {
        ctx.fillRect(x, groundY, 1, 6);
        ctx.fillText(`${((x / width) * 20).toFixed(0)} km`, x - 12, groundY + 18);
      }

      // 8. Ground Observer
      ctx.save();
      ctx.translate(observerX, observerY);

      if (isInsideCone) {
        ctx.strokeStyle = mach >= 1.0 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1.5;
        const pulseR = 12 + ((now * 0.02) % 18);
        ctx.beginPath();
        ctx.arc(0, -22, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -22);
      ctx.stroke();

      ctx.fillStyle = isInsideCone ? '#06b6d4' : '#64748b';
      ctx.beginPath();
      ctx.arc(0, -22, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isInsideCone ? '#38bdf8' : '#94a3b8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(-8, -22, 7, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Observador no Solo', 0, 20);

      ctx.font = '10px "JetBrains Mono", monospace';
      if (mach >= 1.0) {
        if (!isInsideCone) {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('Zona de Silêncio (Pré-Choque)', 0, 34);
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('Som Ouvido (Pós-Choque)', 0, 34);
        }
      } else {
        ctx.fillStyle = vRelMs > 0 ? '#34d399' : '#f43f5e';
        const dopplerText = vRelMs > 0 ? `Aproximação (${freqRatio.toFixed(2)}x)` : `Afastamento (${freqRatio.toFixed(2)}x)`;
        ctx.fillText(`Doppler: ${dopplerText}`, 0, 34);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    mach,
    temperature,
    isPlaying,
    simSpeed,
    showMachCone,
    showDoubleShock,
    showVaporCone,
    showWaveCircles,
    showWaveCenters,
    showLineOfSight,
    observerXRatio,
    audioEnabled,
    soundSpeedMs,
    planeSpeedMs,
    planeSpeedKmh,
    machAngleDeg,
    machAngleRad,
    maxRecordedMach,
  ]);

  // Canvas click to move observer
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0.08, Math.min(0.92, clickX / rect.width));
    setObserverXRatio(ratio);
    stateRef.current.hasShockHitObserver = false;
    setObserverHitNotice(null);
  };

  // Custom Recharts Tooltip
  const CustomMachTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: MachHistoryPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono backdrop-blur-md">
          <div className="text-slate-400 border-b border-slate-800 pb-1 mb-1.5 flex justify-between gap-4">
            <span>Tempo de Voo:</span>
            <span className="text-white font-bold">{data.timeStr}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-cyan-400">Número Mach:</span>
            <span className="text-cyan-300 font-bold">M {data.mach.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 mt-0.5">
            <span className="text-slate-400">Velocidade:</span>
            <span className="text-slate-200">{data.speedKmh} km/h</span>
          </div>
          <div className="flex items-center justify-between gap-4 mt-0.5">
            <span className="text-slate-400">Regime:</span>
            <span className={data.mach >= 1.0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {data.regime}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner & Scenario Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-200 uppercase tracking-wider">Cenários dos Slides:</span>
          <span>F 105 Física da Fala e Audição</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedPresetId === preset.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Viewport Container */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* HUD Telemetry Overlay */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between pointer-events-none gap-2 z-10">
          {/* Flight Data Card */}
          <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-xl pointer-events-auto">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Número Mach</div>
              <div className="text-xl font-bold font-mono text-cyan-400">M {mach.toFixed(2)}</div>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Velocidade Aeronave</div>
              <div className="text-sm font-semibold font-mono text-slate-100">
                {planeSpeedMs.toFixed(0)} m/s <span className="text-xs text-slate-400 font-normal">({planeSpeedKmh.toFixed(0)} km/h)</span>
              </div>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Velocidade Som v(T)</div>
              <div className="text-sm font-semibold font-mono text-slate-300">
                {soundSpeedMs.toFixed(1)} m/s <span className="text-xs text-slate-500 font-normal">({soundSpeedKmh.toFixed(0)} km/h)</span>
              </div>
            </div>
            {mach >= 1.0 && (
              <>
                <div className="h-7 w-px bg-slate-800" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Ângulo Cone (μ)</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">{machAngleDeg.toFixed(1)}°</div>
                </div>
              </>
            )}
          </div>

          {/* Regime Badge & Audio Trigger */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${flightRegime.bg} ${flightRegime.color}`}>
              {flightRegime.label}
            </span>

            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                audioEnabled
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Ativar/Desativar áudio do motor e Doppler em tempo real"
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-slate-950" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{audioEnabled ? 'Áudio do Motor Ativo' : 'Ativar Áudio'}</span>
            </button>
          </div>
        </div>

        {/* Shock Notice Toast when Observer is hit */}
        {observerHitNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-rose-950/50 flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{observerHitNotice}</span>
          </div>
        )}

        {/* Canvas Element */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={460}
          onClick={handleCanvasClick}
          className="w-full h-auto cursor-crosshair block"
          style={{ maxHeight: '520px' }}
        />

        {/* Bottom Interactive Controls HUD */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800/80 flex flex-col gap-4">
          {/* Main Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Mach Number Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Número Mach (M)
                </span>
                <span className="font-mono font-bold text-cyan-400">{mach.toFixed(2)} M</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.2"
                step="0.05"
                value={mach}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMach(val);
                  if (val > maxRecordedMach) setMaxRecordedMach(val);
                  setSelectedPresetId('');
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0 (Parado)</span>
                <span>0.7 (Boeing)</span>
                <span>1.0 (Som)</span>
                <span>2.0 (Concorde)</span>
                <span>3.0+</span>
              </div>
            </div>

            {/* Atmospheric Temperature Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-amber-400" />
                  Temperatura do Ar (T)
                </span>
                <span className="font-mono text-amber-400 font-semibold">{temperature > 0 ? `+${temperature}` : temperature}°C</span>
              </div>
              <input
                type="range"
                min="-60"
                max="45"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-60°C (11km)</span>
                <span>0°C</span>
                <span>+20°C (Ambiente)</span>
                <span>+45°C</span>
              </div>
            </div>

            {/* Playback & Speed Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md shadow-cyan-500/20"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pausar' : 'Voar'}</span>
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                  title="Reiniciar posição do avião"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Multiplier Segmented Tabs */}
              <div className="flex items-center p-1 bg-slate-800/80 rounded-lg">
                {[0.25, 0.5, 1.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors ${
                      simSpeed === s ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Toggles & Educational Checkboxes */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={showLineOfSight}
                  onChange={(e) => setShowLineOfSight(e.target.checked)}
                  className="accent-cyan-400 rounded"
                />
                <span className="font-semibold text-slate-300">Vetor de Velocidade Relativa (Doppler Ray)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={showMachCone}
                  onChange={(e) => setShowMachCone(e.target.checked)}
                  className="accent-cyan-400 rounded"
                />
                <span>Cone de Mach</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={showDoubleShock}
                  onChange={(e) => setShowDoubleShock(e.target.checked)}
                  className="accent-rose-400 rounded"
                />
                <span>Duplo Choque (Proa/Cauda)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={showVaporCone}
                  onChange={(e) => setShowVaporCone(e.target.checked)}
                  className="accent-sky-400 rounded"
                />
                <span>Nuvem de Condensação</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={showWaveCircles}
                  onChange={(e) => setShowWaveCircles(e.target.checked)}
                  className="accent-blue-400 rounded"
                />
                <span>Frentes de Onda</span>
              </label>
            </div>

            <div className="text-[11px] text-slate-400">
              💡 <span className="text-slate-300">Clique na pista para reposicionar o observador no solo.</span>
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME RECHARTS GRAPH: Mach (M) vs. Tempo de Voo */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Telemetria em Tempo Real: Número Mach (M) vs. Tempo</span>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded">
                  Recharts Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Monitoramento contínuo da velocidade adimensional <code className="text-cyan-300 font-mono">M = v_avião / v_som</code> ao longo do voo
              </p>
            </div>
          </div>

          {/* Quick Throttle & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <span className="text-[10px] text-slate-500 font-mono px-2 uppercase">Manete:</span>
              <button
                onClick={() => adjustMach(-0.2)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors font-mono font-bold"
                title="Reduzir velocidade (-0.2 Mach)"
              >
                -0.2 M
              </button>
              <button
                onClick={() => setMach(1.0)}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors font-mono font-bold border border-amber-500/40"
                title="Ajustar exatamente para Mach 1.0 (Barreira do Som)"
              >
                1.0 M (Som)
              </button>
              <button
                onClick={() => adjustMach(+0.2)}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors font-mono font-bold shadow-sm"
                title="Pós-combustão (+0.2 Mach)"
              >
                <Flame className="w-3 h-3" />
                <span>+0.2 M</span>
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={machHistory.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                machHistory.length > 0
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 shadow-sm cursor-pointer'
                  : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title={
                machHistory.length > 0
                  ? 'Exportar dados de telemetria do voo (tempo vs. Mach) em formato CSV'
                  : 'Aguarde o avião voar para coletar dados antes de exportar'
              }
            >
              {exportedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">CSV Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exportar CSV</span>
                </>
              )}
            </button>

            <button
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
              title="Limpar gráfico e reiniciar contagem de tempo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Mach Instantâneo</span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              M {mach.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400">
              {planeSpeedKmh.toFixed(0)} km/h ({planeSpeedMs.toFixed(0)} m/s)
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Mach Máximo do Voo</span>
            <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
              M {maxRecordedMach.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400">
              {(maxRecordedMach * soundSpeedKmh).toFixed(0)} km/h pico
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Tempo Decorrido</span>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
              {flightDurationRef.current.toFixed(1)} s
            </div>
            <span className="text-[11px] text-slate-400">
              {machHistory.length} amostras coletadas
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Regime Aerodinâmico</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${flightRegime.color}`}>
              {flightRegime.label}
            </div>
            <span className="text-[11px] text-slate-400">
              {mach >= 1.0 ? `Cone μ = ${machAngleDeg.toFixed(1)}°` : 'Ondas Doppler Omnidirecionais'}
            </span>
          </div>
        </div>

        {/* Recharts AreaChart Container */}
        <div className="w-full h-64 bg-slate-950/80 border border-slate-800 rounded-xl p-3 pt-5">
          {machHistory.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono gap-2">
              <Activity className="w-6 h-6 animate-pulse text-cyan-400/60" />
              <span>Inicie o voo para registrar a curva de Mach em tempo real...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={machHistory} margin={{ top: 10, right: 25, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="machLiveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="timeStr"
                  stroke="#475569"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#475569"
                  domain={[0, 3.5]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `M ${val}`}
                />
                <Tooltip content={<CustomMachTooltip />} />
                {/* Sonic Barrier Threshold Line at Mach 1.0 */}
                <ReferenceLine
                  y={1.0}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'M = 1.0 Barreira do Som (Transônico)',
                    fill: '#f59e0b',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                {/* Area Curve for Mach */}
                <Area
                  type="monotone"
                  dataKey="mach"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#machLiveGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* DEDICATED DOPPLER AUDIO SYNTHESIZER TELEMETRY & CONTROLS CARD */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <AudioWaveform className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Sintetizador Acústico Doppler em Tempo Real</span>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded">
                  audioSynth
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Frequência alterada continuamente baseada na velocidade relativa <code className="text-cyan-300 font-mono">v_rel = v_avião · cos(θ)</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestBoom}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold transition-colors"
              title="Disparar som de duplo estampido sônico (N-wave)"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Testar Duplo Boom Sônico</span>
            </button>
          </div>
        </div>

        {/* Real-time Frequency & Relative Velocity Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Relative Velocity Meter */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
              <span>Velocidade Relativa (v_rel)</span>
              <span className={`w-2 h-2 rounded-full ${telemetry.vRelMs > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            </div>
            <div className="my-1.5">
              <div className={`text-xl font-bold font-mono ${telemetry.vRelMs > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry.vRelMs >= 0 ? '+' : ''}{telemetry.vRelMs.toFixed(1)} m/s
              </div>
              <div className="text-xs text-slate-500 font-mono">
                ({telemetry.vRelKmh >= 0 ? '+' : ''}{telemetry.vRelKmh.toFixed(0)} km/h)
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              {telemetry.vRelMs > 10
                ? '🟢 Aproximação (Distância encurtando)'
                : telemetry.vRelMs < -10
                ? '🔴 Afastamento (Distância aumentando)'
                : '🟡 Ponto de cruzamento direto'}
            </div>
          </div>

          {/* 2. Frequency Shift Meter */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              Frequência do Motor
            </div>
            <div className="my-1.5">
              <div className="text-xl font-bold font-mono text-cyan-300">
                {telemetry.perceivedFreq.toFixed(0)} Hz
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Base f₀: {telemetry.baseFreq} Hz · Razão: {telemetry.freqRatio.toFixed(2)}x
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Equação: <code className="text-cyan-400 font-mono">f' = f₀ · [c / (c - v_rel)]</code>
            </div>
          </div>

          {/* 3. Acoustic State Indicator */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              Estado no Observador
            </div>
            <div className="my-1.5">
              {mach >= 1.0 && !telemetry.isInsideCone ? (
                <div className="text-sm font-bold text-slate-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Zona de Silêncio
                </div>
              ) : (
                <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Som Audível (Doppler Ativo)
                </div>
              )}
              <div className="text-xs text-slate-500 font-mono mt-1">
                Distância: {(telemetry.distanceMeters / 1000).toFixed(2)} km
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              {mach >= 1.0 && !telemetry.isInsideCone
                ? 'Onda de choque ainda não alcançou o solo.'
                : 'Ondas contínuas atingindo o sensor.'}
            </div>
          </div>

          {/* 4. Audio Engine Controls */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              <span>Volume Sintetizador</span>
              <span className="text-white font-bold">{Math.round(audioVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={audioVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            {/* Engine Profile Selection */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-medium">
              {[
                { id: 'fighter' as EngineSoundProfile, label: 'Caça F-18' },
                { id: 'commercial' as EngineSoundProfile, label: 'Turbofan' },
                { id: 'propeller' as EngineSoundProfile, label: 'Hélice' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProfileChange(p.id)}
                  className={`flex-1 py-1 rounded text-center transition-colors ${
                    engineProfile === p.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
