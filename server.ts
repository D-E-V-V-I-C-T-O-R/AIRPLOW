import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini SDK on server only
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Multi-turn Gemini Chat endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      if (!apiKey) {
        return res.status(500).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor. Verifique o painel Secrets.',
        });
      }

      const { messages, systemRole, model } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Nenhuma mensagem fornecida no corpo da requisição.' });
      }

      // Model selection according to prompt & skills guidelines
      const selectedModel = model || 'gemini-3.8-flash';

      let systemInstruction = `Você é um assistente científico e educacional especializado em Física das Ondas Sonoras na Aviação, com ênfase no conteúdo da disciplina "F 105 - Física da Fala e da Audição" (Prof. Dr. Marcelo Knobel, IFGW - UNICAMP).

Você domina profundamente os tópicos do curso:
1. Natureza do som e faixas de frequência:
   - Infrassom: frequências < 20 Hz (terremotos, turbulência de grande escala).
   - Intervalo audível humano: 20 Hz a 20.000 Hz.
   - Ultrassom: frequências > 20.000 Hz (sonar, autofoco de câmeras, morcegos).
2. Velocidade do som e propagação atmosférica:
   - Velocidade típica a 20°C: ~343 m/s (~340 m/s no ar padrão).
   - Equação da velocidade com a temperatura: v = 331 + 0.6 * T (°C).
   - Diferença entre luz e som: raio vs. trovão (3 segundos de atraso correspondem a aproximadamente 1 km).
   - Refração do som em gradientes de temperatura (Lei de Snell: sen(θ1)/v1 = sen(θ2)/v2). Gradiente com ar quente no solo faz o som curvar para cima; inversão térmica (ar frio no solo e quente acima) faz o som curvar para baixo, permitindo ouvir ruídos a grandes distâncias à noite.
3. Intensidade e Energia Acústica:
   - Intensidade I = P / (4*pi*r^2), I é proporcional à amplitude ao quadrado (I ∝ A^2).
   - Ao dobrar a distância, a intensidade sonora cai para 1/4 (lei do inverso do quadrado).
   - Função da orelha e anatomia auditiva (pavilhão auricular e canal auditivo amplificam sensibilidade por fator de 2 a 3 compensando o espalhamento).
4. Interação da onda com objetos:
   - Objetos menores que λ/6 são 'transparentes' ao som.
   - Objetos com dimensões da ordem de λ sofrem difração e espalhamento.
   - Objetos maiores que 5 a 10 comprimentos de onda (λ) refletem o som gerando eco perceptível.
5. Efeito Doppler:
   - f' = f0 * (v ± vo) / (v ∓ vs). Frequência aumenta quando a fonte se aproxima e diminui quando se afasta.
6. Número de Mach (M = v_avião / v_som) e Voo em Aeronaves:
   - Subsônico (M < 1): aeronave viaja mais lenta que o som emitido; frentes de onda se comprimem na frente e se expandem atrás.
   - Transônico (M = 1): aeronave viaja exatamente à velocidade do som; frentes de onda acumulam-se no nariz formando a barreira do som.
   - Supersônico (M > 1): aeronave viaja mais rápido que o som e ultrapassa suas próprias ondas. As ondas esféricas sucessivas formam um envelope cônico tangencial: o Cone de Mach.
   - Ângulo do cone de Mach: sen(μ) = 1 / M (ou μ = arcsen(1/M)). Quanto maior o Mach, mais estreito e afunilado é o cone.
   - Duplo Estrondo Sônico (Double Sonic Boom): ouvem-se dois "booms" distintos no solo, um originado pela frente (proa/nariz) do avião e outro pela cauda (empenagem), formando uma onda de pressão em forma de N (N-wave).
   - Fenômeno de Prandtl-Glauert: nuvem de vapor cônica de condensação que surge quando a queda súbita de pressão e temperatura no escoamento transônico condensa a umidade do ar.

Formate as explicações com clareza, rigor matemático quando necessário, notação didática e tom amigável.`;

      if (systemRole === 'professor') {
        systemInstruction += `\n\nPapel Ativo: Prof. Dr. Marcelo Knobel (IFGW/UNICAMP). Responda com visão acadêmica, incentivando o aluno a pensar na física fundamental, propondo perguntas provocativas e conectando a teoria aos slides do curso F 105.`;
      } else if (systemRole === 'engineer') {
        systemInstruction += `\n\nPapel Ativo: Engenheiro Aeronáutico Especialista em Voo Supersônico (Aerodinâmica de Caças F-18, Concorde e Boom Overture). Destaque os desafios reais de engenharia: arrasto de onda, enflechamento de asa delta, sustentação em altas velocidades, perfil da onda N para reduzir o estampido sônico no solo e materiais resistentes ao aquecimento aerodinâmico.`;
      } else if (systemRole === 'tutor') {
        systemInstruction += `\n\nPapel Ativo: Tutor de Resolução de Exercícios. Resolva os problemas passo a passo com fórmulas explícitas, valores numéricos e conclusões conceituais claras (por exemplo, os exercícios de sapo com eco a 500 Hz, sonar a 20m, apito de trem a 3000 Hz, cálculo de Mach e ângulo de cone).`;
      }

      // Convert messages to Gemini format
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Model selection with resilient fallback order
      const primaryModel = model || 'gemini-3.8-flash';
      const fallbackModels = [primaryModel, 'gemini-3.5-flash', 'gemini-3.1-flash-lite'].filter(
        (v, i, a) => a.indexOf(v) === i
      );

      let response: any = null;
      let usedModel = primaryModel;
      let lastError: any = null;

      for (const m of fallbackModels) {
        try {
          usedModel = m;
          response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction,
              temperature: 0.6,
            },
          });
          if (response?.text) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${m} failed, trying fallback if available:`, err?.message || err);
        }
      }

      if (!response?.text) {
        throw lastError || new Error('Não foi possível obter resposta de nenhum modelo.');
      }

      const replyText = response.text || 'Não foi possível gerar uma resposta. Tente novamente.';
      res.json({ reply: replyText, modelUsed: usedModel });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({
        error: error.message || 'Erro ao processar conversa com o modelo Gemini.',
      });
    }
  });

  // Mount Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
