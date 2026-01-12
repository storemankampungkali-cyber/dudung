
import { GoogleGenAI } from "@google/genai";
import { Transaction, Product } from "../types";

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class GeminiService {
  /**
   * Menghasilkan wawasan stok menggunakan Gemini.
   */
  async getStockInsights(products: Product[], stock: Record<string, number>, transactions: Transaction[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const recentTxs = transactions.slice(-10).map(t => `${t.tgl} ${t.jenis} ${t.nama} ${t.qty} ${t.satuan}`).join('\n');
      const stockSummary = products.slice(0, 10).map(p => `${p.nama}: Current=${stock[p.kode] || 0}, Min=${p.minStok}`).join('\n');

      const prompt = `
        Analisis data gudang ini:
        STOK: ${stockSummary}
        TRANSAKSI TERBARU: ${recentTxs}
        Berikan ringkasan status, item kritis, dan saran tindakan dalam Bahasa Indonesia yang singkat dan profesional.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Insights Error:", error);
      return "Wawasan AI tidak tersedia saat ini.";
    }
  }

  /**
   * Chat umum dengan Gemini yang mendukung riwayat percakapan.
   */
  async chat(message: string, history: ChatHistoryItem[] = []) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: "Anda adalah Wareflow AI, asisten manajemen gudang yang cerdas dan proaktif. Anda membantu pengguna dalam mengelola stok, menganalisis data logistik, dan memberikan solusi administratif. Jawablah dengan nada profesional, ramah, dan solutif dalam Bahasa Indonesia. Anda juga bisa berdiskusi topik umum di luar gudang jika ditanya.",
          temperature: 0.75,
          topP: 0.95,
        }
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Maaf, sistem AI sedang sibuk. Silakan coba lagi dalam beberapa saat.";
    }
  }
}

export const geminiService = new GeminiService();
