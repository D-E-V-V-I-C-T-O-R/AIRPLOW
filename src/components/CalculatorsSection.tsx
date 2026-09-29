import React, { useState } from 'react';
import { Calculator, CheckCircle2, HelpCircle, ArrowRight, Gauge, Activity, Navigation } from 'lucide-react';

export const CalculatorsSection: React.FC = () => {
  // 1. Mach Calculator State
  const [calcPlaneSpeedKmh, setCalcPlaneSpeedKmh] = useState<number>(1850);
  const [calcTemp, setCalcTemp] = useState<number>(-25);
  const [calcAltitude, setCalcAltitude] = useState<number>(9000);

  const calcSoundSpeedMs = 331 + 0.6 * calcTemp;
  const calcPlaneSpeedMs = calcPlaneSpeedKmh / 3.6;
  const calcMach = calcPlaneSpeedMs / calcSoundSpeedMs;
  const isSupersonic = calcMach >= 1.0;
  const calcMachAngleDeg = isSupersonic ? (Math.asin(1 / calcMach) * 180) / Math.PI : 90;

  // Boom arrival delay on ground: distance along hypotenuse / sound speed vs flyby
  const boomGroundDistanceAhead = isSupersonic
    ? calcAltitude / Math.tan((calcMachAngleDeg * Math.PI) / 180)
    : 0;
  const boomDelaySeconds = isSupersonic ? boomGroundDistanceAhead / calcPlaneSpeedMs : 0;

  // 2. Frog Sonar Exercise State (Slide 7)
  const [frogFreq, setFrogFreq] = useState<number>(500);
  const frogLambda = 340 / frogFreq; // meters
  const frogMinDiffraction = frogLambda / 6;
  const frogReflectionMin = 5 * frogLambda;
  const frogReflectionMax = 10 * frogLambda;

  // 3. Train Doppler Exercise State (Slide 13)
  const [trainF0, setTrainF0] = useState<number>(3000);
  const [trainObsF, setTrainObsF] = useState<number>(3010);
  const trainSoundSpeed = 340;
  // f' = f0 * v / (v - vs) => (v - vs) = f0 * v / f' => vs = v * (1 - f0 / f')
  const trainSpeedMs = trainSoundSpeed * (1 - trainF0 / trainObsF);
  const trainSpeedKmh = trainSpeedMs * 3.6;
  const isApproaching = trainObsF > trainF0;

  // 4. Autofocus Sonar Exercise State (Slide 8)
  const [cameraDist, setCameraDist] = useState<number>(20);
  const cameraSoundSpeed = 343;
  const cameraEchoTimeMs = (2 * cameraDist / cameraSoundSpeed) * 1000;

  // 5. Lightning Thunder Delay (Slide 2)
  const [thunderSeconds, setThunderSeconds] = useState<number>(3);
  const lightningDistMeters = thunderSeconds * 340;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Calculadoras & Resolução dos Exercícios da Aula
            </h2>
            <div className="text-xs text-slate-400">
              Interaja com as equações dos slides da F 105 UNICAMP com valores personalizados.
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Solvers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Mach and Shock Angle Solver */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">
                1. Calculadora de Mach & Cone de Choque (Slides 10 & 14-15)
              </h3>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              Aeronáutica
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Velocidade Avião (km/h)</label>
              <input
                type="number"
                value={calcPlaneSpeedKmh}
                onChange={(e) => setCalcPlaneSpeedKmh(Math.max(100, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Temperatura Ar (°C)</label>
              <input
                type="number"
                value={calcTemp}
                onChange={(e) => setCalcTemp(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Altitude (metros)</label>
              <input
                type="number"
                value={calcAltitude}
                onChange={(e) => setCalcAltitude(Math.max(100, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Results Box */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-[10px] text-slate-500 font-mono">v_som (331 + 0.6T)</div>
              <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{calcSoundSpeedMs.toFixed(1)} m/s</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Número Mach (M)</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${calcMach >= 1 ? 'text-cyan-400' : 'text-emerald-400'}`}>
                M {calcMach.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Ângulo μ (arcsen 1/M)</div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                {isSupersonic ? `${calcMachAngleDeg.toFixed(1)}°` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Atraso Boom no Solo</div>
              <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
                {isSupersonic ? `${boomDelaySeconds.toFixed(1)} s` : 'Sem Choque'}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Frog Sonar Exercise (Slide 7) */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">
                2. Exercício do Sapo Ecolocalizador (Slide 7)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Slide 7
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-relaxed italic">
            "Suponha que uma nova espécie de sapo possa localizar objetos utilizando o eco de um som emitido a 500 Hz. Qual seria o tamanho mínimo dos objetos que ele conseguiria detectar?"
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="text-slate-400">Frequência emitida pelo sapo (Hz):</label>
            <input
              type="number"
              value={frogFreq}
              onChange={(e) => setFrogFreq(Math.max(20, parseInt(e.target.value, 10) || 500))}
              className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
            />
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
            <div className="text-slate-300">
              1. Comprimento de onda: <strong className="text-white font-mono">λ = v / f = 340 / {frogFreq} = {frogLambda.toFixed(2)} m ({ (frogLambda * 100).toFixed(0) } cm)</strong>
            </div>
            <div className="text-slate-300">
              2. Pela regra de reflexão (Slide 7): para que haja reflexão perceptível na forma de <strong className="text-emerald-400">eco nítido</strong>, o objeto precisa ser de pelo menos 5 a 10 comprimentos de onda:
              <span className="block mt-1 font-mono text-cyan-300 font-semibold">
                Tamanho mínimo para eco = 5λ a 10λ ⇒ {frogReflectionMin.toFixed(1)} m a {frogReflectionMax.toFixed(1)} m
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              (Objetos de ~{frogLambda.toFixed(2)}m apenas difratam/espalham o som, e menores que {(frogMinDiffraction).toFixed(2)}m são invisíveis/transparentes).
            </div>
          </div>
        </div>

        {/* Card 3: Moving Train Exercise (Slide 13) */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-slate-100">
                3. Questão do Apito do Trem Doppler (Slide 13)
              </h3>
            </div>
            <span className="text-[10px] text-blue-400 font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
              Slide 13
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-relaxed italic">
            "Um apito de trem em repouso tem uma frequência de 3000 Hertz. Se você está parado e percebe uma frequência de 3010 Hertz, então você conclui que..."
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Frequência emitida f₀ (Hz)</label>
              <input
                type="number"
                value={trainF0}
                onChange={(e) => setTrainF0(parseInt(e.target.value, 10) || 3000)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Frequência percebida f' (Hz)</label>
              <input
                type="number"
                value={trainObsF}
                onChange={(e) => setTrainObsF(parseInt(e.target.value, 10) || 3010)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resposta Correta: {isApproaching ? 'b) O trem está se aproximando de você!' : 'a) O trem está se distanciando!'}</span>
            </div>
            <div className="text-slate-300">
              Cálculo exato da velocidade do trem: <code className="text-cyan-300 font-mono">v_trem = v · (1 - f₀ / f')</code>
            </div>
            <div className="font-mono text-cyan-400 font-bold">
              Velocidade: {Math.abs(trainSpeedMs).toFixed(2)} m/s ({Math.abs(trainSpeedKmh).toFixed(1)} km/h)
            </div>
          </div>
        </div>

        {/* Card 4: Autofocus Sonar & Thunder (Slides 2 & 8) */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">
                4. Câmera Autofoco & Relâmpago (Slides 2 & 8)
              </h3>
            </div>
            <span className="text-[10px] text-purple-400 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
              Slides 2 & 8
            </span>
          </div>

          {/* Autofocus Camera */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Autofoco da Câmera (Slide 8):</span>
              <span className="font-mono text-cyan-400">{cameraDist} metros</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={cameraDist}
              onChange={(e) => setCameraDist(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
            />
            <div className="p-2.5 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>t = 2 · d / v = (2 × {cameraDist}m) / 343m/s</span>
              <strong className="text-cyan-400">{cameraEchoTimeMs.toFixed(1)} ms ({ (cameraEchoTimeMs/1000).toFixed(3) } s)</strong>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Thunder and Lightning Delay */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Raio e Trovão (Slide 2):</span>
              <span className="font-mono text-amber-400">{thunderSeconds} segundos de atraso</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={thunderSeconds}
              onChange={(e) => setThunderSeconds(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-1 bg-slate-800 rounded"
            />
            <div className="p-2.5 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>Distância = {thunderSeconds}s × 340 m/s</span>
              <strong className="text-amber-400">{lightningDistMeters} metros (~{(lightningDistMeters/1000).toFixed(1)} km)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
