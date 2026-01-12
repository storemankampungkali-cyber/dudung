
import { Product, Supplier, Transaction, User, StockState } from '../types';
import { INITIAL_USERS } from '../constants';

/**
 * PENTING:
 * Di Vercel, tambahkan Environment Variable: VITE_GAS_URL
 * Isi dengan URL Deployment Google Apps Script Anda.
 */
const BACKEND_URL = (import.meta as any).env?.VITE_GAS_URL || '';

class WarehouseService {
  private async callApi(action: string, method: 'GET' | 'POST', data?: any) {
    if (!BACKEND_URL) {
      console.warn("BACKEND_URL belum dikonfigurasi di Environment Variables!");
      return { error: "API URL Missing" };
    }

    const url = method === 'GET' ? `${BACKEND_URL}?action=${action}` : BACKEND_URL;
    
    try {
      const options: RequestInit = {
        method: method,
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        }
      };

      if (method === 'POST') {
        options.body = JSON.stringify({ action, data });
      }

      const response = await fetch(url, options);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("API Call Failed:", error);
      return { error: "Gagal terhubung ke server" };
    }
  }

  async getAllData() {
    return this.callApi('get_all_data', 'GET');
  }

  async saveTransaction(tx: Omit<Transaction, 'id' | 'waktu'>) {
    return this.callApi('save_transaction', 'POST', tx);
  }

  getUsers(): User[] {
    return INITIAL_USERS;
  }

  calculateStock(transactions: Transaction[] = [], products: Product[] = []): StockState {
    const stock: StockState = {};
    if (!Array.isArray(products)) return stock;
    
    products.forEach(p => {
      if (p && p.kode) stock[p.kode] = 0;
    });

    if (Array.isArray(transactions)) {
      transactions.forEach(tx => {
        if (!tx || !tx.kode) return;
        if (stock[tx.kode] === undefined) stock[tx.kode] = 0;
        
        if (tx.jenis === 'MASUK') stock[tx.kode] += (Number(tx.qty) || 0);
        else if (tx.jenis === 'KELUAR') stock[tx.kode] -= (Number(tx.qty) || 0);
        else if (tx.jenis === 'OPNAME') stock[tx.kode] = (Number(tx.qty) || 0);
      });
    }
    return stock;
  }
}

export const warehouseService = new WarehouseService();
