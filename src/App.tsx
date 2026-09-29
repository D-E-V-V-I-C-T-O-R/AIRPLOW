import React, { useState } from 'react';
import {
  Plane,
  BookOpen,
  Calculator,
  Bot,
  Volume2,
  VolumeX,
  Compass,
  Radio,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { AeroSimCanvas } from './components/AeroSimCanvas';
import { TheorySection } from './components/TheorySection';
import { CalculatorsSection } from './components/CalculatorsSection';
import { GeminiChatbot } from './components/GeminiChatbot';
import { audioSynth } from './utils/audioSynth';

export function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'theory' | 'calculators' | 'chatbot'>('simulator');
  const [globalMuted, setGlobalMuted] = useState<boolean>(true);
  const [chatbotPrompt, setChatbotPrompt] = useState<string | null>(null);

  const handleToggleGlobalAudio = () => {
    const nextState = !globalMuted;
    setGlobalMuted(nextState);
    audioSynth.setMuted(nextState);
  };

  const handleAskGemini = (promptText: string) => {
    setChatbotPrompt(promptText);
    setActiveTab('chatbot');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Application Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Plane className="w-5 h-5 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-sans">
                  AeroAcoustics
                </h1>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded">
                  F 105 UNICAMP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Física das Ondas Sonoras no Voo de Aeronaves & Cone de Mach
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Accessible segmented control buttons) */}
          <nav className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'simulator'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Simulador de Voo</span>
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'theory'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Teoria & Slides</span>
            </button>

            <button
              onClick={() => setActiveTab('calculators')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'calculators'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculadoras</span>
            </button>

            <button
              onClick={() => setActiveTab('chatbot')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'chatbot'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Assistente Gemini</span>
            </button>
          </nav>

          {/* Audio Master Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleGlobalAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                !globalMuted
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Ativar/desativar sintetizador sonoro"
            >
              {!globalMuted ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {!globalMuted ? 'Áudio Ligado' : 'Áudio Mudo'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === 'simulator' && (
          <AeroSimCanvas
            onSelectTheory={() => setActiveTab('theory')}
            onAskGemini={handleAskGemini}
            audioEnabled={!globalMuted}
            onToggleAudio={handleToggleGlobalAudio}
          />
        )}

        {activeTab === 'theory' && (
          <TheorySection onAskGemini={handleAskGemini} />
        )}

        {activeTab === 'calculators' && (
          <CalculatorsSection />
        )}

        {activeTab === 'chatbot' && (
          <GeminiChatbot
            initialPrompt={chatbotPrompt}
            onClearInitialPrompt={() => setChatbotPrompt(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Baseado no curso <strong className="text-slate-400">F 105 - Física da Fala e da Audição</strong> (Prof. Dr. Marcelo Knobel, IFGW / UNICAMP).
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Número Mach · Cone de Mach · Efeito Doppler · Duplo Boom Sônico</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
