/**
 * Web Audio API Acoustic Synthesizer for AeroAcoustics
 * Dynamically changes the frequency and acoustic spectrum of a simulated aircraft engine
 * based on the exact relative velocity of the airplane compared to the stationary observer.
 *
 * Implements the Doppler effect: f' = f0 * (c / (c - v_rel))
 * Based on Slide 12 (Efeito Doppler) & Slide 15 (Ondas de Choque) of F 105 UNICAMP.
 */

export type EngineSoundProfile = 'fighter' | 'commercial' | 'propeller';

class AcousticSynthesizer {
  private ctx: AudioContext | null = null;

  // Master nodes
  private masterGain: GainNode | null = null;
  private isMuted: boolean = true;
  private volume: number = 0.75;

  // Multi-oscillator engine synthesis
  private engineOsc: OscillatorNode | null = null;
  private whineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private whineGain: GainNode | null = null;

  // Atmospheric absorption filter
  private airFilter: BiquadFilterNode | null = null;

  // Jet exhaust noise generator
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  // State telemetry
  private baseEngineFreq: number = 140; // Hz fundamental
  private whineHarmonicMultiple: number = 2.85; // turbine blade whine multiplier
  private currentShiftedFreq: number = 140;
  private currentDopplerRatio: number = 1.0;
  private currentVRel: number = 0;
  private soundProfile: EngineSoundProfile = 'fighter';

