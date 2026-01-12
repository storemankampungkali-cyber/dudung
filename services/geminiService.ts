
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
        Tugas: Analisis inventaris gudang berikut:
        RINGKASAN STOK:
        ${stockSummary}

        TRANSAKSI TERBARU:
        ${recentTxs}

        Berikan: 1. Status ringkas. 2. Item kritis yang harus dipesan. 3. Saran tindakan cepat. Gunakan Bahasa Indonesia yang sangat profesional dan padat.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Wawasan AI saat ini tidak tersedia.";
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
          ...history.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: "Anda adalah Wareflow AI, asisten manajemen gudang profesional. Anda cerdas, responsif, dan mampu memberikan solusi logistik yang akurat. Anda berbicara dalam Bahasa Indonesia yang sopan namun efisien. Anda dapat membantu menganalisis stok, memberikan tips manajemen gudang, atau berdiskusi topik umum dengan cerdas.",
          temperature: 0.7,
        }
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Maaf, saya sedang mengalami kendala teknis. Mohon ulangi pesan Anda.";
    }
  }
}

export const geminiService = new GeminiService();
