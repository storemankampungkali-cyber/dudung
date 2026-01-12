
import { GoogleGenAI } from "@google/genai";
import { Transaction, Product } from "../types";

export class GeminiService {
  private getAI() {
    // Menggunakan try-catch untuk menghindari crash jika process.env tidak ditemukan di browser
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return null;
      return new GoogleGenAI({ apiKey });
    } catch (e) {
      return null;
    }
  }

  async getStockInsights(products: Product[], stock: Record<string, number>, transactions: Transaction[]) {
    const ai = this.getAI();
    if (!ai) return "AI Analyst is offline. Please check API Key configuration.";

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
}

export const geminiService = new GeminiService();
