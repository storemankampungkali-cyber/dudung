
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
   * Simple SHA-256 hashing for passwords
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async callApi(action: string, method: 'GET' | 'POST', data?: any) {
    const url = this.getBackendUrl();
    if (!url || url.includes("XXXXXXXXX")) return null;

    try {
      const options: RequestInit = {
        method: method,
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      };

      if (method === 'POST') {
        options.body = JSON.stringify({ action, data });
      }
      
      const fullUrl = method === 'GET' ? `${url}?action=${action}` : url;
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) throw new Error("Network Response Not OK");
      return await response.json();
    } catch (error) {
      console.warn(`Sync failed for ${action}:`, error);
      return null;
    }
  }

  async syncAll() {
    const cloudData = await this.callApi('get_all', 'GET');
    if (cloudData) {
      if (cloudData.products) localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(cloudData.products));
      if (cloudData.suppliers) localStorage.setItem(this.STORAGE_KEYS.SUPPLIERS, JSON.stringify(cloudData.suppliers));
      if (cloudData.transactions) localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudData.transactions));
      if (cloudData.users) localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(cloudData.users));
      return true;
    }
    return false;
  }

  getProducts(): Product[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
    const products: Product[] = data ? JSON.parse(data) : INITIAL_PRODUCTS;
    // Ensure stokAwal is a number
    return products.map(p => ({ ...p, stokAwal: Number(p.stokAwal || 0) }));
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

  async deleteUser(username: string) {
    const updated = this.getUsers().filter(u => u.username !== username);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(updated));
    await this.callApi('delete_user', 'POST', { username });
  }

  getStockState(): StockState {
    const txs = this.getTransactions();
    const products = this.getProducts();
    const stock: StockState = {};

    // Inisialisasi stok dengan nilai stokAwal dari metadata produk
    products.forEach(p => { 
      stock[p.kode] = Number(p.stokAwal || 0); 
    });

    txs.forEach(tx => {
      const q = Number(tx.qty);
      // Jenis 'AWAL' di transaksi tetap dihitung untuk backward compatibility, 
      // namun sekarang stok awal utama diambil dari properti produk.
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
