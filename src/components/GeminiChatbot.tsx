import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Cpu,
  GraduationCap,
  Wrench,
  Calculator,
  ChevronDown
} from 'lucide-react';
import { ChatMessage, ChatRole } from '../types/physics';

interface GeminiChatbotProps {
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Olá! Sou seu assistente de Física Acústica e Voo Supersônico, baseado no curso **F 105 - Física da Fala e da Audição** da UNICAMP (Prof. Dr. Marcelo Knobel).

Posso tirar dúvidas sobre:
- 🚀 **Quebra da barreira do som**, Número Mach ($M = v/c$) e **Cone de Mach** ($\text{sen}(\mu) = 1/M$).
- 💥 Por que ouvimos o **Duplo Estrondo Sônico** (*Double Sonic Boom*) com choque de proa e cauda (Slide 15).
- 💨 A nuvem cônica de **Prandtl-Glauert** na foto do caça F-18 (Slide 16).
- 🌡️ Variação da velocidade do som com a temperatura ($v = 331 + 0.6T$) e refração por gradiente térmico.
- 📡 Efeito Doppler, sonar e exercícios práticos de ecolocalização e radares.

Como posso ajudar você hoje?`,
      timestamp: new Date(),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<ChatRole>('professor');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle external initial prompt if provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      sendMessage(initialPrompt.trim());
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const roles = [
    {
      id: 'professor' as ChatRole,
      label: 'Prof. Marcelo Knobel (UNICAMP)',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      desc: 'Rigor acadêmico, conexão direta com os slides de F105.',
    },
    {
      id: 'engineer' as ChatRole,
      label: 'Engenheiro de Voo Supersônico',
      icon: <Wrench className="w-3.5 h-3.5" />,
      desc: 'Foco em aerodinâmica de caças, onda N e atenuação de estrondo.',
    },
    {
      id: 'tutor' as ChatRole,
      label: 'Tutor de Exercícios & Fórmulas',
      icon: <Calculator className="w-3.5 h-3.5" />,
      desc: 'Resolução passo a passo de problemas matemáticos.',
    },
  ];

  const suggestedPrompts = [
    'Por que ouvimos dois estrondos sônicos e não apenas um ao passar um avião supersônico?',
    'Como a temperatura a 11.000m de altitude afeta a velocidade do som e o Mach do avião?',
    'O que causa a nuvem de condensação de Prandtl-Glauert vista no F-18 do Slide 16?',
    'Como deduzir a fórmula do ângulo do cone de Mach sen(μ) = 1/M?',
    'Explique a resolução do exercício do sapo ecolocalizador a 500 Hz do Slide 7.',
  ];

  const sendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Send conversation history to server-side endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemRole: selectedRole,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `resp-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        modelUsed: data.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Não foi possível obter resposta: ${err.message || 'Erro de conexão'}. Verifique as configurações de chave no painel Secrets ou tente novamente.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversa reiniciada. Escolha um tópico ou faça uma nova pergunta sobre física acústica aeronáutica!',
        timestamp: new Date(),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[750px] bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Chat Header */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>AeroGemini: F 105 Assistente Acústico</span>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded">
                Multi-Turn
              </span>
            </h3>
            <div className="text-[11px] text-slate-400">
              Conhecimento fundamentado no material didático do Prof. Dr. Marcelo Knobel
            </div>
          </div>
        </div>

        {/* Role & Model Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedRole === r.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={r.desc}
              >
                {r.icon}
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono outline-none cursor-pointer"
            >
              <option value="gemini-3.8-flash" className="bg-slate-900 text-white">
                gemini-3.8-flash (Padrão)
              </option>
              <option value="gemini-3.5-flash" className="bg-slate-900 text-white">
                gemini-3.5-flash (Geral)
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-white">
                gemini-3.1-flash-lite (Rápido)
              </option>
              <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-white">
                gemini-3.1-pro-preview (Complexo)
              </option>
            </select>
          </div>

          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
            title="Limpar histórico da conversa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Prompts Bar */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Perguntas Rápidas:
        </span>
        {suggestedPrompts.map((sp, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(sp)}
            className="shrink-0 px-3 py-1 bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/50 text-[11px]"
          >
            {sp}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 border border-slate-700 text-cyan-400'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`flex flex-col gap-1.5 p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-600/90 text-white rounded-tr-none'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              {/* Message Header with model tag */}
              <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 font-mono pb-1 border-b border-white/10">
                <span>
                  {msg.role === 'user'
                    ? 'Você'
                    : msg.modelUsed
                    ? `Gemini (${msg.modelUsed})`
                    : 'AeroGemini'}
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-white transition-colors"
                      title="Copiar texto"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content with line breaks */}
              <div className="whitespace-pre-wrap space-y-2 font-sans">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-md">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs text-slate-400 font-mono">
                Consultando a física do som com {selectedModel}...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-slate-950/90 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-cyan-500/50 transition-colors"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Pergunte sobre aviões supersônicos, Mach, efeito Doppler ou qualquer slide da aula..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none resize-none max-h-28 py-1"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-2 rounded-lg transition-all ${
              inputText.trim() && !isLoading
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                : 'text-slate-600 bg-slate-800/50 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
          <span>Pressione Enter para enviar, Shift+Enter para nova linha.</span>
          <span>Modelo ativo: {selectedModel}</span>
        </div>
      </div>
    </div>
  );
};
