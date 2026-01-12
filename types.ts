
export type Role = 'ADMIN' | 'STAFF' | 'VIEWER';

export interface User {
  username: string;
  password?: string; // Hashed password
  role: Role;
  active: boolean;
  lastLogin?: string;
}

export interface Product {
  kode: string;
  nama: string;
  satuanDefault: string;
  satuanAlt1?: string;
  konversiAlt1?: number;
  satuanAlt2?: string;
  konversiAlt2?: number;
  minStok: number;
  stokAwal: number;
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
  jenis: 'MASUK' | 'KELUAR' | 'OPNAME' | 'AWAL';
  nama: string;
  kode: string;
  qty: number;
  satuan: string;
  displayQty?: number;
  keterangan: string;
  user: string;
  supplier?: string;
  noSJ?: string;
  noPO?: string;
}

export interface StockState {
  [kode: string]: number;
}
