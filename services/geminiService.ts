import { GoogleGenAI, Type } from "@google/genai";
import { DailyMetric, SwimTime } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCoachingInsight = async (
  metrics: DailyMetric[],
  times: SwimTime[]
): Promise<string> => {
  // Prepare a summary of the last 7 days
  const recentMetrics = metrics.slice(-7);
  const recentTimes = times.slice(-5);

  const prompt = `
    Atue como um treinador de natação de elite de nível olímpico.
    Analise os seguintes dados recentes do seu atleta:

    Métricas Diárias (Últimos 7 dias):
    ${JSON.stringify(recentMetrics, null, 2)}

    Tempos Recentes de Natação:
    ${JSON.stringify(recentTimes, null, 2)}

    Forneça um resumo curto e direto (máximo 3 parágrafos) cobrindo:
    1. Estado atual de recuperação e fadiga (baseado em sono, FC repouso, PSE).
    2. Análise de performance recente (melhora ou piora nos tempos).
    3. Recomendação específica para a próxima semana de treinos (focar em descanso, aumentar carga, técnica, etc).
    
    Use tom profissional e motivador. Responda em Português.
  `;

  try {
    // Select 'gemini-3-flash-preview' for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property to access generated content
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Erro ao processar dados com a IA. Verifique sua conexão ou chave de API.";
  }
};

export const generateRaceStrategy = async (event: string, targetTime: string): Promise<string> => {
  const prompt = `
    Crie uma estratégia de prova detalhada para um nadador de elite.
    Prova: ${event}
    Tempo Alvo: ${targetTime}
  `;

  try {
    // Select 'gemini-3-flash-preview' and specify responseSchema for structured JSON
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            splits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  distance: {
                    type: Type.NUMBER,
                    description: 'Distance for this split in meters.'
                  },
                  time: {
                    type: Type.STRING,
                    description: 'Target time for this split.'
                  },
                  instruction: {
                    type: Type.STRING,
                    description: 'Tactical instruction for this part of the race.'
                  }
                },
                required: ["distance", "time", "instruction"],
              },
            },
            focusPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'Key technical or mental focus points for the race.',
            },
          },
          required: ["splits", "focusPoints"],
        },
      },
    });
    // Use .text property to access generated content
    return response.text || "";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "";
  }
};