  /**
   * Initializes or resumes the AudioContext upon user gesture
   */
  public initContext(): boolean {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.setupAudioGraph();
      return true;
    } catch (e) {
      console.warn('AudioContext could not be initialized:', e);
      return false;
    }
  }

  private setupAudioGraph() {
    if (!this.ctx || this.masterGain) return;

    const now = this.ctx.currentTime;

    // 1. Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, now);
    this.masterGain.connect(this.ctx.destination);

    // 2. Air Lowpass Filter (Atmospheric acoustic absorption)
    this.airFilter = this.ctx.createBiquadFilter();
    this.airFilter.type = 'lowpass';
    this.airFilter.frequency.setValueAtTime(1200, now);
    this.airFilter.Q.setValueAtTime(1.2, now);
    this.airFilter.connect(this.masterGain);

    // 3. Engine Sub/Fundamental Oscillator
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(this.baseEngineFreq, now);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, now);

    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.airFilter);
    this.engineOsc.start();

    // 4. Turbine Whine Oscillator (High compressor tone)
    this.whineOsc = this.ctx.createOscillator();
    this.whineOsc.type = 'sine';
    this.whineOsc.frequency.setValueAtTime(this.baseEngineFreq * this.whineHarmonicMultiple, now);

    this.whineGain = this.ctx.createGain();
    this.whineGain.gain.setValueAtTime(0, now);

    this.whineOsc.connect(this.whineGain);
    this.whineGain.connect(this.airFilter);
    this.whineOsc.start();

    // 5. White Noise Jet Exhaust Roar
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0, now);

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.airFilter);
    this.noiseNode.start();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, now, 0.03);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (!this.isMuted && this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setEngineProfile(profile: EngineSoundProfile) {
    this.soundProfile = profile;
    if (profile === 'fighter') {
      this.baseEngineFreq = 160;
      this.whineHarmonicMultiple = 2.85;
    } else if (profile === 'commercial') {
      this.baseEngineFreq = 115;
      this.whineHarmonicMultiple = 3.6;
    } else if (profile === 'propeller') {
      this.baseEngineFreq = 88;
      this.whineHarmonicMultiple = 2.0;
    }
  }

  public getEngineProfile(): EngineSoundProfile {
    return this.soundProfile;
  }

  /**
   * Main Doppler update function.
   * Dynamically alters the pitch/frequency of the engine sound according to:
   *
   *   v_rel = v_plane * cos(theta)
   *   f' = f0 * (c / (c - v_rel))
   *
   * @param vRel Relative velocity of the airplane towards the observer along the line of sight (m/s).
   *             Positive if approaching, zero at closest point, negative if receding.
   * @param soundSpeed Current speed of sound c (m/s) in the atmosphere (from v = 331 + 0.6*T).
   * @param distanceMeters Straight-line distance from airplane to observer in meters.
   * @param isSupersonic True if airplane Mach >= 1.0.
   * @param isInsideCone True if observer is inside the Mach cone.
   * @param active True if the simulation is currently running and unpaused.
   */
  public updateFromRelativeVelocity(
    vRel: number,
    soundSpeed: number,
    distanceMeters: number,
    isSupersonic: boolean,
    isInsideCone: boolean,
    active: boolean
  ) {
    this.currentVRel = vRel;

    if (this.isMuted || !active) {
      if (this.engineGain && this.whineGain && this.noiseGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.engineGain.gain.setTargetAtTime(0, now, 0.05);
        this.whineGain.gain.setTargetAtTime(0, now, 0.05);
        this.noiseGain.gain.setTargetAtTime(0, now, 0.05);
      }
      return;
    }

    if (!this.ctx || !this.masterGain) {
      this.initContext();
    }
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Calculate exact Doppler frequency multiplier:
    // f' = f0 * (c / (c - v_rel))
    // To prevent singularity as v_rel approaches c (Mach 1 bow shock),
    // we clamp the denominator (c - v_rel) >= 0.035 * c.
    const effectiveDenominator = Math.max(soundSpeed * 0.035, soundSpeed - vRel);
    let dopplerRatio = soundSpeed / effectiveDenominator;

    // Safety clamp frequency ratio between 0.25x and 18x
    dopplerRatio = Math.max(0.25, Math.min(18.0, dopplerRatio));
    this.currentDopplerRatio = dopplerRatio;

    // Primary frequency perceived by observer
    const shiftedFreq = Math.min(3200, Math.max(30, this.baseEngineFreq * dopplerRatio));
    this.currentShiftedFreq = shiftedFreq;

    // High turbine whine frequency
    const shiftedWhineFreq = Math.min(6500, Math.max(80, shiftedFreq * this.whineHarmonicMultiple));

    // Distance attenuation: Intensity falls off with inverse-square law (Slide 3)
    // Sound pressure amplitude falls off as 1/distance
    const refDistance = 150; // meters
    const distFactor = Math.min(1.0, refDistance / Math.max(refDistance * 0.5, distanceMeters));

    // Supersonic gating: In supersonic flight, observer is in absolute silence
    // until the Mach cone envelope sweeps over them!
    let targetEngineGain = 0;
    let targetWhineGain = 0;
    let targetNoiseGain = 0;

    if (isSupersonic) {
      if (isInsideCone) {
        // Observer is inside the cone: receives sound from earlier positions
        targetEngineGain = distFactor * 0.18;
        targetWhineGain = distFactor * 0.09;
        targetNoiseGain = distFactor * 0.12;
      } else {
        // Outside the cone (Zone of silence)
        targetEngineGain = 0;
        targetWhineGain = 0;
        targetNoiseGain = 0;
      }
    } else {
      // Subsonic: sound radiates omnidirectionally
      targetEngineGain = distFactor * 0.16;
      targetWhineGain = distFactor * 0.08;
      targetNoiseGain = distFactor * 0.11;
    }

    // Atmospheric lowpass absorption: high frequencies attenuate faster over distance
    // Air cutoff drops with distance (muffled bass far away, crisp high frequencies up close)
    const airCutoff = Math.max(250, 4200 * distFactor);

    // Apply audio parameters smoothly to avoid clicks or audio tearing
    if (this.engineOsc && this.engineGain && this.whineOsc && this.whineGain && this.airFilter && this.noiseGain) {
      this.engineOsc.frequency.setTargetAtTime(shiftedFreq, now, 0.025);
      this.whineOsc.frequency.setTargetAtTime(shiftedWhineFreq, now, 0.025);

      this.engineGain.gain.setTargetAtTime(targetEngineGain, now, 0.035);
      this.whineGain.gain.setTargetAtTime(targetWhineGain, now, 0.035);
      this.noiseGain.gain.setTargetAtTime(targetNoiseGain, now, 0.035);

      this.airFilter.frequency.setTargetAtTime(airCutoff, now, 0.05);
    }
  }

  /**
   * Synthesize explosive Double Sonic Boom (Bow shock + Tail shock from Slide 15)
   */
  public triggerDoubleSonicBoom(intensity: number = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Trigger First Boom (Bow Shock - Nose of aircraft)
    this.playSingleBoom(now, 1.0 * intensity, 58);

    // Trigger Second Boom (Tail Shock - Empennage of aircraft) ~ 125ms later
    this.playSingleBoom(now + 0.125, 0.85 * intensity, 46);
  }

  private playSingleBoom(startTime: number, volumeFactor: number, startFreq: number) {
    if (!this.ctx) return;

    // Explosive sub-bass punch oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(16, startTime + 0.4);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.45 * volumeFactor * this.volume, startTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.48);

    // Shock crackle noise burst
    const bufferSize = this.ctx.sampleRate * 0.18;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(500, startTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28 * volumeFactor * this.volume, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.55);
    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + 0.22);
  }

  public getTelemetry() {
    return {
      baseFreq: this.baseEngineFreq,
      shiftedFreq: this.currentShiftedFreq,
      dopplerRatio: this.currentDopplerRatio,
      vRel: this.currentVRel,
      isMuted: this.isMuted,
      volume: this.volume,
      profile: this.soundProfile,
    };
  }

  public stop() {
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }
}

export const audioSynth = new AcousticSynthesizer();
