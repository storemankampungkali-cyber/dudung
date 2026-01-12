
import { Product, Supplier, Transaction, User, StockState } from '../types';
import { INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_SUPPLIERS } from '../constants';

const BACKEND_URL = (import.meta as any).env?.VITE_GAS_URL || '';

class WarehouseService {
  private STORAGE_KEYS = {
    PRODUCTS: 'wareflow_products',
    TRANSACTIONS: 'wareflow_transactions',
    SUPPLIERS: 'wareflow_suppliers',
    USERS: 'wareflow_users'
  };

  private async callApi(action: string, method: 'GET' | 'POST', data?: any) {
    if (!BACKEND_URL) return { error: "Offline Mode" };
    try {
      const options: RequestInit = {
        method: method,
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      };
      if (method === 'POST') options.body = JSON.stringify({ action, data });
      const response = await fetch(method === 'GET' ? `${BACKEND_URL}?action=${action}` : BACKEND_URL, options);
      return await response.json();
    } catch (error) {
      return { error: "Connection failed" };
    }
  }

  // GETTERS
  getProducts(): Product[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PRODUCTS) || JSON.stringify(INITIAL_PRODUCTS));
  }

  getSuppliers(): Supplier[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SUPPLIERS) || JSON.stringify(INITIAL_SUPPLIERS));
  }

  getTransactions(): Transaction[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS) || '[]');
  }

  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS) || JSON.stringify(INITIAL_USERS));
  }

  // SETTERS
  async saveTransaction(tx: Omit<Transaction, 'id' | 'waktu'>) {
    const newTx = { ...tx, id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, waktu: new Date().toLocaleTimeString() };
    const localTxs = this.getTransactions();
    localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify([...localTxs, newTx]));
    return await this.callApi('save_transaction', 'POST', newTx);
  }

  saveProduct(p: Product) {
    const products = this.getProducts();
    const exists = products.findIndex(x => x.kode === p.kode);
    let updated;
    if (exists > -1) {
      updated = [...products];
      updated[exists] = p;
    } else {
      updated = [...products, p];
    }
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  }

  deleteProduct(kode: string) {
    const products = this.getProducts();
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products.filter(p => p.kode !== kode)));
  }

  saveSupplier(s: Supplier) {
    const suppliers = this.getSuppliers();
    const exists = suppliers.findIndex(x => x.id === s.id);
    let updated;
    if (exists > -1) {
      updated = [...suppliers];
      updated[exists] = s;
    } else {
      updated = [...suppliers, s];
    }
    localStorage.setItem(this.STORAGE_KEYS.SUPPLIERS, JSON.stringify(updated));
  }

  deleteSupplier(id: string) {
    const suppliers = this.getSuppliers();
    localStorage.setItem(this.STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers.filter(s => s.id !== id)));
  }

  saveUser(u: User) {
    const users = this.getUsers();
    const exists = users.findIndex(x => x.username === u.username);
    let updated;
    if (exists > -1) {
      updated = [...users];
      updated[exists] = u;
    } else {
      updated = [...users, u];
    }
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(updated));
  }

  deleteUser(username: string) {
    const users = this.getUsers();
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users.filter(u => u.username !== username)));
  }

  getStockState(): StockState {
    const txs = this.getTransactions();
    const stock: StockState = {};
    this.getProducts().forEach(p => { stock[p.kode] = 0; });
    
    txs.forEach(tx => {
      if (tx.jenis === 'MASUK') stock[tx.kode] = (stock[tx.kode] || 0) + tx.qty;
      else if (tx.jenis === 'KELUAR') stock[tx.kode] = (stock[tx.kode] || 0) - tx.qty;
      else if (tx.jenis === 'OPNAME') stock[tx.kode] = tx.qty;
    });
    return stock;
  }
}

export const warehouseService = new WarehouseService();
