
export type Role = 'ADMIN' | 'STAFF' | 'VIEWER';

export interface User {
  username: string;
  role: Role;
  active: boolean;
  lastLogin?: string;
}

export interface Product {
  kode: string;
  nama: string;
  satuanDefault: string;
  satuanAlt1?: string;
  konversiAlt1?: number; // How many default units in 1 Alt1 (e.g. 12 PCS in 1 LUSIN)
  satuanAlt2?: string;
  konversiAlt2?: number;
  minStok: number;
}

export interface Supplier {
  id: string;
  nama: string;
  alamat?: string;
  telp?: string;
  email?: string;
  pic?: string;
  ket?: string;
}

export interface Transaction {
  id: string;
  tgl: string;
  waktu: string;
  jenis: 'MASUK' | 'KELUAR' | 'OPNAME';
  nama: string;
  kode: string;
  qty: number; // Stored as base unit quantity
  satuan: string; // The unit chosen during transaction
  displayQty?: number; // The quantity in the chosen unit
  keterangan: string;
  user: string;
  supplier?: string;
  noSJ?: string;
  noPO?: string;
}

export interface StockState {
  [kode: string]: number;
}
