import { GoogleGenerativeAI } from "@google/generative-ai";
import { DailyMetric, SwimTime } from "../types";

// O Vite injeta variáveis VITE_ automaticamente no import.meta.env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const getCoachingInsight = async (
  metrics: DailyMetric[],
  times: SwimTime[]
): Promise<string> => {
  const recentMetrics = metrics.slice(-7);
  const recentTimes = times.slice(-5);

  const prompt = `
    Atue como um treinador de natação de elite.
    Analise estes dados:
    Métricas: ${JSON.stringify(recentMetrics)}
    Tempos: ${JSON.stringify(recentTimes)}
    Forneça um resumo curto de recuperação, performance e recomendação técnica em Português.
  `;

  try {
    // Usando o modelo 1.5 Flash que é estável e rápido
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Sem insights no momento.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Erro ao processar dados com a IA. Verifique a conexão.";
  }
};

export const generateRaceStrategy = async (event: string, targetTime: string): Promise<string> => {
  const prompt = `Crie uma estratégia de prova para ${event} com tempo alvo de ${targetTime}. Responda em Português.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Estratégia indisponível.";
  } catch (error) {
    console.error("Erro Gemini Strategy:", error);
    return "Erro ao gerar estratégia.";
  }
};