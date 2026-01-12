
import { Product, Supplier, Transaction, User, StockState } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SUPPLIERS, INITIAL_USERS } from '../constants';

const KEYS = {
  PRODUCTS: 'wareflow_products',
  SUPPLIERS: 'wareflow_suppliers',
  TRANSACTIONS: 'wareflow_transactions',
  USERS: 'wareflow_users',
};

class WarehouseService {
  private getData<T>(key: string, initial: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : initial;
  }

  private setData<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getProducts(): Product[] {
    return this.getData(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  getSuppliers(): Supplier[] {
    return this.getData(KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }

  getTransactions(): Transaction[] {
    return this.getData(KEYS.TRANSACTIONS, []);
  }

  getUsers(): User[] {
    return this.getData(KEYS.USERS, INITIAL_USERS);
  }

  saveTransaction(tx: Omit<Transaction, 'id' | 'waktu'>): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: `TX-${Date.now()}`,
      waktu: new Date().toLocaleTimeString('id-ID'),
    };
    transactions.unshift(newTx);
    this.setData(KEYS.TRANSACTIONS, transactions);
    return newTx;
  }

  getStockState(): StockState {
    const txs = this.getTransactions();
    const stock: StockState = {};
    
    // Initialize with 0 for all known products
    this.getProducts().forEach(p => stock[p.kode] = 0);

    // Apply transactions in chronological order (though stored reverse, let's process carefully)
    // Actually, simple sum works since it's cumulative
    txs.forEach(tx => {
      if (!stock[tx.kode]) stock[tx.kode] = 0;
      if (tx.jenis === 'MASUK') stock[tx.kode] += tx.qty;
      if (tx.jenis === 'KELUAR') stock[tx.kode] -= tx.qty;
      if (tx.jenis === 'OPNAME') stock[tx.kode] = tx.qty; // Opname sets the final value
    });
    
    return stock;
  }

  saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === supplier.id);
    if (index >= 0) {
      suppliers[index] = supplier;
    } else {
      suppliers.push(supplier);
    }
    this.setData(KEYS.SUPPLIERS, suppliers);
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.username === user.username);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setData(KEYS.USERS, users);
  }

  deleteUser(username: string): void {
    const users = this.getUsers().filter(u => u.username !== username);
    this.setData(KEYS.USERS, users);
  }
}

export const warehouseService = new WarehouseService();
