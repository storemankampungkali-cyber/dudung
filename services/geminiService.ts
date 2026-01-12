
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
      const recentTxs = transactions.slice(-10).map(t => `${t.tgl} ${t.jenis} ${t.nama} ${t.qty} ${t.satuan}`).join('\n');
      const stockSummary = products.slice(0, 10).map(p => `${p.nama}: Current=${stock[p.kode] || 0}, Min=${p.minStok}`).join('\n');

      const prompt = `
        Tugas: Analisis inventaris gudang berikut:
        RINGKASAN STOK:
        ${stockSummary}

        TRANSAKSI TERBARU:
        ${recentTxs}

        Berikan: 1. Status ringkas. 2. Item kritis yang harus dipesan. 3. Saran tindakan cepat. Gunakan Bahasa Indonesia yang sangat profesional dan to-the-point.
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
   * General purpose chat with Gemini with history support.
   */
  async chat(message: string, history: ChatHistoryItem[] = []) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      // Menggunakan model terbaru gemini-3-flash-preview
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: "Anda adalah asisten cerdas Wareflow. Anda memiliki akses ke data manajemen gudang dan pengetahuan umum yang luas. Tugas Anda adalah membantu pengguna mengelola stok, menjawab pertanyaan seputar logistik, atau berdiskusi hal umum lainnya. Berikan jawaban yang informatif, akurat, dan gunakan Bahasa Indonesia yang alami namun tetap profesional. Jangan ragu untuk memberikan saran proaktif jika relevan dengan efisiensi operasional.",
          temperature: 0.8,
          topP: 0.9,
        }
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Maaf, asisten AI sedang mengalami gangguan koneksi. Silakan coba lagi sebentar lagi.";
    }
  }
}

export const geminiService = new GeminiService();
