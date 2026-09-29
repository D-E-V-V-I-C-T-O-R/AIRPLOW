export interface AircraftState {
  x: number;
  y: number;
  altitude: number; // in meters
  mach: number;
  temperature: number; // in Celsius
  speedSound: number; // m/s
  speedPlane: number; // m/s
  machAngleDeg: number; // degrees
  isSupersonic: boolean;
  isTransonic: boolean;
}

export interface SoundWavefront {
  id: number;
  originX: number;
  originY: number;
  radius: number; // in screen pixels
  timestamp: number;
  opacity: number;
}

export interface GroundObserver {
  x: number;
  y: number;
  altitude: number;
  isInsideCone: boolean;
  justHitByShock: boolean;
  perceivedFreqRatio: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp: Date;
  modelUsed?: string;
}

export type ChatRole = 'professor' | 'engineer' | 'tutor';

export interface PresetScenario {
  id: string;
  name: string;
  slideRef: string;
  mach: number;
  temperature: number;
  description: string;
  aircraftType: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'mach-0',
    name: 'Mach 0.0 · Avião em Repouso',
    slideRef: 'Slide 14',
    mach: 0.0,
    temperature: 20,
    description: 'Aeronave parada na pista emitindo ondas esféricas concêntricas simétricas.',
    aircraftType: 'Aeronave Estática',
  },
  {
    id: 'mach-07',
    name: 'Mach 0.7 · Subsônico de Cruzeiro',
    slideRef: 'Slide 14',
    mach: 0.7,
    temperature: -15,
    description: 'Velocidade de jato comercial típica. Frentes de onda comprimidas na frente e espaçadas atrás (Efeito Doppler).',
    aircraftType: 'Boeing 787 / Airbus A350',
  },
  {
    id: 'mach-10',
    name: 'Mach 1.0 · Barreira do Som',
    slideRef: 'Slide 14 & 16',
    mach: 1.0,
    temperature: -20,
    description: 'Velocidade transônica crítica: as cristas das ondas acumulam-se formando uma muralha de alta pressão no nariz.',
    aircraftType: 'Transonic Barrier Jet',
  },
  {
    id: 'mach-14',
    name: 'Mach 1.4 · Caça F/A-18 Hornet',
    slideRef: 'Slide 15 & 16',
    mach: 1.4,
    temperature: -30,
    description: 'O avião ultrapassa o som emitido. Surge o Cone de Mach com ângulo de ~45.6° e nuvem de condensação de Prandtl-Glauert!',
    aircraftType: 'F/A-18 Super Hornet',
  },
  {
    id: 'mach-20',
    name: 'Mach 2.0 · Concorde Supersônico',
    slideRef: 'Slide 15',
    mach: 2.0,
    temperature: -50,
    description: 'Duas vezes a velocidade do som. O Cone de Mach estreita para 30.0°, gerando o duplo estrondo sônico característico.',
    aircraftType: 'Aérospatiale / BAC Concorde',
  },
  {
    id: 'mach-30',
    name: 'Mach 3.0 · SR-71 Blackbird',
    slideRef: 'Slide 15',
    mach: 3.0,
    temperature: -55,
    description: 'Regime supersônico extremo: Cone de Mach extremamente afunilado (19.47°) e aquecimento cinético intenso.',
    aircraftType: 'Lockheed SR-71 Blackbird',
  },
];
