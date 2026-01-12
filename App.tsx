
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, 
  PackagePlus, 
  PackageMinus, 
  ClipboardCheck, 
  History, 
  Truck, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  User as UserIcon, 
  Bell, 
  Search, 
  ChevronRight, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  FileDown,
  CheckCircle2,
  Info,
  XCircle,
  Loader2
} from 'lucide-react';
import { Role, User, Transaction, Product, Supplier, StockState } from './types';
import { TAB_CONFIG } from './constants';
import { warehouseService } from './services/warehouseService';
import { geminiService } from './services/geminiService';

// --- Toast System ---
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; message: string; type: ToastType; }

const ToastItem = ({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-400" size={20} />,
    error: <XCircle className="text-rose-400" size={20} />,
    info: <Info className="text-blue-400" size={20} />,
    warning: <AlertTriangle className="text-amber-400" size={20} />,
  };

  const borders = {
    success: "border-emerald-500/30",
    error: "border-rose-500/30",
    info: "border-blue-500/30",
    warning: "border-amber-500/30",
  };

  return (
    <div className={`flex items-center gap-3 p-4 glass-panel rounded-2xl border ${borders[toast.type]} shadow-2xl animate-in slide-in-from-right-full duration-300 min-w-[300px] max-w-md`}>
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-medium text-slate-200">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
        <X size={16} className="text-slate-500" />
      </button>
    </div>
  );
};

