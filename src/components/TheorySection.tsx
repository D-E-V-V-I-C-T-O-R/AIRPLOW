import React, { useState } from 'react';
import {
  Volume2,
  Zap,
  Waves,
  Ear,
  SunMedium,
  Radio,
  Plane,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface TheorySectionProps {
  onAskGemini?: (promptText: string) => void;
}

export const TheorySection: React.FC<TheorySectionProps> = ({ onAskGemini }) => {
  const [activeTopic, setActiveTopic] = useState<string>('airplane-shock');

  const topics = [
    {
      id: 'airplane-shock',
      icon: <Plane className="w-4 h-4 text-cyan-400" />,
      title: 'Aviões, Mach e Ondas de Choque',
      slides: 'Slides 14, 15, 16',
      subtitle: 'Como aeronaves interagem com as ondas sonoras e quebram a barreira do som.',
    },
    {
      id: 'doppler-effect',
      icon: <Radio className="w-4 h-4 text-blue-400" />,
      title: 'Efeito Doppler & Frequência',
      slides: 'Slides 12, 13',
      subtitle: 'Variação aparente de tom em fontes em movimento e aplicações em radar.',
    },
    {
      id: 'temperature-refraction',
      icon: <SunMedium className="w-4 h-4 text-amber-400" />,
      title: 'Velocidade do Som & Refração Térmica',
      slides: 'Slides 10, 11',
      subtitle: 'Fórmula v = 331 + 0.6T e deflexão de ondas sonoras no dia e na noite.',
    },
    {
      id: 'sound-spectrum',
      icon: <Volume2 className="w-4 h-4 text-emerald-400" />,
      title: 'Espectro Sonoro & Faixas de Audição',
      slides: 'Slide 1',
      subtitle: 'Infrassom (<20 Hz), audível humano (20 - 20.000 Hz) e ultrassom (>20 kHz).',
    },
    {
      id: 'reflection-diffraction',
      icon: <Waves className="w-4 h-4 text-indigo-400" />,
      title: 'Reflexão, Difração e Eco',
      slides: 'Slides 5, 6, 7, 8, 9',
      subtitle: 'Regra de interação com objetos (λ/6, λ e >5-10λ), Sonar e autofoco fotográfico.',
    },
    {
      id: 'energy-intensity',
      icon: <Zap className="w-4 h-4 text-purple-400" />,
      title: 'Energia, Intensidade e a Orelha',
      slides: 'Slides 3, 4',
      subtitle: 'Lei do inverso do quadrado (I ∝ 1/r²), amplitude ao quadrado e sensibilidade auditiva.',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900/70 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Física da Fala e da Audição (F 105)
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Prof. Dr. Marcelo Knobel</span>
              <span aria-hidden="true">·</span>
              <span>IFGW · UNICAMP</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-400">Conteúdo Completo dos Slides</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAskGemini && (
            <button
              onClick={() => onAskGemini('Explique detalhadamente como o avião quebra a barreira do som e por que o cone de Mach gera um duplo estrondo sônico segundo os slides da aula F105 da UNICAMP.')}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tirar Dúvida com Gemini</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Left Topic Selector, Right Interactive Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">
            Tópicos da Aula
          </div>
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                activeTopic === t.id
                  ? 'bg-slate-900 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="p-2 bg-slate-800/80 rounded-lg mt-0.5">{t.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className={`text-xs font-bold truncate ${activeTopic === t.id ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {t.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{t.slides}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {t.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Detailed Topic Article */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6">
          {activeTopic === 'airplane-shock' && (
            <div className="flex flex-col gap-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="text-xs text-cyan-400 font-mono font-semibold uppercase tracking-wider">
                  Slides 14, 15 & 16 · F 105 UNICAMP
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Aeronaves, Número Mach e o Cone de Choque
                </h3>
              </div>

              {/* Mach Regimes Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-bold text-emerald-400 font-mono">Mach &lt; 1 (Subsônico)</div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Mais lento que o som. As frentes de onda esféricas viajam na frente do avião, comprimindo-se adiante e expandindo-se para trás (Efeito Doppler).
                  </p>
                </div>
                <div className="p-4 bg-slate-950/60 border border-amber-500/30 rounded-xl">
                  <div className="text-xs font-bold text-amber-400 font-mono">Mach = 1 (Transônico)</div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Velocidade igual à do som. As cristas das frentes de onda se empilham exatamente no bico do avião, criando uma barreira de altíssima densidade e pressão.
                  </p>
                </div>
                <div className="p-4 bg-slate-950/60 border border-cyan-500/30 rounded-xl">
                  <div className="text-xs font-bold text-cyan-400 font-mono">Mach &gt; 1 (Supersônico)</div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Mais rápido que o som. O avião ultrapassa as ondas que acabou de emitir. A envoltória das esferas forma uma superfície cônica: o <strong className="text-white">Cone de Mach</strong>.
                  </p>
                </div>
              </div>

              {/* Mach Formula Box */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-medium">Definição do Número Mach (Slide 14):</span>
                  <div className="text-base font-bold font-mono text-cyan-400">
                    Número Mach = Velocidade do objeto / Velocidade do som
                  </div>
                </div>
                <div className="h-px md:h-10 w-full md:w-px bg-slate-800" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-medium">Semi-ângulo do Cone de Mach (Slide 15):</span>
                  <div className="text-base font-bold font-mono text-amber-400">
                    sen(μ) = 1 / Mach &nbsp;⇒&nbsp; μ = arcsen(1/M)
                  </div>
                </div>
              </div>

              {/* The Double Sonic Boom Explanation (Slide 15) */}
              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Por que ouvimos DOIS "booms" sônicos? (Slide 15)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conforme destacado literalmente na aula do Prof. Marcelo Knobel:
                  <em className="block my-2 pl-3 border-l-2 border-rose-500 text-rose-200">
                    "Ouvem-se dois 'booms', um da frente do objeto voador, e o outro da parte de trás."
                  </em>
                  Quando o avião cruza a atmosfera supersônica, a frente (nariz) empurra o ar subitamente, gerando o choque de compressão de proa (Bow Shock, alta pressão positiva). Ao longo da fuselagem, o ar se expande até atingir pressão abaixo da ambiente. Na empenagem (cauda), o ar é abruptamente recomprimido à pressão atmosférica, gerando um segundo choque (Tail Shock). Esse padrão de pressão é conhecido como <strong className="text-white">Onda em N (N-Wave)</strong>.
                </p>
              </div>

              {/* Slide 16: Prandtl-Glauert Condensation */}
              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Nuvem de Condensação de Prandtl-Glauert (Foto do Slide 16)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A fotografia do caça F/A-18 Hornet no slide 16 ilustra a formação de uma nuvem em forma de cone em torno do avião. No regime transônico/supersônico, as variações abruptas de pressão e expansão aerodinâmica provocam uma queda instantânea na temperatura local do ar. Se o ar contiver umidade suficiente, a temperatura cai abaixo do ponto de orvalho, condensando o vapor em gotículas visíveis por uma fração de segundo!
                </p>
              </div>
            </div>
          )}

          {activeTopic === 'doppler-effect' && (
            <div className="flex flex-col gap-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="text-xs text-blue-400 font-mono font-semibold uppercase tracking-wider">
                  Slides 12 & 13 · F 105 UNICAMP
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Efeito Doppler no Som e Radar
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                O Efeito Doppler consiste na <strong className="text-white">mudança na frequência percebida</strong> de uma onda sonora devido ao movimento relativo entre a fonte emissora e o observador. A altura (tom) do som fica mais aguda na aproximação e mais grave no afastamento.
              </p>

              {/* Doppler Formula */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl">
                <div className="text-xs text-slate-400 font-medium mb-1">Equação Geral do Efeito Doppler:</div>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  f' = f₀ · (v ± vₒ) / (v ∓ vₛ)
                </div>
                <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                  <div>· <strong className="text-slate-200">f₀</strong>: Frequência emitida pela fonte original.</div>
                  <div>· <strong className="text-slate-200">v</strong>: Velocidade de propagação do som no meio.</div>
                  <div>· <strong className="text-slate-200">vₒ</strong>: Velocidade do observador (+ se aproxima da fonte).</div>
                  <div>· <strong className="text-slate-200">vₛ</strong>: Velocidade da fonte (- se aproxima do observador).</div>
                </div>
              </div>

              {/* Radar Doppler (Slide 13) */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <h4 className="text-sm font-bold text-slate-200">Aplicação no Radar de Trânsito (Slide 13)</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  O radar mede a velocidade de veículos emitindo ondas e medindo o desvio Doppler de retorno. O radar só detecta a <strong className="text-white">Velocidade Radial</strong> (a componente da velocidade na direção da linha de visada do radar). A velocidade real decomposta em componente radial e tangencial satisfaz: <code className="text-cyan-300 font-mono">v_radial = v_real · cos(θ)</code>.
                </p>
              </div>
            </div>
          )}

          {activeTopic === 'temperature-refraction' && (
            <div className="flex flex-col gap-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="text-xs text-amber-400 font-mono font-semibold uppercase tracking-wider">
                  Slides 10 & 11 · F 105 UNICAMP
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Velocidade do Som no Ar & Refração Térmica
                </h3>
              </div>

              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl">
                <div className="text-xs text-slate-400 font-medium mb-1">Dependência da Temperatura (Slide 10):</div>
                <div className="text-lg font-bold font-mono text-amber-400">
                  v = 331 + 0.6 · T (°C) &nbsp;[m/s]
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  A 0°C: v = 331 m/s · A 20°C (temperatura ambiente): v = 343 m/s · A -50°C (altitude de cruzeiro de jatos ~11.000m): v = 301 m/s!
                </div>
              </div>

              {/* Gradient Behavior (Slide 11) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-bold text-rose-400">Dia Ensolarado (Solo Quente)</div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    O solo aquece o ar inferior. O som viaja mais rápido perto do chão do que no ar frio superior. Pela Lei de Snell, a frente de onda <strong className="text-white">deflete para cima</strong>, reduzindo o alcance do som no chão.
                  </p>
                </div>
                <div className="p-4 bg-slate-950/60 border border-cyan-500/30 rounded-xl">
                  <div className="text-xs font-bold text-cyan-400">Noite / Inversão Térmica (Solo Frio)</div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    O solo esfria rápido enquanto o ar superior permanece quente. O som viaja mais lento embaixo e mais rápido em cima, fazendo com que as ondas <strong className="text-white">curvem para baixo</strong> em direção ao solo, permitindo ouvir conversas e motores a vários quilômetros de distância!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTopic === 'sound-spectrum' && (
            <div className="flex flex-col gap-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="text-xs text-emerald-400 font-mono font-semibold uppercase tracking-wider">
                  Slide 1 · F 105 UNICAMP
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Espectro Acústico & Limites de Audição
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase font-mono">Infrassônico</div>
                  <div className="text-lg font-bold font-mono text-purple-400 mt-1">&lt; 20 Hz</div>
                  <p className="text-xs text-slate-300 mt-2">
                    Inaudível para humanos. Produzido por terremotos, avalanches, vulcões e elefantes para comunicação a longas distâncias.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-emerald-500/30 rounded-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase font-mono">Audição Humana</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">20 Hz – 20.000 Hz</div>
                  <p className="text-xs text-slate-300 mt-2">
                    Faixa audível pelo ouvido humano saudável. A fala humana concentra-se principalmente entre 250 Hz e 4.000 Hz.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase font-mono">Ultrassônico</div>
                  <div className="text-lg font-bold font-mono text-cyan-400 mt-1">&gt; 20.000 Hz</div>
                  <p className="text-xs text-slate-300 mt-2">
                    Frequências acima do limite humano. Utilizado por morcegos, sonar naval, autofoco de câmeras e exames de ecografia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTopic === 'reflection-diffraction' && (
            <div className="flex flex-col gap-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="text-xs text-indigo-400 font-mono font-semibold uppercase tracking-wider">
                  Slides 5 a 9 · F 105 UNICAMP
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Reflexão, Difração e Resolução de Obstáculos
                </h3>
              </div>

              {/* Three rules of interaction (Slide 7) */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col gap-3">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">
                  Regras de Interação com o Som (Slide 7)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <strong className="text-slate-100 font-mono">Tamanho &lt; λ / 6</strong>
                    <p className="text-slate-400 mt-1">
                      Objetos são <strong className="text-slate-200">transparentes</strong> ao som (a onda passa direto sem sofrer perturbação).
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <strong className="text-slate-100 font-mono">Tamanho ~ λ</strong>
                    <p className="text-slate-400 mt-1">
                      Objetos com dimensões da ordem do comprimento de onda <strong className="text-slate-200">espalham ou difratam</strong> a onda.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <strong className="text-slate-100 font-mono">Tamanho &gt; 5 a 10 λ</strong>
                    <p className="text-slate-400 mt-1">
                      Objetos grandes <strong className="text-slate-200">refletem</strong> a onda sonora gerando um eco nítido.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sonar and Autofocus (Slide 8) */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <h4 className="text-sm font-bold text-slate-200">Sonar & Autofoco de Câmeras (Slide 8)</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Medem a distância calculando o tempo de ida e volta do eco: <code className="text-cyan-300 font-mono">t = 2 · d / v</code>. Para um objeto a 20 metros da câmara com v = 343 m/s: <code className="text-cyan-300 font-mono">t = 40,0 m / 343 m/s = 0,12 s = 120 ms</code>!
                </p>
              </div>
            </div>
          )}

          {activeTopic === 'energy-intensity' && (
            <div className="flex flex-col gap-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="text-xs text-purple-400 font-mono font-semibold uppercase tracking-wider">
                  Slides 3 & 4 · F 105 UNICAMP
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Energia, Intensidade e o Ouvido Humano
                </h3>
              </div>

              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Intensidade Esférica (Slide 3):</div>
                  <div className="text-base font-bold font-mono text-purple-300">
                    I = P / (4 · π · r²)
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    A energia é proporcional à amplitude ao quadrado: <code className="text-purple-300 font-mono">I ∝ A²</code>.
                  </div>
                </div>
                <div className="h-px md:h-12 w-full md:w-px bg-slate-800" />
                <div className="text-xs text-slate-300 max-w-xs">
                  <strong className="text-white">Lei do Inverso do Quadrado:</strong> Quando a distância r duplica (2r), a intensidade cai para <strong className="text-amber-400">1/4</strong> do valor anterior!
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
                <h4 className="text-sm font-bold text-slate-200">Função do Pavilhão Auricular e Canal Auditivo (Slide 4)</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Devido ao espalhamento do som pela lei do inverso do quadrado, o ouvido possui a pinna (pavilhão externo) e o conduto auditivo afunilado para coletar energia de uma área maior e concentrá-la na membrana timpânica, amplificando a sensibilidade auditiva humana por um fator de 2 a 3!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
