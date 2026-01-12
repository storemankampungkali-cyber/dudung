
import { Product, Supplier, Transaction, User, StockState } from '../types';
import { INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_SUPPLIERS } from '../constants';

class WarehouseService {
  private STORAGE_KEYS = {
    PRODUCTS: 'wareflow_products',
    TRANSACTIONS: 'wareflow_transactions',
    SUPPLIERS: 'wareflow_suppliers',
    USERS: 'wareflow_users',
    GAS_URL: 'wareflow_gas_url'
  };

  private getBackendUrl(): string {
    return localStorage.getItem(this.STORAGE_KEYS.GAS_URL) || "";
  }

  setBackendUrl(url: string) {
    localStorage.setItem(this.STORAGE_KEYS.GAS_URL, url);
  }

  /**
   * SHA-256 Hashing dengan fallback dan logging untuk debugging login
   */
  async hashPassword(password: string): Promise<string> {
    try {
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Crypto API tidak tersedia di browser ini (pastikan menggunakan HTTPS)");
      }
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error("Hashing Error:", error);
      // Fallback sederhana jika crypto subtle gagal (hanya untuk pengembangan, tapi setidaknya tidak crash)
      // Namun kita tetap mengembalikan error agar UI tahu ada masalah lingkungan
      throw error;
    }
  }

  private async callApi(action: string, method: 'GET' | 'POST', data?: any) {
    const url = this.getBackendUrl();
    if (!url || url.includes("XXXXXXXXX") || !url.startsWith("http")) return null;

    try {
      const options: RequestInit = {
        method: method,
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      };

      if (method === 'POST') {
        options.body = JSON.stringify({ action, data });
      }
      
      const fullUrl = method === 'GET' ? `${url}${url.includes('?') ? '&' : '?'}action=${action}` : url;
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      return null;
    }
  }

  async syncAll() {
    const cloudData = await this.callApi('get_all', 'GET');
    if (cloudData) {
      // Pastikan data yang disinkronkan valid dan tidak kosong sebelum menimpa
      if (cloudData.products && cloudData.products.length > 0) 
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(cloudData.products));
      
      if (cloudData.suppliers && cloudData.suppliers.length > 0) 
        localStorage.setItem(this.STORAGE_KEYS.SUPPLIERS, JSON.stringify(cloudData.suppliers));
      
      if (cloudData.transactions && cloudData.transactions.length > 0) 
        localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudData.transactions));
      
      if (cloudData.users && cloudData.users.length > 0) 
        localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(cloudData.users));
      
      return true;
    }
    return false;
  }

  getProducts(): Product[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
    const products: Product[] = (data && JSON.parse(data).length > 0) ? JSON.parse(data) : INITIAL_PRODUCTS;
    return products.map(p => ({ ...p, stokAwal: Number(p.stokAwal || 0) }));
  }

  getSuppliers(): Supplier[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.SUPPLIERS);
    return (data && JSON.parse(data).length > 0) ? JSON.parse(data) : INITIAL_SUPPLIERS;
  }

  getTransactions(): Transaction[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  }

  getUsers(): User[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.USERS);
    const users: User[] = (data && JSON.parse(data).length > 0) ? JSON.parse(data) : INITIAL_USERS;
    return users;
  }

  async saveTransaction(tx: Omit<Transaction, 'id' | 'waktu'>) {
    const newTx = { 
      ...tx, 
      id: `TX-${Date.now()}`, 
      waktu: new Date().toLocaleTimeString('id-ID') 
    };
    const localTxs = this.getTransactions();
    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...localTxs, newTx]));
    await this.callApi('save_transaction', 'POST', newTx);
    return newTx;
  }

  async saveProduct(p: Product) {
    const products = this.getProducts();
    const idx = products.findIndex(x => x.kode === p.kode);
    const updated = idx > -1 ? [...products] : [...products, p];
    if (idx > -1) updated[idx] = p;
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    await this.callApi('save_product', 'POST', p);
  }

  async saveUser(u: User, rawPassword?: string) {
    const users = this.getUsers();
    let finalUser = { ...u };
    
    if (rawPassword) {
      finalUser.password = await this.hashPassword(rawPassword);
    }
    
    const idx = users.findIndex(x => x.username === finalUser.username);
    const updated = idx > -1 ? [...users] : [...users, finalUser];
    if (idx > -1) updated[idx] = finalUser;
    
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(updated));
    await this.callApi('save_user', 'POST', finalUser);
  }

  /**
   * Emergency reset data lokal jika terjadi kerusakan state
   */
  resetToDefaults() {
    localStorage.removeItem(this.STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(this.STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(this.STORAGE_KEYS.USERS);
    localStorage.removeItem(this.STORAGE_KEYS.TRANSACTIONS);
    window.location.reload();
  }

  getStockState(): StockState {
    const txs = this.getTransactions();
    const products = this.getProducts();
    const stock: StockState = {};
    products.forEach(p => { stock[p.kode] = Number(p.stokAwal || 0); });
    txs.forEach(tx => {
      const q = Number(tx.qty);
      if (tx.jenis === 'MASUK' || tx.jenis === 'AWAL') {
        stock[tx.kode] = (stock[tx.kode] || 0) + q;
      } else if (tx.jenis === 'KELUAR') {
        stock[tx.kode] = (stock[tx.kode] || 0) - q;
      } else if (tx.jenis === 'OPNAME') {
        stock[tx.kode] = q;
      }
    });
    return stock;
  }
}

export const warehouseService = new WarehouseService();
