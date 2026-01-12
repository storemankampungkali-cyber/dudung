
import { Product, Supplier, Transaction, User, StockState } from '../types';
import { INITIAL_USERS } from '../constants';

// GANTI URL INI dengan URL Web App Google Apps Script Anda setelah di-deploy
const BACKEND_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

class WarehouseService {
  private async callApi(action: string, method: 'GET' | 'POST', data?: any) {
    const url = method === 'GET' ? `${BACKEND_URL}?action=${action}` : BACKEND_URL;
    const options: RequestInit = {
      method: method,
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS often requires text/plain to avoid CORS preflight
      }
    };

    if (method === 'POST') {
      options.body = JSON.stringify({ action, data });
    }

    const response = await fetch(url, options);
    return response.json();
  }

  async getAllData() {
    return this.callApi('get_all_data', 'GET');
  }

  async saveTransaction(tx: Omit<Transaction, 'id' | 'waktu'>) {
    return this.callApi('save_transaction', 'POST', tx);
  }

  async saveSupplier(supplier: Supplier) {
    return this.callApi('save_supplier', 'POST', supplier);
  }

  async saveUser(user: User) {
    return this.callApi('save_user', 'POST', user);
  }

  // getUsers provides access to defined system users
  getUsers(): User[] {
    return INITIAL_USERS;
  }

  // Stock calculation logic tetap bisa di frontend untuk kecepatan UI, 
  // tapi datanya diambil dari transaksi yang ditarik dari backend.
  calculateStock(transactions: Transaction[], products: Product[]): StockState {
    const stock: StockState = {};
    products.forEach(p => stock[p.kode] = 0);
    transactions.forEach(tx => {
      if (!stock[tx.kode]) stock[tx.kode] = 0;
      if (tx.jenis === 'MASUK') stock[tx.kode] += tx.qty;
      if (tx.jenis === 'KELUAR') stock[tx.kode] -= tx.qty;
      if (tx.jenis === 'OPNAME') stock[tx.kode] = tx.qty;
    });
    return stock;
  }
}

export const warehouseService = new WarehouseService();
