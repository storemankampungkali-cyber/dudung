
import { GoogleGenAI } from "@google/genai";
import { Transaction, Product } from "../types";

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class GeminiService {
  /**
   * Generates inventory insights using Gemini.
   */
  async getStockInsights(products: Product[], stock: Record<string, number>, transactions: Transaction[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const recentTxs = transactions.slice(0, 15).map(t => `${t.tgl} ${t.jenis} ${t.nama} ${t.qty} ${t.satuan}`).join('\n');
      const stockSummary = products.slice(0, 10).map(p => `${p.nama}: Current=${stock[p.kode] || 0}, Min=${p.minStok}`).join('\n');

      const prompt = `
        Analyze this inventory:
        STOCK: ${stockSummary}
        RECENT: ${recentTxs}
        Provide: 1. Status summary. 2. Critical items. 3. Reorder suggestions. Brief and professional.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "AI Insight currently unavailable.";
    }
  }

  /**
   * General purpose chat with Gemini with history support.
   */
  async chat(message: string, history: ChatHistoryItem[] = []) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: history,
        config: {
          systemInstruction: "You are a versatile and helpful AI assistant integrated into Wareflow. While you can help with warehouse and logistics queries, you are a general-purpose assistant capable of discussing any topic, providing creative advice, solving problems, and engaging in friendly conversation. Be professional yet approachable.",
        },
      });

      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Maaf, terjadi kesalahan saat menghubungi AI.";
    }
  }
}

export const geminiService = new GeminiService();
