
import { Product, Supplier, Transaction, User, StockState } from '../types';
import { INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_SUPPLIERS } from '../constants';

// GANTI URL INI dengan URL Web App dari Google Apps Script Anda setelah di-deploy
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbz_XXXXXXXXX/exec"; 

class WarehouseService {
  private STORAGE_KEYS = {
    PRODUCTS: 'wareflow_products',
    TRANSACTIONS: 'wareflow_transactions',
    SUPPLIERS: 'wareflow_suppliers',
    USERS: 'wareflow_users'
  };

  private async callApi(action: string, method: 'GET' | 'POST', data?: any) {
    // Jika URL masih default atau kosong, jangan panggil API
    if (!BACKEND_URL || BACKEND_URL.includes("XXXXXXXXX")) return null;

    try {
      const options: RequestInit = {
        method: method,
        mode: 'cors',
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8' 
        }
      };

      if (method === 'POST') {
        options.body = JSON.stringify({ action, data });
      }
      
      const url = method === 'GET' ? `${BACKEND_URL}?action=${action}` : BACKEND_URL;
      const response = await fetch(url, options);
      
      if (!response.ok) throw new Error("Network Response Not OK");
      return await response.json();
    } catch (error) {
      console.warn(`Backend Sync Failed (${action}):`, error);
      return null;
    }
  }

  /**
   * Mengambil data terbaru dari Spreadsheet dan menyimpannya ke LocalStorage
   */
  async syncAll() {
    const cloudData = await this.callApi('get_all', 'GET');
    if (cloudData) {
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
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  }

  getSuppliers(): Supplier[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.SUPPLIERS);
    return data ? JSON.parse(data) : INITIAL_SUPPLIERS;
  }

  getTransactions(): Transaction[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  }

  getUsers(): User[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  }

  async saveTransaction(tx: Omit<Transaction, 'id' | 'waktu'>) {
    const newTx = { 
      ...tx, 
      id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
      waktu: new Date().toLocaleTimeString('id-ID') 
    };
    
    // Update Lokal
    const localTxs = this.getTransactions();
    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...localTxs, newTx]));
    
    // Push ke Cloud
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

  async deleteProduct(kode: string) {
    const updated = this.getProducts().filter(p => p.kode !== kode);
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    await this.callApi('delete_product', 'POST', { kode });
  }

  async saveSupplier(s: Supplier) {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex(x => x.id === s.id);
    const updated = idx > -1 ? [...suppliers] : [...suppliers, s];
    if (idx > -1) updated[idx] = s;

    localStorage.setItem(this.STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
    await this.callApi('save_supplier', 'POST', s);
  }

  async deleteSupplier(id: string) {
    const updated = this.getSuppliers().filter(s => s.id !== id);
    localStorage.setItem(this.STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
    await this.callApi('delete_supplier', 'POST', { id });
  }

  async saveUser(u: User) {
    const users = this.getUsers();
    const idx = users.findIndex(x => x.username === u.username);
    const updated = idx > -1 ? [...users] : [...users, u];
    if (idx > -1) updated[idx] = u;

    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(updated));
    await this.callApi('save_user', 'POST', u);
  }

  async deleteUser(username: string) {
    const updated = this.getUsers().filter(u => u.username !== username);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(updated));
    await this.callApi('delete_user', 'POST', { username });
  }

  getStockState(): StockState {
    const txs = this.getTransactions();
    const stock: StockState = {};
    
    // Inisialisasi stok 0 untuk semua produk
    this.getProducts().forEach(p => { stock[p.kode] = 0; });
    
    txs.forEach(tx => {
      const q = Number(tx.qty);
      if (tx.jenis === 'MASUK') stock[tx.kode] = (stock[tx.kode] || 0) + q;
      else if (tx.jenis === 'KELUAR') stock[tx.kode] = (stock[tx.kode] || 0) - q;
      else if (tx.jenis === 'OPNAME') stock[tx.kode] = q;
    });
    return stock;
  }
}

export const warehouseService = new WarehouseService();