// --- Helper Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }: any) => {
  const base = "px-4 py-2 rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20",
    ghost: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10",
    outline: "bg-transparent border border-white/20 hover:border-cyan-400 text-slate-200"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = React.forwardRef(({ label, ...props }: any, ref: any) => (
  <div className="w-full">
    {label && <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">{label}</label>}
    <input 
      ref={ref}
      {...props} 
      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
    />
  </div>
));

const Card = ({ children, title, icon: Icon, className = "" }: any) => (
  <div className={`glass-panel p-5 rounded-2xl flex flex-col gap-4 ${className}`}>
    {title && (
      <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm uppercase tracking-wider">
        {Icon && <Icon size={18} />}
        {title}
      </div>
    )}
    {children}
  </div>
);

const Badge = ({ children, variant = 'info' }: any) => {
  const variants: any = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${variants[variant]}`}>{children}</span>;
};

// --- Autocomplete Component ---
const ProductAutocomplete = React.forwardRef(({ products, stock, onSelect, placeholder = "Ketik Nama / Kode Produk..." }: { products: Product[], stock?: StockState, onSelect: (p: Product) => void, placeholder?: string }, ref: any) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.nama.toLowerCase().includes(lowerQuery) || 
      p.kode.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  }, [query, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (filtered[highlightedIndex]) {
        selectProduct(filtered[highlightedIndex]);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectProduct = (p: Product) => {
    onSelect(p);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">Cari Produk</label>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          className="w-full bg-slate-950 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1425] border border-white/20 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] backdrop-blur-xl">
          {filtered.map((p, idx) => (
            <div
              key={p.kode}
              className={`p-3 cursor-pointer flex justify-between items-center transition-colors border-b border-white/5 last:border-0 ${idx === highlightedIndex ? 'bg-cyan-500/30 text-white' : 'hover:bg-white/5 text-slate-300'}`}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onClick={() => selectProduct(p)}
            >
              <div>
                <p className="text-sm font-semibold">{p.nama}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 font-mono">{p.kode}</p>
              </div>
              <div className="text-right">
                 {stock && <p className="text-xs font-bold text-cyan-400">{stock[p.kode] || 0}</p>}
                 <p className="text-[9px] uppercase opacity-50 font-bold">{p.satuanDefault}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// --- Dashboard View ---
function DashboardView({ stock, products, transactions, insights }: any) {
  const lowStockCount = useMemo(() => 
    products.filter((p: Product) => (stock[p.kode] || 0) < p.minStok).length
  , [products, stock]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total SKU" icon={PackagePlus}>
          <div className="text-3xl font-bold text-white">{products.length}</div>
          <p className="text-xs text-slate-500">Produk Terdaftar</p>
        </Card>
        <Card title="Stok Kritis" icon={AlertTriangle}>
          <div className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {lowStockCount}
          </div>
          <p className="text-xs text-slate-500">Dibawah Min Stok</p>
        </Card>
        <Card title="Riwayat" icon={History}>
          <div className="text-3xl font-bold text-cyan-400">{transactions.length}</div>
          <p className="text-xs text-slate-500">Total Transaksi</p>
        </Card>
        <Card title="Intelligence" icon={Bell}>
           <Badge variant="success">AI Active</Badge>
           <p className="text-xs text-slate-500 mt-2">Gemini 3 Flash</p>
        </Card>
      </div>
      
      <Card title="AI Inventory Analyst" icon={Bell} className="border-cyan-500/20 shadow-lg shadow-cyan-900/5">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm italic">"{insights}"</p>
        </div>
      </Card>

      <Card title="Daftar Perhatian (Low Stock)" icon={AlertTriangle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="pb-3 px-2">Nama Barang</th>
                <th className="pb-3 px-2">Kode</th>
                <th className="pb-3 px-2 text-right">Stok Saat Ini</th>
                <th className="pb-3 px-2 text-right">Min</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.filter((p: Product) => (stock[p.kode] || 0) < p.minStok).map((p: Product) => (
                <tr key={p.kode} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-2 text-slate-200 font-medium">{p.nama}</td>
                  <td className="py-3 px-2 text-slate-500 font-mono text-xs">{p.kode}</td>
                  <td className="py-3 px-2 text-right text-rose-400 font-bold">{stock[p.kode] || 0}</td>
                  <td className="py-3 px-2 text-right text-slate-400 font-medium">{p.minStok}</td>
                </tr>
              ))}
              {lowStockCount === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500 italic text-sm">Semua stok dalam kondisi aman.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// --- History View ---
function HistoryView({ transactions }: any) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => 
    transactions.filter((t: any) => 
      t.nama.toLowerCase().includes(search.toLowerCase()) || 
      t.kode.toLowerCase().includes(search.toLowerCase()) ||
      (t.noSJ && t.noSJ.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 50)
  , [transactions, search]);

  return (
    <Card title="Riwayat Aktivitas Cloud" icon={History}>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Cari transaksi (Nama, Kode, No SJ)..."
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost">
          <FileDown size={18} /> Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
              <th className="pb-3 px-2">Tanggal / Waktu</th>
              <th className="pb-3 px-2">Jenis</th>
              <th className="pb-3 px-2">Detail Barang</th>
              <th className="pb-3 px-2 text-right">Jumlah</th>
              <th className="pb-3 px-2 text-right">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((t: any) => (
              <tr key={t.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-2">
                  <div className="text-slate-300 text-sm font-medium">{t.tgl}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{t.waktu}</div>
                </td>
                <td className="py-3 px-2">
                  <Badge variant={t.jenis === 'MASUK' ? 'success' : t.jenis === 'KELUAR' ? 'danger' : 'warning'}>
                    {t.jenis}
                  </Badge>
                </td>
                <td className="py-3 px-2">
                   <div className="text-slate-100 font-semibold text-sm">{t.nama}</div>
                   <div className="flex gap-2 items-center mt-1">
                     <span className="text-[10px] text-slate-500 font-mono">{t.kode}</span>
                     {t.noSJ && <span className="text-[9px] bg-white/5 text-slate-400 px-1 rounded uppercase font-bold">SJ: {t.noSJ}</span>}
                   </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className={`font-bold ${t.jenis === 'MASUK' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {t.jenis === 'KELUAR' ? '-' : ''}{t.displayQty || t.qty}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{t.satuan}</div>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="text-xs font-bold text-slate-400">{t.user}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// --- Supplier View ---
function SupplierView({ suppliers, refresh, toast }: any) {
  const [form, setForm] = useState<any>({ nama: '', alamat: '', telp: '', pic: '', ket: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama) return;
    setIsSaving(true);
    try {
      await warehouseService.saveSupplier({ ...form, id: 'SUP' + Math.floor(Math.random() * 1000) });
      setForm({ nama: '', alamat: '', telp: '', pic: '', ket: '' });
      await refresh();
      toast('Supplier baru ditambahkan ke cloud', 'success');
    } catch (err: any) {
      toast('Gagal simpan supplier: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Registrasi Supplier" icon={Truck}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nama Perusahaan" value={form.nama} onChange={(e: any) => setForm({ ...form, nama: e.target.value })} required />
          <Input label="PIC" value={form.pic} onChange={(e: any) => setForm({ ...form, pic: e.target.value })} />
          <Input label="Telepon" value={form.telp} onChange={(e: any) => setForm({ ...form, telp: e.target.value })} />
          <Input label="Alamat" value={form.alamat} onChange={(e: any) => setForm({ ...form, alamat: e.target.value })} />
          <Button type="submit" className="w-full h-11" disabled={isSaving || !form.nama}>
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} TAMBAH SUPPLIER
          </Button>
        </form>
      </Card>
      <Card title="Database Supplier" icon={Truck} className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s: any) => (
            <div key={s.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{s.nama}</h4>
                <Badge variant="info">{s.pic || 'No PIC'}</Badge>
              </div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-2"><Truck size={12} /> {s.alamat || 'Alamat tidak tersedia'}</p>
              <p className="text-xs text-slate-500 font-mono">{s.telp || '-'}</p>
            </div>
          ))}
          {suppliers.length === 0 && (
            <div className="col-span-2 py-10 text-center text-slate-500 italic">Belum ada data supplier.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

// --- Admin View ---
function AdminView({ users, refresh, currentUser, toast }: any) {
  const [form, setForm] = useState<User>({ username: '', role: 'VIEWER', active: true });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username) return;
    setIsSaving(true);
    try {
      await warehouseService.saveUser(form);
      setForm({ username: '', role: 'VIEWER', active: true });
      await refresh();
      toast('Data user berhasil diperbarui', 'success');
    } catch (err: any) {
      toast('Gagal simpan user: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Kontrol Akses" icon={ShieldCheck}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Username" value={form.username} onChange={(e: any) => setForm({ ...form, username: e.target.value })} required />
          <div className="w-full">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">Hak Akses</label>
            <select className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200"
              value={form.role} onChange={(e: any) => setForm({ ...form, role: e.target.value as any })}>
              <option value="ADMIN">ADMIN (Full Access)</option>
              <option value="STAFF">STAFF (Transactional)</option>
              <option value="VIEWER">VIEWER (Read Only)</option>
            </select>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
            <input 
              type="checkbox" 
              checked={form.active} 
              onChange={(e) => setForm({...form, active: e.target.checked})}
              className="w-4 h-4 rounded border-white/10 bg-slate-900"
            />
            <span className="text-sm font-medium text-slate-200">Akun Aktif</span>
          </div>
          <Button type="submit" className="w-full h-11" disabled={isSaving || !form.username}>
             {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} SIMPAN PENGGUNA
          </Button>
        </form>
      </Card>
      <Card title="Daftar Pengguna Sistem" icon={ShieldCheck} className="lg:col-span-2">
        <div className="space-y-3">
          {users.map((u: User) => (
            <div key={u.username} className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${u.username === currentUser.username ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-100">{u.username}</h4>
                    {u.username === currentUser.username && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">You</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{u.role}</span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] text-slate-500 italic">Login: {u.lastLogin || 'Never'}</span>
                  </div>
                </div>
              </div>
              <Badge variant={u.active ? 'success' : 'danger'}>{u.active ? 'ACTIVE' : 'DISABLED'}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<StockState>({});
  const [aiInsights, setAiInsights] = useState<string>('Loading AI insights...');

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await warehouseService.getAllData();
      if (data.error) throw new Error(data.error);
      
      setProducts(data.products || []);
      setSuppliers(data.suppliers || []);
      setTransactions(data.transactions || []);
      setStock(warehouseService.calculateStock(data.transactions || [], data.products || []));
    } catch (err: any) {
      showToast('Gagal memuat data dari cloud: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('wareflow_session');
    if (savedUser) setUser(JSON.parse(savedUser));
    refreshData();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' && user && products.length > 0) {
      fetchAiInsights();
    }
  }, [activeTab, user, products]);

  const fetchAiInsights = async () => {
    setAiInsights('Analyzing current trends with AI...');
    const result = await geminiService.getStockInsights(products, stock, transactions);
    setAiInsights(result || 'No insights available.');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = warehouseService.getUsers().find(u => u.username === loginForm.username);
    
    if (found && loginForm.password === 'admin123') {
      if (!found.active) {
        showToast('Akun dinonaktifkan', 'error');
        return;
      }
      const userData = { ...found, lastLogin: new Date().toISOString() };
      setUser(userData);
      localStorage.setItem('wareflow_session', JSON.stringify(userData));
      showToast(`Selamat datang kembali, ${found.username}!`, 'success');
    } else {
      showToast('Kredensial tidak valid', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wareflow_session');
    showToast('Berhasil keluar sistem', 'info');
  };

  const allowedTabs = useMemo(() => {
    if (!user) return [];
    return Object.keys(TAB_CONFIG).filter(key => 
      TAB_CONFIG[key].roles.includes(user.role)
    );
  }, [user]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
          {toasts.map(toast => <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />)}
        </div>
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
              <PackagePlus size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Wareflow MLASS</h1>
            <p className="text-slate-400 mt-2">Cloud-Based WMS</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <Input label="Username" value={loginForm.username} onChange={(e: any) => setLoginForm({ ...loginForm, username: e.target.value })} required />
            <Input label="Password" type="password" value={loginForm.password} onChange={(e: any) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            <Button className="w-full h-12 text-lg" type="submit">LOG IN</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
        {toasts.map(toast => <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />)}
      </div>

      <aside className={`transition-all duration-300 glass-panel border-r border-white/10 flex flex-col h-full z-40 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <PackagePlus size={24} className="text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight whitespace-nowrap">Wareflow</span>}
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto">
          {allowedTabs.map(key => {
            const config = TAB_CONFIG[key];
            const Icon = (config as any).icon === 'LayoutDashboard' ? LayoutDashboard :
                         (config as any).icon === 'PackagePlus' ? PackagePlus :
                         (config as any).icon === 'PackageMinus' ? PackageMinus :
                         (config as any).icon === 'ClipboardCheck' ? ClipboardCheck :
                         (config as any).icon === 'History' ? History :
                         (config as any).icon === 'Truck' ? Truck : ShieldCheck;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${activeTab === key ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'hover:bg-white/5 text-slate-400'}`}>
                <Icon size={22} className={activeTab === key ? 'text-blue-400' : 'group-hover:text-slate-300'} />
                {isSidebarOpen && <span className="font-medium">{config.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className={`w-full flex items-center gap-4 p-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors ${!isSidebarOpen && 'justify-center'}`}>
            <LogOut size={22} /> {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between glass-panel z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            <button onClick={() => { refreshData(); showToast('Memperbarui data cloud...', 'info'); }} className={`p-2 hover:bg-white/5 rounded-full text-cyan-400 ml-2 ${loading ? 'animate-spin' : ''}`}>
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
            <UserIcon size={16} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">{user.username}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{user.role}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center">
              <div className="glass-panel p-6 rounded-3xl flex flex-col items-center gap-3">
                <Loader2 className="text-cyan-400 animate-spin" size={32} />
                <span className="text-sm font-bold text-cyan-400 tracking-widest">SINKRONISASI CLOUD...</span>
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && <DashboardView stock={stock} products={products} transactions={transactions} insights={aiInsights} refresh={refreshData} />}
          {activeTab === 'masuk' && <TransactionView type="MASUK" products={products} suppliers={suppliers} stock={stock} refresh={refreshData} user={user} toast={showToast} />}
          {activeTab === 'keluar' && <TransactionView type="KELUAR" products={products} stock={stock} refresh={refreshData} user={user} toast={showToast} />}
          {activeTab === 'opname' && <TransactionView type="OPNAME" products={products} stock={stock} refresh={refreshData} user={user} toast={showToast} />}
          {activeTab === 'riwayat' && <HistoryView transactions={transactions} products={products} toast={showToast} />}
          {activeTab === 'supplier' && <SupplierView suppliers={suppliers} refresh={refreshData} toast={showToast} />}
          {activeTab === 'admin' && <AdminView users={warehouseService.getUsers()} refresh={refreshData} currentUser={user} toast={showToast} />}
        </main>
      </div>
    </div>
  );
}

// --- Transaction View ---
function TransactionView({ type, products, suppliers, stock, refresh, user, toast }: any) {
  const [items, setItems] = useState<any[]>([]);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({ tgl: new Date().toISOString().split('T')[0], noSJ: '', supplier: '', noPO: '', ket: '' });
  const [currentEntry, setCurrentEntry] = useState({ kode: '', nama: '', qty: 0, satuan: '', konversi: 1, ket: '' });

  const selectedProduct = useMemo(() => products.find((p: Product) => p.kode === currentEntry.kode), [currentEntry.kode, products]);

  const handleProductSelect = (p: Product) => {
    setCurrentEntry({ ...currentEntry, kode: p.kode, nama: p.nama, satuan: p.satuanDefault, konversi: 1 });
    setTimeout(() => { qtyInputRef.current?.focus(); qtyInputRef.current?.select(); }, 50);
  };

  const addItem = useCallback(() => {
    if (!currentEntry.kode || currentEntry.qty <= 0) return;
    const totalBaseQty = currentEntry.qty * currentEntry.konversi;
    if (type === 'KELUAR') {
      const existingInList = items.filter(i => i.kode === currentEntry.kode).reduce((sum, i) => sum + (i.qty * i.konversi), 0);
      const available = (stock[currentEntry.kode] || 0) - existingInList;
      if (totalBaseQty > available) {
        toast(`Stok tidak cukup. Tersedia: ${available} ${selectedProduct?.satuanDefault}`, "error");
        return;
      }
    }
    setItems([{ ...currentEntry }, ...items]);
    setCurrentEntry({ kode: '', nama: '', qty: 0, satuan: '', konversi: 1, ket: '' });
    toast(`Ditambahkan: ${currentEntry.nama}`, 'success');
  }, [currentEntry, items, stock, type, selectedProduct, toast]);

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const submitTransaction = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    try {
      for (const item of items) {
        await warehouseService.saveTransaction({
          tgl: form.tgl,
          jenis: type,
          nama: item.nama,
          kode: item.kode,
          qty: item.qty * item.konversi,
          satuan: item.satuan,
          displayQty: item.qty,
          keterangan: form.ket || item.ket,
          user: user.username,
          supplier: form.supplier,
          noSJ: form.noSJ,
          noPO: form.noPO
        });
      }
      setItems([]);
      await refresh();
      toast('Transaksi cloud berhasil disimpan!', 'success');
    } catch (err: any) {
      toast('Gagal menyimpan transaksi: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
      <div className="lg:col-span-1">
        <Card title="Detail Global" icon={PackagePlus}>
          <div className="space-y-4">
            <Input label="Tanggal" type="date" value={form.tgl} onChange={(e:any) => setForm({...form, tgl: e.target.value})} />
            {type === 'MASUK' && (
              <>
                <Input label="No SJ" placeholder="SJ-..." value={form.noSJ} onChange={(e:any) => setForm({...form, noSJ: e.target.value})} />
                <div className="w-full">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">Supplier</label>
                  <select className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200"
                    value={form.supplier} onChange={(e:any) => setForm({...form, supplier: e.target.value})}>
                    <option value="">Pilih Supplier</option>
                    {suppliers?.map((s:any) => <option key={s.id} value={s.nama}>{s.nama}</option>)}
                  </select>
                </div>
              </>
            )}
            <Input label="Ket" value={form.ket} onChange={(e:any) => setForm({...form, ket: e.target.value})} />
            <div className="pt-4 border-t border-white/5">
                <Button variant="success" className="w-full" onClick={submitTransaction} disabled={items.length === 0 || isSubmitting}>
                   {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} SIMPAN CLOUD
                </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
        <Card className="!p-4 overflow-visible relative z-50">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <ProductAutocomplete ref={searchInputRef} products={products} stock={stock} onSelect={handleProductSelect} />
            <div className="w-24 shrink-0">
              <Input ref={qtyInputRef} label="Qty" type="number" value={currentEntry.qty || ''} onChange={(e:any) => setCurrentEntry({...currentEntry, qty: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="w-32 shrink-0">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">Satuan</label>
                <select className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200"
                  value={currentEntry.satuan}
                  onChange={(e:any) => {
                    const unit = e.target.value;
                    let conv = 1;
                    if (unit === selectedProduct?.satuanAlt1) conv = selectedProduct.konversiAlt1 || 1;
                    setCurrentEntry({...currentEntry, satuan: unit, konversi: conv});
                  }}
                  disabled={!selectedProduct}>
                  {selectedProduct ? (
                    <>
                      <option value={selectedProduct.satuanDefault}>{selectedProduct.satuanDefault}</option>
                      {selectedProduct.satuanAlt1 && <option value={selectedProduct.satuanAlt1}>{selectedProduct.satuanAlt1}</option>}
                    </>
                  ) : <option>Pilih Produk</option>}
                </select>
            </div>
            <Button className="h-[42px] px-6 shrink-0" onClick={addItem} disabled={!currentEntry.kode || currentEntry.qty <= 0}><Plus size={20} /></Button>
          </div>
        </Card>

        <Card title="Daftar Entri" icon={ClipboardCheck} className="flex-1 min-h-0 overflow-hidden relative z-10">
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {items.length > 0 ? items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group animate-in slide-in-from-top-4 duration-300">
                    <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold ${type === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            <span className="text-lg leading-none">{item.qty}</span>
                            <span className="text-[8px] uppercase">{item.satuan}</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-100">{item.nama}</h4>
                            <p className="text-xs text-slate-500 font-mono tracking-tighter">{item.kode}</p>
                        </div>
                    </div>
                    <button onClick={() => removeItem(idx)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={18} />
                    </button>
                </div>
                )) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 py-20">
                    <PackagePlus size={48} className="opacity-10" />
                    <p className="text-sm font-medium">Kosong. Tambahkan item di atas.</p>
                </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
}
