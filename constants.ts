
import { Product, Supplier, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { 
    kode: 'BRG001', 
    nama: 'Baut M8 x 20mm', 
    satuanDefault: 'PCS', 
    satuanAlt1: 'BOX', 
    konversiAlt1: 100,
    minStok: 100,
    // Fix: Added missing stokAwal property
    stokAwal: 0 
  },
  { 
    kode: 'BRG002', 
    nama: 'Kabel NYA 1.5mm Hitam', 
    satuanDefault: 'METER', 
    satuanAlt1: 'ROLL', 
    konversiAlt1: 50,
    minStok: 50,
    // Fix: Added missing stokAwal property
    stokAwal: 0 
  },
  { 
    kode: 'BRG003', 
    nama: 'Lampu LED 9W Putih', 
    satuanDefault: 'PCS', 
    satuanAlt1: 'DUS', 
    konversiAlt1: 24,
    minStok: 20,
    // Fix: Added missing stokAwal property
    stokAwal: 0 
  },
  { 
    kode: 'BRG004', 
    nama: 'Pipa PVC 1/2 Inch', 
    satuanDefault: 'BATANG', 
    minStok: 15,
    // Fix: Added missing stokAwal property
    stokAwal: 0 
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'SUP001', nama: 'PT Sinar Jaya', alamat: 'Jakarta', telp: '021-123456', pic: 'Budi' },
  { id: 'SUP002', nama: 'CV Maju Bersama', alamat: 'Surabaya', telp: '031-654321', pic: 'Ani' },
];

// Default hashed password for 'admin123' (SHA-256)
const DEFAULT_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa8228268450d7021";

export const INITIAL_USERS: User[] = [
  { username: 'admin', password: DEFAULT_HASH, role: 'ADMIN', active: true, lastLogin: '2023-10-27 10:00' },
  { username: 'staff', password: DEFAULT_HASH, role: 'STAFF', active: true, lastLogin: '2023-10-27 09:30' },
  { username: 'viewer', password: DEFAULT_HASH, role: 'VIEWER', active: true, lastLogin: '2023-10-26 15:00' },
];

export const TAB_CONFIG: Record<string, { label: string; icon: string; roles: string[] }> = {
  dashboard: { label: 'Dashboard', icon: 'LayoutDashboard', roles: ['ADMIN', 'STAFF', 'VIEWER'] },
  masuk: { label: 'Masuk', icon: 'PackagePlus', roles: ['ADMIN', 'STAFF'] },
  keluar: { label: 'Keluar', icon: 'PackageMinus', roles: ['ADMIN', 'STAFF'] },
  opname: { label: 'Stock Opname', icon: 'ClipboardCheck', roles: ['ADMIN', 'STAFF'] },
  riwayat: { label: 'Riwayat', icon: 'History', roles: ['ADMIN', 'STAFF', 'VIEWER'] },
  supplier: { label: 'Supplier', icon: 'Truck', roles: ['ADMIN', 'STAFF'] },
  chat: { label: 'AI Chat', icon: 'MessageCircle', roles: ['ADMIN', 'STAFF', 'VIEWER'] },
  admin: { label: 'Admin', icon: 'ShieldCheck', roles: ['ADMIN'] },
};
