
import { GoogleGenAI } from "@google/genai";
import { Transaction, Product } from "../types";

export class GeminiService {
  /**
   * Generates inventory insights using Gemini.
   * Following guidelines:
   * - Uses GoogleGenAI with named apiKey from process.env.API_KEY.
   * - Uses gemini-3-flash-preview for text analysis.
   * - Directly uses ai.models.generateContent.
   * - Accesses response.text property.
   */
  async getStockInsights(products: Product[], stock: Record<string, number>, transactions: Transaction[]) {
    // Initialize right before usage to ensure up-to-date environment variables
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

      // Correct way to call generateContent according to guidelines
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Directly access .text property as per guidelines
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "AI Insight currently unavailable.";
    }
  }
}

export const geminiService = new GeminiService();
