
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, 
  ShieldCheck, LogOut, Menu, User as UserIcon, Bell, Search, RefreshCw, Plus, 
  Trash2, Save, X, FileDown, CheckCircle2, Info, XCircle, AlertTriangle, 
  TrendingUp, Activity, Box, Edit2, Filter, Database, Link as LinkIcon
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
    warning: <AlertTriangle size={18} className="text-amber-400" />,
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

const Input = React.forwardRef(({ label, icon: Icon, ...props }: any, ref: any) => (
  <div className="w-full">
    {label && <label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 ml-1 tracking-[0.1em]">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />}
      <input ref={ref} {...props} className={`w-full bg-slate-950/50 border border-white/10 rounded-xl py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all ${Icon ? 'pl-10 pr-4' : 'px-4'}`} />
    </div>
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

const ProductAutocomplete = React.forwardRef(({ products, stock, onSelect, placeholder = "Cari Nama / Kode Barang...", onEnterSelected }: any, ref: any) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
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

  const selectItem = (p: Product) => {
    onSelect(p);
    setQuery('');
    setIsOpen(false);
    if (onEnterSelected) onEnterSelected();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) {
      if (e.key === 'Enter' && query === '' && onEnterSelected) {
        onEnterSelected();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filtered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        break;
      case 'Enter':
        e.preventDefault();
        selectItem(filtered[highlightedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <Input label="Cari Barang" icon={Search} placeholder={placeholder} value={query} 
        onFocus={() => { setIsOpen(true); setHighlightedIndex(0); }} 
        onChange={(e: any) => { setQuery(e.target.value); setIsOpen(true); setHighlightedIndex(0); }} 
        onKeyDown={handleKeyDown} ref={ref} 
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1425]/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100] backdrop-blur-xl">
          {filtered.map((p: Product, idx: number) => (
            <div key={p.kode} className={`p-4 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center transition-colors ${idx === highlightedIndex ? 'bg-blue-600/30 text-white' : 'hover:bg-white/5 text-slate-300'}`}
              onMouseEnter={() => setHighlightedIndex(idx)} onClick={() => selectItem(p)}>
              <div>
                <p className="text-sm font-bold">{p.nama}</p>
                <p className="text-[10px] font-mono opacity-50 uppercase tracking-tighter">{p.kode}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-cyan-400">{stock ? stock[p.kode] || 0 : ''}</p>
                <p className="text-[8px] opacity-50 uppercase font-black">{p.satuanDefault}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// --- Views ---

function DashboardView({ stock, products, transactions, insights, refresh }: any) {
  const lowStock = products.filter((p: Product) => (stock[p.kode] || 0) < p.minStok);
  const totalUnits = Object.values(stock).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Unit Tersedia" icon={Box} subtitle="Volume Real-time"><div className="text-3xl font-black">{totalUnits.toLocaleString()} <span className="text-[10px] opacity-40 uppercase">Pcs</span></div></Card>
        <Card title="Stok Kritis" icon={AlertTriangle} subtitle="Batas Minimum"><div className="text-3xl font-black text-rose-500">{lowStock.length} <span className="text-[10px] opacity-40 uppercase">SKU</span></div></Card>
        <Card title="Log Aktivitas" icon={Activity} subtitle="Total Transaksi"><div className="text-3xl font-black text-blue-500">{transactions.length} <span className="text-[10px] opacity-40 uppercase">Record</span></div></Card>
        <Card title="Insight AI" icon={TrendingUp} subtitle="Analitik Otomatis"><Badge variant="success">Active</Badge></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Audit Berbasis AI" icon={Bell} className="border-blue-500/20 bg-blue-500/[0.02]">
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap italic opacity-90">{insights || "Sedang memproses data untuk audit..."}</p>
          </Card>
          <Card title="Peringatan Restock Segera" icon={AlertTriangle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                  <tr><th className="p-3">Nama Barang</th><th className="p-3 text-right">Stok Saat Ini</th><th className="p-3 text-right">Ambang Batas</th><th className="p-3 text-center">Status</th></tr>
                </thead>
                <tbody>
                  {lowStock.map((p: Product) => (
                    <tr key={p.kode} className="border-b border-white/5 hover:bg-rose-500/[0.02]">
                      <td className="p-3 font-bold">{p.nama}</td>
                      <td className="p-3 text-right font-black text-rose-500">{stock[p.kode] || 0}</td>
                      <td className="p-3 text-right opacity-40">{p.minStok}</td>
                      <td className="p-3 text-center"><Badge variant="danger">KRITIS</Badge></td>
                    </tr>
                  ))}
                  {lowStock.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">Semua stok dalam kondisi aman.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <Card title="Aktivitas Terkini" icon={History}>
          <div className="space-y-3">
            {transactions.slice(-8).reverse().map((t: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.jenis === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : t.jenis === 'KELUAR' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {t.jenis === 'MASUK' ? <PackagePlus size={16}/> : t.jenis === 'KELUAR' ? <PackageMinus size={16}/> : <ClipboardCheck size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-slate-200">{t.nama}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">{t.jenis} • {t.displayQty || t.qty} {t.satuan} • {t.waktu}</p>
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
  const autocompleteRef = useRef<any>(null);

  const selectedProduct = useMemo(() => products.find((p: Product) => p.kode === entry.kode), [entry.kode, products]);

  const addEntry = useCallback(() => {
    if (!entry.kode || entry.qty <= 0) {
      toast("Lengkapi data barang dan pastikan jumlah lebih dari 0!", "error");
      return;
    }
    const baseQty = entry.qty * entry.conv;
    if (type === 'KELUAR') {
      const inQueue = items.filter(i => i.kode === entry.kode).reduce((s, i) => s + (i.qty * i.conv), 0);
      const currentAvailable = (stock[entry.kode] || 0) - inQueue;
      if (baseQty > currentAvailable) {
        toast(`Stok tidak mencukupi! Tersedia: ${currentAvailable}`, 'error');
        return;
      }
    }
    setItems([{ ...entry, nama: selectedProduct?.nama, baseQty }, ...items]);
    setEntry({ kode: '', nama: '', qty: 0, satuan: '', conv: 1 });
    toast(`Berhasil masuk antrean: ${selectedProduct?.nama}`, 'success');
    setTimeout(() => autocompleteRef.current?.focus(), 50);
  }, [entry, items, stock, type, selectedProduct, toast]);

  const submitAll = async () => {
    for (const item of items) {
      await warehouseService.saveTransaction({
        ...form, jenis: type, kode: item.kode, nama: item.nama, qty: item.baseQty,
        satuan: item.satuan, displayQty: item.qty, user: user.username, keterangan: form.ket
      });
    }
    setItems([]); refresh();
    toast(`${items.length} data ${type} berhasil diproses!`, 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
      <div className="lg:col-span-1">
        <Card title={type === 'OPNAME' ? "Opname Gudang" : "Informasi Global"} icon={ShieldCheck}>
          <div className="space-y-4">
            <Input label="Tanggal Transaksi" type="date" value={form.tgl} onChange={(e:any) => setForm({...form, tgl: e.target.value})} />
            {type === 'MASUK' && (
              <>
                <Input label="No. Surat Jalan" placeholder="SJ-..." value={form.noSJ} onChange={(e:any) => setForm({...form, noSJ: e.target.value})} />
                <div className="w-full">
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 ml-1 tracking-widest">Pilih Supplier</label>
                  <select className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500" value={form.supplier} onChange={(e:any) => setForm({...form, supplier: e.target.value})}>
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s: Supplier) => <option key={s.id} value={s.nama}>{s.nama}</option>)}
                  </select>
                </div>
              </>
            )}
            <Input label="Keterangan" placeholder="Tambahkan catatan..." value={form.ket} onChange={(e:any) => setForm({...form, ket: e.target.value})} />
            <Button variant={type === 'OPNAME' ? "primary" : "success"} className="w-full mt-4" disabled={items.length === 0} onClick={submitAll}>
              <Save size={18}/> {type === 'OPNAME' ? 'SIMPAN OPNAME' : 'SIMPAN SEMUA'}
            </Button>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
        <Card className="!p-4 overflow-visible relative z-50" title={type === 'OPNAME' ? "Form Audit Fisik" : "Input Barang"}>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <ProductAutocomplete ref={autocompleteRef} products={products} stock={stock} onSelect={(p: Product) => setEntry({ ...entry, kode: p.kode, nama: p.nama, satuan: p.satuanDefault, conv: 1 })} onEnterSelected={() => setTimeout(() => qtyRef.current?.focus(), 50)} />
            <div className="w-32"><Input label={type === 'OPNAME' ? "Stok Aktual" : "Jumlah"} type="number" ref={qtyRef} min="0.01" step="any" value={entry.qty || ''} onChange={(e:any) => setEntry({ ...entry, qty: parseFloat(e.target.value) || 0 })} onKeyDown={(e:any)=>e.key==='Enter'&&addEntry()} /></div>
            <div className="w-40">
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">Satuan</label>
              <select className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200" value={entry.satuan} onChange={(e:any) => {
                const u = e.target.value; let c = 1;
                if (u === selectedProduct?.satuanAlt1) c = selectedProduct.konversiAlt1 || 1;
                if (u === selectedProduct?.satuanAlt2) c = selectedProduct.konversiAlt2 || 1;
                setEntry({ ...entry, satuan: u, conv: c });
              }}>
                {selectedProduct ? (
                  <>
                    <option value={selectedProduct.satuanDefault}>{selectedProduct.satuanDefault}</option>
                    {selectedProduct.satuanAlt1 && <option value={selectedProduct.satuanAlt1}>{selectedProduct.satuanAlt1}</option>}
                    {selectedProduct.satuanAlt2 && <option value={selectedProduct.satuanAlt2}>{selectedProduct.satuanAlt2}</option>}
                  </>
                ) : <option>--</option>}
              </select>
            </div>
            <Button className="h-[42px] px-6" onClick={addEntry} disabled={!entry.kode || entry.qty <= 0}><Plus size={20}/></Button>
          </div>
        </Card>
        <Card title="Antrean Data" icon={ClipboardCheck} className="flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group animate-in slide-in-from-top-2">
                <div className="flex gap-4 items-center">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold ${type === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : type === 'KELUAR' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    <span className="text-xl leading-none">{it.qty}</span>
                    <span className="text-[8px] uppercase">{it.satuan}</span>
                  </div>
                  <div><h4 className="font-bold text-slate-100">{it.nama}</h4><p className="text-[10px] opacity-40 uppercase font-mono">{it.kode} {it.conv > 1 ? `(${it.baseQty} Unit Dasar)` : ''}</p></div>
                </div>
                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20}/></button>
              </div>
            ))}
            {items.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 opacity-50"><PackagePlus size={64} className="opacity-10" /><p className="text-sm font-medium tracking-tight">Belum ada item untuk diproses.</p></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function HistoryView({ transactions, products, toast }: any) {
  const [filter, setFilter] = useState({ query: '', type: '', product: '', date: '' });
  const filtered = useMemo(() => transactions.filter((t: any) => {
    const matchQuery = !filter.query || t.nama.toLowerCase().includes(filter.query.toLowerCase()) || t.user.toLowerCase().includes(filter.query.toLowerCase());
    const matchType = !filter.type || t.jenis === filter.type;
    const matchProduct = !filter.product || t.kode === filter.product;
    const matchDate = !filter.date || t.tgl === filter.date;
    return matchQuery && matchType && matchProduct && matchDate;
  }), [filter, transactions]);

  return (
    <div className="space-y-6">
      <Card title="Pencarian & Filter" icon={Filter}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input label="Kata Kunci" placeholder="Cari..." value={filter.query} onChange={(e:any)=>setFilter({...filter, query: e.target.value})} />
          <div className="w-full">
            <label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 tracking-widest">Jenis</label>
            <select className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200" value={filter.type} onChange={(e:any)=>setFilter({...filter, type: e.target.value})}>
              <option value="">Semua</option><option value="MASUK">MASUK</option><option value="KELUAR">KELUAR</option><option value="OPNAME">OPNAME</option>
            </select>
          </div>
          <div className="w-full">
            <label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 tracking-widest">Barang</label>
            <select className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200" value={filter.product} onChange={(e:any)=>setFilter({...filter, product: e.target.value})}>
              <option value="">Semua Barang</option>
              {products.map((p: Product) => <option key={p.kode} value={p.kode}>{p.nama}</option>)}
            </select>
          </div>
          <Input label="Tanggal" type="date" value={filter.date} onChange={(e:any)=>setFilter({...filter, date: e.target.value})} />
        </div>
      </Card>
      <div className="glass-panel rounded-[2rem] border border-white/10 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/5 uppercase text-[10px] font-black text-slate-500">
            <tr><th className="p-4">Waktu</th><th className="p-4">Jenis</th><th className="p-4">Produk</th><th className="p-4 text-right">Volume</th><th className="p-4 text-right">User</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.slice().reverse().map((t: any) => (
              <tr key={t.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="p-4 font-mono text-[10px] opacity-40">{t.tgl}<br/>{t.waktu}</td>
                <td className="p-4"><Badge variant={t.jenis==='MASUK'?'success':t.jenis==='KELUAR'?'danger':'info'}>{t.jenis}</Badge></td>
                <td className="p-4 font-bold">{t.nama}<div className="text-[10px] opacity-30 uppercase">{t.kode}</div></td>
                <td className="p-4 text-right font-black">{t.displayQty || t.qty} <span className="text-[10px] opacity-40 uppercase">{t.satuan}</span></td>
                <td className="p-4 text-right text-[10px] opacity-50 uppercase font-black">{t.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminView({ refresh, currentUser, toast, products }: any) {
  const [subTab, setSubTab] = useState<'users' | 'skus' | 'cloud'>('users');
  const [modal, setModal] = useState({ open: false, editing: null as any, data: {} as any });
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('wareflow_gas_url') || '');

  const saveConfig = () => {
    warehouseService.setBackendUrl(gasUrl);
    toast("URL Backend disimpan! Mencoba sinkronisasi...", "success");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button onClick={() => setSubTab('users')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Users</button>
        <button onClick={() => setSubTab('skus')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'skus' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Katalog SKU</button>
        <button onClick={() => setSubTab('cloud')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'cloud' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500'}`}>Koneksi Cloud</button>
      </div>

      {subTab === 'cloud' && (
        <Card title="Pengaturan Integrasi Spreadsheet" icon={LinkIcon} subtitle="Sinkronisasi Online">
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-4 items-start">
              <Info className="text-blue-400 shrink-0" size={20} />
              <div className="text-sm space-y-2">
                <p className="font-bold text-blue-100">Instruksi Koneksi:</p>
                <ol className="list-decimal list-inside text-slate-400 space-y-1">
                  <li>Deploy kode <code className="text-blue-300">backend.js</code> di Google Apps Script.</li>
                  <li>Pastikan setelan akses adalah <span className="text-emerald-400 font-bold">Anyone</span>.</li>
                  <li>Tempel URL Web App (/exec) di bawah ini.</li>
                </ol>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <Input label="Google Apps Script URL" placeholder="https://script.google.com/macros/s/.../exec" value={gasUrl} onChange={(e:any)=>setGasUrl(e.target.value)} />
              <Button variant="success" className="md:mt-5" onClick={saveConfig}><Save size={18}/> Simpan & Hubungkan</Button>
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-black text-center pt-4 tracking-widest border-t border-white/5 italic">Sistem akan otomatis beralih ke mode Online setelah URL valid dimasukkan.</p>
          </div>
        </Card>
      )}

      {subTab === 'users' && (
        <Card title="Akses Sistem" icon={UserIcon}>
          <div className="flex justify-end mb-4"><Button onClick={() => setModal({ open: true, editing: null, data: {role:'STAFF', active:true} })}><Plus size={18}/> Tambah User</Button></div>
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5">
              <tr><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {warehouseService.getUsers().map(u => (
                <tr key={u.username} className="border-b border-white/5">
                  <td className="p-4 font-black">{u.username}</td>
                  <td className="p-4"><Badge variant={u.role==='ADMIN'?'danger':'info'}>{u.role}</Badge></td>
                  <td className="p-4">{u.active ? <span className="text-emerald-400 font-black">AKTIF</span> : <span className="text-rose-400 font-black">NONAKTIF</span>}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => setModal({ open: true, editing: u, data: u })} className="p-2 text-blue-400"><Edit2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {subTab === 'skus' && (
        <Card title="Master SKU" icon={Database}>
          <div className="flex justify-end mb-4"><Button onClick={() => setModal({ open: true, editing: null, data: {satuanDefault:'PCS', minStok:10} })}><Plus size={18}/> SKU Baru</Button></div>
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5">
              <tr><th className="p-4">Kode</th><th className="p-4">Nama</th><th className="p-4">Satuan</th><th className="p-4 text-right">Min</th><th className="p-4 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {products.map((p: Product) => (
                <tr key={p.kode} className="border-b border-white/5">
                  <td className="p-4 font-mono text-blue-400 font-bold">{p.kode}</td>
                  <td className="p-4 font-bold">{p.nama}</td>
                  <td className="p-4 text-[10px] font-black">{p.satuanDefault}</td>
                  <td className="p-4 text-right font-black text-amber-500">{p.minStok}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => setModal({ open: true, editing: p, data: p })} className="p-2 text-blue-400"><Edit2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// --- App Wrapper ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<StockState>({});
  const [aiInsights, setAiInsights] = useState('');

  const showToast = useCallback((message: string, type: string = 'info') => {
    setToasts(prev => [...prev, { id: Date.now().toString(), message, type }]);
  }, []);

  const refreshData = useCallback(async () => {
    setIsSyncing(true);
    const success = await warehouseService.syncAll();
    setProducts(warehouseService.getProducts());
    setSuppliers(warehouseService.getSuppliers());
    setTransactions(warehouseService.getTransactions());
    setStock(warehouseService.getStockState());
    setIsSyncing(false);
    
    const url = localStorage.getItem('wareflow_gas_url');
    if (!url) {
      showToast('Koneksi Cloud belum dikonfigurasi. Berjalan dalam mode lokal.', 'warning');
    } else if (success) {
      showToast('Berhasil terhubung ke Cloud Google Sheets', 'success');
    } else {
      showToast('Gagal sinkronisasi. Cek URL GAS dan koneksi internet.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    const saved = localStorage.getItem('wareflow_session');
    if (saved) setUser(JSON.parse(saved));
    refreshData();
  }, []);

  useEffect(() => {
    if (user && activeTab === 'dashboard') {
      geminiService.getStockInsights(products, stock, transactions).then(setAiInsights);
    }
  }, [activeTab, user, stock, products, transactions]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#070b14] p-6">
        <Card className="w-full max-w-md p-10 !border-white/5">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 shadow-blue-500/30"><PackagePlus size={40} className="text-white" /></div>
            <h1 className="text-4xl font-black tracking-tighter">WAREFLOW</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Intelligence Warehouse System</p>
          </div>
          <form onSubmit={(e:any)=>{
            e.preventDefault();
            const u = e.target.username.value;
            const p = e.target.password.value;
            const found = warehouseService.getUsers().find(x=>x.username===u);
            if (found && p === 'admin123' && found.active) {
              setUser(found); localStorage.setItem('wareflow_session', JSON.stringify(found));
              showToast(`Selamat datang, ${found.username}!`, 'success');
            } else showToast('Login Gagal!', 'error');
          }} className="space-y-6">
            <Input label="Username" name="username" required />
            <Input label="Password" type="password" name="password" required />
            <Button className="w-full h-14" type="submit">LOGIN</Button>
          </form>
        </Card>
      </div>
    );
  }

  const icons: any = { LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, ShieldCheck };

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-200 overflow-hidden">
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={(id:string)=>setToasts(toasts.filter(x=>x.id!==id))} />)}
      </div>
      <aside className={`transition-all duration-500 glass-panel border-r border-white/5 h-full flex flex-col z-50 shrink-0 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-4"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0"><PackagePlus size={24} className="text-white"/></div>{isSidebarOpen && <span className="font-black text-xl tracking-tighter">WAREFLOW</span>}</div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {Object.keys(TAB_CONFIG).filter(k => TAB_CONFIG[k].roles.includes(user.role)).map(k => {
            const Icon = icons[TAB_CONFIG[k].icon] || LayoutDashboard;
            return (<button key={k} onClick={() => setActiveTab(k)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === k ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}><Icon size={20}/>{isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">{TAB_CONFIG[k].label}</span>}</button>);
          })}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { setUser(null); localStorage.removeItem('wareflow_session'); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all ${!isSidebarOpen && 'justify-center'}`}><LogOut size={20}/>{isSidebarOpen && <span className="font-black text-xs uppercase tracking-widest">Keluar</span>}</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between glass-panel z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-white/5 rounded-xl text-slate-400"><Menu size={20}/></button>
            <h2 className="text-xl font-black uppercase tracking-tight text-white leading-none">{TAB_CONFIG[activeTab]?.label || activeTab}</h2>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={refreshData} disabled={isSyncing} className={`p-3 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all ${isSyncing ? 'opacity-50' : 'active:rotate-180 duration-500'}`}><RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''}/></button>
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm">{user.username[0].toUpperCase()}</div>
              <div className="hidden lg:block text-right"><p className="text-xs font-black text-slate-200">{user.username}</p><p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-0.5">{user.role}</p></div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto pb-20">
            {activeTab === 'dashboard' && <DashboardView stock={stock} products={products} transactions={transactions} insights={aiInsights} refresh={refreshData} />}
            {activeTab === 'masuk' && <TransactionView type="MASUK" products={products} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'keluar' && <TransactionView type="KELUAR" products={products} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'opname' && <TransactionView type="OPNAME" products={products} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'riwayat' && <HistoryView transactions={transactions} products={products} toast={showToast} />}
            {activeTab === 'admin' && <AdminView refresh={refreshData} currentUser={user} toast={showToast} products={products} />}
          </div>
        </main>
      </div>
    </div>
  );
}
