
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, 
  ShieldCheck, LogOut, Menu, User as UserIcon, Bell, Search, RefreshCw, Plus, 
  Trash2, Save, X, FileDown, CheckCircle2, Info, XCircle, Loader2, AlertTriangle, 
  ChevronRight, Database, TrendingUp, Activity, Box
} from 'lucide-react';
import { Role, User, Transaction, Product, Supplier, StockState } from './types';
import { TAB_CONFIG } from './constants';
import { warehouseService } from './services/warehouseService';
import { geminiService } from './services/geminiService';

// --- Shared Components ---

const ToastItem = ({ toast, onRemove }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons: any = {
    success: <CheckCircle2 size={18} className="text-emerald-400" />,
    error: <XCircle size={18} className="text-rose-400" />,
    info: <Info size={18} className="text-blue-400" />,
  };

  return (
    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right-10 min-w-[300px]">
      {icons[toast.type] || icons.info}
      <span className="text-sm font-bold text-white flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="text-slate-500 hover:text-white transition-colors"><X size={16}/></button>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }: any) => {
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20",
    ghost: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10",
    outline: "bg-transparent border border-white/20 hover:border-cyan-400 text-slate-200"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = React.forwardRef(({ label, ...props }: any, ref: any) => (
  <div className="w-full">
    {label && <label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 ml-1 tracking-[0.1em]">{label}</label>}
    <input ref={ref} {...props} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all" />
  </div>
));

const Card = ({ children, title, icon: Icon, className = "", subtitle = "" }: any) => (
  <div className={`glass-panel p-6 rounded-[2rem] flex flex-col gap-4 border border-white/10 ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            {Icon && <Icon size={20} />}
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase">{subtitle}</p>}
          </div>
        </div>
      </div>
    )}
    <div className="flex-1">{children}</div>
  </div>
);

const Badge = ({ children, variant = 'info' }: any) => {
  const variants: any = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${variants[variant]}`}>{children}</span>;
};

// --- Autocomplete Component ---

const ProductAutocomplete = React.forwardRef(({ products, stock, onSelect, placeholder = "Cari Produk..." }: any, ref: any) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return [];
    const lower = query.toLowerCase();
    return products.filter((p: Product) => p.nama.toLowerCase().includes(lower) || p.kode.toLowerCase().includes(lower)).slice(0, 8);
  }, [query, products]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className="relative flex-1" ref={containerRef}>
      <Input label="Cari Barang" placeholder={placeholder} value={query} onFocus={() => setIsOpen(true)} onChange={(e: any) => { setQuery(e.target.value); setIsOpen(true); }} ref={ref} />
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1425] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100] backdrop-blur-xl">
          {filtered.map((p: Product) => (
            <div key={p.kode} className="p-4 cursor-pointer hover:bg-white/5 border-b border-white/5 last:border-0 flex justify-between items-center" 
              onClick={() => { onSelect(p); setQuery(''); setIsOpen(false); }}>
              <div>
                <p className="text-sm font-bold text-white">{p.nama}</p>
                <p className="text-[10px] font-mono text-slate-500 uppercase">{p.kode}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-cyan-400">{stock ? stock[p.kode] || 0 : ''}</p>
                <p className="text-[8px] text-slate-500 uppercase">{p.satuanDefault}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// --- Main Views ---

/**
 * Interface for DashboardView props to resolve type unknown issues
 */
interface DashboardViewProps {
  stock: StockState;
  products: Product[];
  transactions: Transaction[];
  insights: string;
  refresh: () => void;
}

/**
 * Fixed Error: Type 'unknown' is not assignable to type 'ReactNode'
 * By explicitly typing the props of DashboardView.
 */
function DashboardView({ stock, products, transactions, insights, refresh }: DashboardViewProps) {
  const lowStock = products.filter((p: Product) => (stock[p.kode] || 0) < p.minStok);
  const totalItems = Object.values(stock).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Unit" icon={Box} subtitle="Volume Gudang"><div className="text-3xl font-black">{totalItems} <span className="text-[10px] opacity-40 font-bold uppercase">Unit</span></div></Card>
        <Card title="Stok Kritis" icon={AlertTriangle} subtitle="Di Bawah Limit"><div className="text-3xl font-black text-rose-500">{lowStock.length} <span className="text-[10px] opacity-40 font-bold uppercase">SKU</span></div></Card>
        <Card title="Aktivitas" icon={Activity} subtitle="Total Transaksi"><div className="text-3xl font-black text-blue-500">{transactions.length} <span className="text-[10px] opacity-40 font-bold uppercase">TX</span></div></Card>
        <Card title="Status AI" icon={TrendingUp} subtitle="Audit Analyst"><Badge variant="success">Online</Badge></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="AI Inventory Insights" icon={Bell} className="border-blue-500/20 bg-blue-500/[0.02]">
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap italic opacity-90">{insights}</p>
          </Card>
          <Card title="Peringatan Restock" icon={AlertTriangle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                  <tr><th className="p-3">Nama Barang</th><th className="p-3 text-right">Stok</th><th className="p-3 text-right">Min</th><th className="p-3 text-center">Aksi</th></tr>
                </thead>
                <tbody>
                  {lowStock.map((p: Product) => (
                    <tr key={p.kode} className="border-b border-white/5 hover:bg-rose-500/[0.02]">
                      <td className="p-3 font-bold">{p.nama}</td>
                      <td className="p-3 text-right font-black text-rose-500">{stock[p.kode] || 0}</td>
                      <td className="p-3 text-right opacity-40">{p.minStok}</td>
                      <td className="p-3 text-center"><Badge variant="danger">Order</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <Card title="Log Terakhir" icon={History}>
          <div className="space-y-3">
            {transactions.slice(-6).reverse().map((t: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.jenis === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {t.jenis === 'MASUK' ? <PackagePlus size={16}/> : <PackageMinus size={16}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{t.nama}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-black">{t.jenis} • {t.displayQty || t.qty} {t.satuan}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TransactionView({ type, products, suppliers, stock, user, refresh, toast }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ tgl: new Date().toISOString().split('T')[0], noSJ: '', supplier: '', ket: '' });
  const [entry, setEntry] = useState({ kode: '', nama: '', qty: 0, satuan: '', conv: 1 });
  const qtyRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => products.find((p: Product) => p.kode === entry.kode), [entry.kode]);

  const addEntry = () => {
    if (!entry.kode || entry.qty <= 0) return;
    const baseQty = entry.qty * entry.conv;
    if (type === 'KELUAR') {
      const inQueue = items.filter(i => i.kode === entry.kode).reduce((s, i) => s + (i.qty * i.conv), 0);
      const available = (stock[entry.kode] || 0) - inQueue;
      if (baseQty > available) return toast(`Stok tidak cukup! Tersedia: ${available}`, 'error');
    }
    setItems([{ ...entry, nama: selected?.nama, baseQty }, ...items]);
    setEntry({ kode: '', nama: '', qty: 0, satuan: '', conv: 1 });
    toast(`Ditambahkan: ${selected?.nama}`, 'success');
  };

  const processAll = async () => {
    for (const item of items) {
      await warehouseService.saveTransaction({
        ...form, jenis: type, kode: item.kode, nama: item.nama, qty: item.baseQty,
        satuan: item.satuan, displayQty: item.qty, user: user.username, keterangan: form.ket
      });
    }
    setItems([]); refresh(); toast('Semua transaksi berhasil disimpan!', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
      <div className="lg:col-span-1">
        <Card title="Global Detail" icon={ShieldCheck}>
          <div className="space-y-4">
            <Input label="Tanggal" type="date" value={form.tgl} onChange={(e:any) => setForm({...form, tgl: e.target.value})} />
            {type === 'MASUK' && (
              <>
                <Input label="No. Surat Jalan" placeholder="SJ-..." value={form.noSJ} onChange={(e:any) => setForm({...form, noSJ: e.target.value})} />
                <Input label="Supplier" placeholder="Nama Supplier..." value={form.supplier} onChange={(e:any) => setForm({...form, supplier: e.target.value})} />
              </>
            )}
            <Input label="Catatan" placeholder="Catatan transaksi..." value={form.ket} onChange={(e:any) => setForm({...form, ket: e.target.value})} />
            <Button variant="success" className="w-full mt-4" disabled={items.length === 0} onClick={processAll}><Save size={18}/> SIMPAN SEMUA</Button>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
        <Card className="!p-4 overflow-visible relative z-50">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <ProductAutocomplete products={products} stock={stock} onSelect={(p: Product) => { setEntry({ ...entry, kode: p.kode, nama: p.nama, satuan: p.satuanDefault, conv: 1 }); setTimeout(() => qtyRef.current?.focus(), 50); }} />
            <div className="w-32"><Input label="Jumlah" type="number" ref={qtyRef} value={entry.qty || ''} onChange={(e:any) => setEntry({ ...entry, qty: parseFloat(e.target.value) || 0 })} /></div>
            <div className="w-40">
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">Satuan</label>
              <select className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200" value={entry.satuan} onChange={(e:any) => {
                const u = e.target.value; let c = 1;
                if (u === selected?.satuanAlt1) c = selected.konversiAlt1 || 1;
                setEntry({ ...entry, satuan: u, conv: c });
              }}>
                {selected ? (
                  <>
                    <option value={selected.satuanDefault}>{selected.satuanDefault}</option>
                    {selected.satuanAlt1 && <option value={selected.satuanAlt1}>{selected.satuanAlt1}</option>}
                  </>
                ) : <option>Pilih Produk</option>}
              </select>
            </div>
            <Button className="h-[42px] px-6" onClick={addEntry} disabled={!entry.kode || entry.qty <= 0}><Plus size={20}/></Button>
          </div>
        </Card>
        <Card title="Daftar Entri" icon={ClipboardCheck} className="flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group">
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold ${type === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    <span className="text-lg">{it.qty}</span><span className="text-[8px] uppercase">{it.satuan}</span>
                  </div>
                  <div><h4 className="font-bold">{it.nama}</h4><p className="text-[10px] opacity-40 uppercase font-mono">{it.kode} {it.conv > 1 ? `(${it.baseQty} Unit Dasar)` : ''}</p></div>
                </div>
                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function HistoryView({ transactions, products, toast }: any) {
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() => {
    if (!filter) return transactions;
    const l = filter.toLowerCase();
    return transactions.filter((t: any) => t.nama.toLowerCase().includes(l) || t.kode.toLowerCase().includes(l) || t.user.toLowerCase().includes(l));
  }, [filter, transactions]);

  const exportCsv = () => {
    const head = "ID,Tgl,Jenis,Kode,Nama,Qty,Satuan,User\n";
    const body = filtered.map((t: any) => `${t.id},${t.tgl},${t.jenis},${t.kode},${t.nama},${t.qty},${t.satuan},${t.user}`).join("\n");
    const blob = new Blob([head + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'riwayat.csv'; link.click();
    toast("Export CSV Berhasil!", 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <Input label="Cari Riwayat" placeholder="Nama Barang, Kode, atau User..." value={filter} onChange={(e:any) => setFilter(e.target.value)} />
        <Button variant="outline" onClick={exportCsv} className="h-[42px]"><FileDown size={18}/> EXPORT CSV</Button>
      </div>
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/5 uppercase text-[10px] font-black text-slate-500">
            <tr><th className="p-4">Waktu</th><th className="p-4">Jenis</th><th className="p-4">Barang</th><th className="p-4 text-right">Qty</th><th className="p-4 text-right">User</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.slice().reverse().map((t: any) => (
              <tr key={t.id} className="hover:bg-white/[0.02]">
                <td className="p-4 font-mono text-[10px] opacity-40">{t.tgl}<br/>{t.waktu}</td>
                <td className="p-4"><Badge variant={t.jenis === 'MASUK' ? 'success' : 'info'}>{t.jenis}</Badge></td>
                <td className="p-4 font-bold">{t.nama}<div className="text-[10px] opacity-30 font-mono">{t.kode}</div></td>
                <td className="p-4 text-right font-black">{t.displayQty || t.qty} <span className="text-[10px] opacity-40">{t.satuan}</span></td>
                <td className="p-4 text-right text-[10px] opacity-40 uppercase font-black">{t.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function AdminView({ refresh, currentUser, toast }: any) {
  const [activeSub, setActiveSub] = useState<'users' | 'products'>('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', role: 'STAFF' as Role, active: true });
  
  const [showAddProd, setShowAddProd] = useState(false);
  const [newProd, setNewProd] = useState({ kode: '', nama: '', satuanDefault: 'PCS', minStok: 10 });

  const handleAddUser = (e: any) => {
    e.preventDefault();
    warehouseService.saveUser({ ...newUser });
    setShowAddUser(false); refresh(); toast(`User ${newUser.username} ditambahkan`, 'success');
  };

  const handleAddProd = (e: any) => {
    e.preventDefault();
    warehouseService.saveProduct({ ...newProd, minStok: Number(newProd.minStok) });
    setShowAddProd(false); refresh(); toast(`SKU ${newProd.kode} ditambahkan`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button onClick={() => setActiveSub('users')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeSub === 'users' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>USERS</button>
        <button onClick={() => setActiveSub('products')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeSub === 'products' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>MASTER SKU</button>
      </div>

      {activeSub === 'users' ? (
        <Card title="Management User" icon={UserIcon}>
          <div className="flex justify-end mb-4"><Button onClick={() => setShowAddUser(true)}><Plus size={18}/> TAMBAH USER</Button></div>
          {showAddUser && (
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-2xl mb-6 border border-white/10">
              <Input label="Username" value={newUser.username} onChange={(e:any) => setNewUser({...newUser, username: e.target.value})} required />
              <div className="w-full">
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Role</label>
                <select className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2" value={newUser.role} onChange={(e:any) => setNewUser({...newUser, role: e.target.value as Role})}>
                  <option value="STAFF">STAFF</option><option value="ADMIN">ADMIN</option><option value="VIEWER">VIEWER</option>
                </select>
              </div>
              <div className="flex items-end"><Button type="submit" variant="success" className="w-full">SIMPAN USER</Button></div>
            </form>
          )}
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 uppercase font-black border-b border-white/5">
              <tr><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {warehouseService.getUsers().map(u => (
                <tr key={u.username} className="border-b border-white/5">
                  <td className="p-4 font-bold">{u.username}</td>
                  <td className="p-4"><Badge variant={u.role === 'ADMIN' ? 'danger' : 'info'}>{u.role}</Badge></td>
                  <td className="p-4">{u.active ? <span className="text-emerald-400">AKTIF</span> : <span className="text-rose-400">NONAKTIF</span>}</td>
                  <td className="p-4 text-right"><button onClick={() => { warehouseService.deleteUser(u.username); refresh(); }} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-all"><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card title="Master SKU" icon={Database}>
          <div className="flex justify-end mb-4"><Button onClick={() => setShowAddProd(true)}><Plus size={18}/> TAMBAH SKU</Button></div>
          {showAddProd && (
            <form onSubmit={handleAddProd} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-2xl mb-6 border border-white/10">
              <Input label="Kode" value={newProd.kode} onChange={(e:any)=>setNewProd({...newProd, kode: e.target.value})} required />
              <Input label="Nama" value={newProd.nama} onChange={(e:any)=>setNewProd({...newProd, nama: e.target.value})} required />
              <Input label="Satuan" value={newProd.satuanDefault} onChange={(e:any)=>setNewProd({...newProd, satuanDefault: e.target.value})} required />
              <div className="flex items-end"><Button type="submit" variant="success" className="w-full">SIMPAN SKU</Button></div>
            </form>
          )}
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 uppercase font-black border-b border-white/5">
              <tr><th className="p-4">Kode</th><th className="p-4">Nama Barang</th><th className="p-4">Satuan Utama</th><th className="p-4 text-right">Min Stok</th></tr>
            </thead>
            <tbody>
              {warehouseService.getProducts().map(p => (
                <tr key={p.kode} className="border-b border-white/5">
                  <td className="p-4 font-mono text-blue-400">{p.kode}</td>
                  <td className="p-4 font-bold">{p.nama}</td>
                  <td className="p-4 uppercase">{p.satuanDefault}</td>
                  <td className="p-4 text-right font-black text-amber-500">{p.minStok}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// --- Main Application Wrapper ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<any[]>([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<StockState>({});
  const [aiInsights, setAiInsights] = useState('Memulai audit sistem...');

  const showToast = useCallback((message: string, type: string = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const refreshData = useCallback(() => {
    setProducts(warehouseService.getProducts());
    setTransactions(warehouseService.getTransactions());
    setStock(warehouseService.getStockState());
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('wareflow_session');
    if (saved) setUser(JSON.parse(saved));
    refreshData();
  }, []);

  useEffect(() => {
    if (user && activeTab === 'dashboard') {
      geminiService.getStockInsights(products, stock, transactions).then(setAiInsights);
    }
  }, [activeTab, user, stock]);

  const handleLogin = (e: any) => {
    e.preventDefault();
    const found = warehouseService.getUsers().find(u => u.username === loginForm.username);
    if (found && loginForm.password === 'admin123') {
      setUser(found); localStorage.setItem('wareflow_session', JSON.stringify(found));
      showToast(`Selamat datang, ${found.username}!`, 'success');
    /**
     * Fixed Error: Cannot find name 'toast'. Did you mean 'toasts'?
     * Corrected 'toast' to 'showToast'.
     */
    } else showToast('Login Gagal', 'error');
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#070b14] p-6">
        <div className="w-full max-w-md glass-panel p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6"><PackagePlus size={40}/></div>
            <h1 className="text-4xl font-black tracking-tighter">WAREFLOW</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Inventory Intelligence System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input label="Username" value={loginForm.username} onChange={(e:any)=>setLoginForm({...loginForm, username: e.target.value})} required />
            <Input label="Password" type="password" value={loginForm.password} onChange={(e:any)=>setLoginForm({...loginForm, password: e.target.value})} required />
            <Button className="w-full h-14 text-lg" type="submit">LOGIN SYSTEM</Button>
          </form>
        </div>
      </div>
    );
  }

  const icons: any = { LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, ShieldCheck };

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-200">
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">{toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={(id:string)=>setToasts(toasts.filter(x=>x.id!==id))} />)}</div>
      <aside className={`transition-all duration-300 glass-panel border-r border-white/5 h-full flex flex-col z-50 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-4"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0"><PackagePlus size={24}/></div>{isSidebarOpen && <span className="font-black text-xl tracking-tighter">WAREFLOW</span>}</div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {Object.keys(TAB_CONFIG).filter(k => TAB_CONFIG[k].roles.includes(user.role)).map(k => {
            const Icon = icons[TAB_CONFIG[k].icon] || LayoutDashboard;
            return (
              <button key={k} onClick={() => setActiveTab(k)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === k ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                <Icon size={22}/>{isSidebarOpen && <span className="font-bold text-sm uppercase tracking-tight">{TAB_CONFIG[k].label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-white/5"><button onClick={() => { setUser(null); localStorage.removeItem('wareflow_session'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10"><LogOut size={22}/>{isSidebarOpen && <span className="font-black text-sm uppercase">Logout</span>}</button></div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between glass-panel shrink-0">
          <div className="flex items-center gap-4"><button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg"><Menu size={20}/></button><h2 className="text-xl font-black uppercase tracking-tight">{activeTab}</h2></div>
          <div className="flex items-center gap-4">
            <button onClick={refreshData} className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-xl"><RefreshCw size={20}/></button>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5"><div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black">{user.username[0].toUpperCase()}</div><span className="text-sm font-bold">{user.username}</span></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView stock={stock} products={products} transactions={transactions} insights={aiInsights} refresh={refreshData} />}
            {activeTab === 'masuk' && <TransactionView type="MASUK" products={products} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'keluar' && <TransactionView type="KELUAR" products={products} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'opname' && <TransactionView type="OPNAME" products={products} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'riwayat' && <HistoryView transactions={transactions} products={products} toast={showToast} />}
            {activeTab === 'admin' && <AdminView refresh={refreshData} currentUser={user} toast={showToast} />}
          </div>
        </main>
      </div>
    </div>
  );
}
