
import { GoogleGenAI } from "@google/genai";
import { Transaction, Product } from "../types";

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
   * General purpose chat with Gemini.
   */
  async chat(message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: "You are a helpful AI assistant for a warehouse management application called Wareflow. You can answer general questions as well as provide advice on logistics if asked, but you are generally versatile.",
        },
      });

      // Simple implementation: send the current message
      // In a more complex app, we'd pass the full history
      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Maaf, terjadi kesalahan saat menghubungi AI.";
    }
  }
}

export const geminiService = new GeminiService();
