
import { GoogleGenAI } from "@google/genai";
import { Transaction, Product } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getStockInsights(products: Product[], stock: Record<string, number>, transactions: Transaction[]) {
    try {
      const recentTxs = transactions.slice(0, 20).map(t => `${t.tgl} ${t.jenis} ${t.nama} ${t.qty} ${t.satuan}`).join('\n');
      const stockSummary = products.map(p => `${p.nama} (${p.kode}): Current=${stock[p.kode]}, Min=${p.minStok}`).join('\n');

      const prompt = `
        You are an expert Warehouse AI Assistant. Analyze the following inventory data:
        
        STOCK LEVELS:
        ${stockSummary}

        RECENT TRANSACTIONS:
        ${recentTxs}

        Based on the data, provide:
        1. A quick summary of the warehouse status.
        2. Identify items at critical risk of stockout.
        3. Suggest items that may need reordering based on recent flow.
        Keep it brief and professional.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to retrieve AI insights at this moment.";
    }
  }
}

export const geminiService = new GeminiService();
