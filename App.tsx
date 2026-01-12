
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
  XCircle
} from 'lucide-react';
import { Role, User, Transaction, Product, Supplier, StockState } from './types';
import { TAB_CONFIG } from './constants';
import { warehouseService } from './services/warehouseService';
import { geminiService } from './services/geminiService';

// --- Toast System ---

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

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

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast Function
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<StockState>({});
  const [aiInsights, setAiInsights] = useState<string>('Loading AI insights...');

  useEffect(() => {
    const savedUser = localStorage.getItem('wareflow_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts(warehouseService.getProducts());
    setSuppliers(warehouseService.getSuppliers());
    setTransactions(warehouseService.getTransactions());
    setStock(warehouseService.getStockState());
  };

  useEffect(() => {
    if (activeTab === 'dashboard' && user) {
      fetchAiInsights();
    }
  }, [activeTab, user]);

  const fetchAiInsights = async () => {
    setAiInsights('Analyzing current trends...');
    const result = await geminiService.getStockInsights(products, stock, transactions);
    setAiInsights(result || 'No insights available.');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const allUsers = warehouseService.getUsers();
    const found = allUsers.find(u => u.username === loginForm.username);
    
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
        {/* Toast Container for Login Screen */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>

        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
              <PackagePlus size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Wareflow MLASS</h1>
            <p className="text-slate-400 mt-2">Warehouse Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input 
              label="Username" 
              value={loginForm.username} 
              onChange={(e: any) => setLoginForm({ ...loginForm, username: e.target.value })} 
              required 
            />
            <Input 
              label="Password" 
              type="password" 
              value={loginForm.password} 
              onChange={(e: any) => setLoginForm({ ...loginForm, password: e.target.value })} 
              required 
            />
            <Button className="w-full h-12 text-lg" type="submit">LOG IN</Button>
            <div className="text-center text-xs text-slate-500">
              Initial password: <span className="text-slate-300">admin123</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Global Toast Container */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>

      <aside className={`transition-all duration-300 glass-panel border-r border-white/10 flex flex-col h-full z-40 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <PackagePlus size={24} className="text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight whitespace-nowrap">Wareflow</span>}
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
          {allowedTabs.map(key => {
            const config = TAB_CONFIG[key];
            const Icon = (config as any).icon === 'LayoutDashboard' ? LayoutDashboard :
                         (config as any).icon === 'PackagePlus' ? PackagePlus :
                         (config as any).icon === 'PackageMinus' ? PackageMinus :
                         (config as any).icon === 'ClipboardCheck' ? ClipboardCheck :
                         (config as any).icon === 'History' ? History :
                         (config as any).icon === 'Truck' ? Truck : ShieldCheck;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${activeTab === key ? 'bg-blue-600/20 text-blue-400 shadow-sm border border-blue-500/20' : 'hover:bg-white/5 text-slate-400'}`}
              >
                <div className={`${activeTab === key ? 'text-blue-400' : 'group-hover:text-slate-300'}`}>
                  <Icon size={22} />
                </div>
                {isSidebarOpen && <span className="font-medium">{config.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shrink-0 glass-panel z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold tracking-tight text-white capitalize">{activeTab.replace('-', ' ')}</h2>
            <button 
              onClick={() => { refreshData(); showToast('Data diperbarui', 'info'); }}
              className="p-2 hover:bg-white/5 rounded-full text-cyan-400 ml-2"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
              <UserIcon size={16} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">{user.username}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
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

// --- Specific Views ---

function DashboardView({ stock, products, transactions, insights, refresh }: any) {
  const lowStockItems = products.filter((p: Product) => (stock[p.kode] || 0) < p.minStok);
  
  const stats = [
    { label: 'Total Items', val: products.length, icon: PackagePlus, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Low Stock', val: lowStockItems.length, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Total Inbound', val: transactions.filter((t:any) => t.jenis === 'MASUK').length, icon: PackagePlus, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Outbound', val: transactions.filter((t:any) => t.jenis === 'KELUAR').length, icon: PackageMinus, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
              <h3 className="text-2xl font-bold text-white">{s.val}</h3>
            </div>
          </div>
        </Card>
      ))}

      <Card title="AI Stock Insights" icon={Bell} className="lg:col-span-2">
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 min-h-[100px]">
          {insights}
        </div>
        <div className="flex justify-end mt-2">
          <Button variant="outline" className="text-xs py-1.5 h-auto" onClick={() => refresh()}>
             <RefreshCw size={14} className="mr-1" /> Re-analyze
          </Button>
        </div>
      </Card>

      <Card title="Critical Stock Alerts" icon={AlertTriangle} className="lg:col-span-2">
        <div className="space-y-3">
          {lowStockItems.length > 0 ? lowStockItems.map((p: Product) => (
            <div key={p.kode} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <div>
                  <p className="text-sm font-semibold text-white">{p.nama}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{p.kode}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-rose-400">{stock[p.kode] || 0} / {p.minStok}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Stok Saat Ini</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              Semua item berada di atas level stok minimum.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function TransactionView({ type, products, suppliers, stock, refresh, user, toast }: any) {
  const [items, setItems] = useState<any[]>([]);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    tgl: new Date().toISOString().split('T')[0],
    noSJ: '',
    supplier: '',
    noPO: '',
    ket: ''
  });
  
  const [currentEntry, setCurrentEntry] = useState({
    kode: '',
    nama: '',
    qty: 0,
    satuan: '',
    konversi: 1,
    ket: ''
  });

  const selectedProduct = useMemo(() => products.find((p: Product) => p.kode === currentEntry.kode), [currentEntry.kode, products]);

  const handleProductSelect = (p: Product) => {
    setCurrentEntry({
      ...currentEntry,
      kode: p.kode,
      nama: p.nama,
      satuan: p.satuanDefault,
      konversi: 1
    });
    setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
    }, 50);
  };

  const addItem = useCallback(() => {
    if (!currentEntry.kode) return;
    if (currentEntry.qty <= 0) {
      toast("Jumlah harus lebih dari 0", "error");
      return;
    }
    
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
    toast(`Berhasil menambahkan ${currentEntry.nama}`, 'success');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  }, [currentEntry, items, stock, type, selectedProduct, toast]);

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
      e.preventDefault();
    }
  };

  const removeItem = (idx: number) => {
    const item = items[idx];
    setItems(items.filter((_, i) => i !== idx));
    toast(`Menghapus ${item.nama} dari daftar`, 'info');
  };

  const submitTransaction = () => {
    if (items.length === 0) return;
    items.forEach(item => {
      warehouseService.saveTransaction({
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
    });
    setItems([]);
    refresh();
    toast('Transaksi berhasil disimpan ke sistem!', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
      <div className="lg:col-span-1">
        <Card title="Detail Global" icon={PackagePlus}>
          <div className="space-y-4">
            <Input label="Tanggal" type="date" value={form.tgl} onChange={(e:any) => setForm({...form, tgl: e.target.value})} />
            {type === 'MASUK' && (
              <>
                <Input label="No Surat Jalan" placeholder="SJ-..." value={form.noSJ} onChange={(e:any) => setForm({...form, noSJ: e.target.value})} />
                <div className="w-full">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">Supplier</label>
                  <select 
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                    value={form.supplier}
                    onChange={(e:any) => setForm({...form, supplier: e.target.value})}
                  >
                    <option value="">Pilih Supplier</option>
                    {suppliers?.map((s:any) => <option key={s.id} value={s.nama}>{s.nama}</option>)}
                  </select>
                </div>
              </>
            )}
            <Input label="Catatan Umum" placeholder="Opsional..." value={form.ket} onChange={(e:any) => setForm({...form, ket: e.target.value})} />
            <div className="pt-4 border-t border-white/5">
                <Button variant="success" className="w-full" onClick={submitTransaction} disabled={items.length === 0}>
                   <Save size={18} /> SIMPAN SEMUA
                </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
        <Card className="!p-4 overflow-visible relative z-50">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <ProductAutocomplete 
              ref={searchInputRef}
              products={products} 
              stock={stock} 
              onSelect={handleProductSelect} 
            />

            <div className="w-24 shrink-0">
              <Input 
                ref={qtyInputRef}
                label="Qty" 
                type="number" 
                value={currentEntry.qty || ''} 
                onChange={(e:any) => setCurrentEntry({...currentEntry, qty: parseFloat(e.target.value) || 0})}
                onKeyDown={handleQtyKeyDown}
              />
            </div>

            <div className="w-32 shrink-0">
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">Satuan</label>
                <select 
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  value={currentEntry.satuan}
                  onChange={(e:any) => {
                    const unit = e.target.value;
                    let conv = 1;
                    if (unit === selectedProduct?.satuanAlt1) conv = selectedProduct.konversiAlt1 || 1;
                    if (unit === selectedProduct?.satuanAlt2) conv = selectedProduct.konversiAlt2 || 1;
                    setCurrentEntry({...currentEntry, satuan: unit, konversi: conv});
                  }}
                  disabled={!selectedProduct}
                >
                  {selectedProduct ? (
                    <>
                      <option value={selectedProduct.satuanDefault}>{selectedProduct.satuanDefault}</option>
                      {selectedProduct.satuanAlt1 && <option value={selectedProduct.satuanAlt1}>{selectedProduct.satuanAlt1}</option>}
                      {selectedProduct.satuanAlt2 && <option value={selectedProduct.satuanAlt2}>{selectedProduct.satuanAlt2}</option>}
                    </>
                  ) : <option>Pilih Produk</option>}
                </select>
            </div>

            <Button 
                className="h-[42px] px-6 shrink-0" 
                onClick={addItem} 
                disabled={!currentEntry.kode || currentEntry.qty <= 0}
            >
                <Plus size={20} />
            </Button>
          </div>
          {currentEntry.konversi > 1 && (
            <div className="mt-2 text-[10px] text-cyan-400/70 font-bold ml-1">
              * Logika Konversi: {currentEntry.qty} {currentEntry.satuan} = {currentEntry.qty * currentEntry.konversi} {selectedProduct?.satuanDefault}
            </div>
          )}
        </Card>

        <Card title="Daftar Entri" icon={ClipboardCheck} className="flex-1 min-h-0 overflow-hidden relative z-10">
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {items.length > 0 ? items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold ${type === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : type === 'KELUAR' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            <span className="text-lg leading-none">{item.qty}</span>
                            <span className="text-[8px] uppercase">{item.satuan}</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-100">{item.nama}</h4>
                            <p className="text-xs text-slate-500 font-mono tracking-tighter">
                              {item.kode} {item.konversi > 1 && `(${item.qty * item.konversi} ${products.find((p:any)=>p.kode===item.kode)?.satuanDefault})`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => removeItem(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                )) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 py-20">
                    <PackagePlus size={48} className="opacity-10" />
                    <p className="text-sm font-medium">Belum ada barang dalam daftar. Cari produk dan masukkan jumlahnya.</p>
                </div>
                )}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                 <p className="text-xs text-slate-500 font-medium">Total: <span className="text-slate-200">{items.length} item</span> dalam antrean</p>
                 <p className="text-[10px] text-slate-500 italic">Tip: Gunakan [Enter] untuk berpindah antar kolom</p>
            </div>
        </Card>
      </div>
    </div>
  );
}

function HistoryView({ transactions, products, toast }: any) {
  const [filter, setFilter] = useState('');
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(null);
  
  const filtered = useMemo(() => {
    let list = transactions;
    if (selectedProductCode) {
      list = list.filter((t: any) => t.kode === selectedProductCode);
    }
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      list = list.filter((t:any) => 
        t.nama.toLowerCase().includes(lowerFilter) ||
        t.kode.toLowerCase().includes(lowerFilter) ||
        t.jenis.toLowerCase().includes(lowerFilter)
      );
    }
    return list;
  }, [filter, transactions, selectedProductCode]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast("Tidak ada data untuk diekspor", "warning");
      return;
    }
    const headers = "ID,Date,Time,Type,Code,Name,BaseQty,Unit,DisplayQty,Notes,User\n";
    const rows = filtered.map((t:any) => 
      `${t.id},${t.tgl},${t.waktu},${t.jenis},${t.kode},"${t.nama}",${t.qty},${t.satuan},${t.displayQty || t.qty},"${t.keterangan || ''}",${t.user}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast("Ekspor CSV berhasil!", "success");
  };

  const handleProductSelect = (p: Product) => {
    setSelectedProductCode(p.kode);
    toast(`Filter produk: ${p.nama}`, 'info');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        <div className="w-full lg:w-1/3 overflow-visible z-[60]">
          <ProductAutocomplete 
            products={products} 
            onSelect={handleProductSelect} 
            placeholder="Filter berdasarkan produk..."
          />
        </div>
        
        <div className="flex-1 w-full">
           <Input 
            label="Cari Kata Kunci"
            placeholder="Cari catatan, user, jenis..."
            value={filter}
            onChange={(e:any) => setFilter(e.target.value)}
          />
        </div>

        {selectedProductCode && (
          <Button variant="ghost" onClick={() => { setSelectedProductCode(null); toast('Filter produk dibersihkan', 'info'); }} className="h-[42px]">
            Hapus Filter
          </Button>
        )}

        <Button variant="outline" onClick={exportCsv} className="h-[42px]">
          <FileDown size={18} className="mr-2" /> Export to CSV
        </Button>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Tanggal / Jam</th>
                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Jenis</th>
                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Produk</th>
                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Qty</th>
                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Referensi</th>
                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((t:any) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-slate-200">{t.tgl}</p>
                    <p className="text-[10px] text-slate-500">{t.waktu}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={t.jenis === 'MASUK' ? 'success' : t.jenis === 'KELUAR' ? 'info' : 'warning'}>
                      {t.jenis}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-200">{t.nama}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{t.kode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-200">{t.displayQty || t.qty}</span> <span className="text-[10px] text-slate-500 font-bold">{t.satuan}</span>
                    {t.displayQty && t.displayQty !== t.qty && (
                      <p className="text-[9px] text-slate-500">({t.qty} unit dasar)</p>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-[150px] truncate text-slate-400 text-xs">
                    {t.noSJ || t.supplier || t.keterangan || '-'}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">
                    {t.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              Tidak ada riwayat yang ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SupplierView({ suppliers, refresh, toast }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const handleSave = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data: any = {
      id: editItem?.id || `SUP-${Date.now()}`,
      nama: formData.get('nama'),
      alamat: formData.get('alamat'),
      telp: formData.get('telp'),
      pic: formData.get('pic'),
      ket: formData.get('ket'),
    };
    warehouseService.saveSupplier(data);
    setIsModalOpen(false);
    refresh();
    toast(`Data supplier ${data.nama} berhasil disimpan`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Kelola Supplier</h3>
        <Button onClick={() => { setEditItem(null); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" /> Tambah Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s:any) => (
          <Card key={s.id}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-white">{s.nama}</h4>
                <p className="text-sm text-slate-400">{s.pic || 'PIC Tidak Terdaftar'}</p>
              </div>
              <Button variant="ghost" className="p-2 h-auto" onClick={() => { setEditItem(s); setIsModalOpen(true); }}>
                Edit
              </Button>
            </div>
            <div className="space-y-2 text-xs text-slate-500 border-t border-white/5 pt-3">
              <p><span className="font-bold text-slate-400">TELP:</span> {s.telp || '-'}</p>
              <p><span className="font-bold text-slate-400">ALAMAT:</span> {s.alamat || '-'}</p>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{editItem ? 'Edit' : 'Tambah'} Supplier</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Nama Supplier" name="nama" defaultValue={editItem?.nama} required />
              <Input label="Alamat" name="alamat" defaultValue={editItem?.alamat} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Telepon" name="telp" defaultValue={editItem?.telp} />
                <Input label="Nama PIC" name="pic" defaultValue={editItem?.pic} />
              </div>
              <Input label="Keterangan" name="ket" defaultValue={editItem?.ket} />
              <Button className="w-full h-12" type="submit">SIMPAN SUPPLIER</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminView({ users, refresh, currentUser, toast }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const handleSave = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data: any = {
      username: formData.get('username'),
      role: formData.get('role'),
      active: formData.get('active') === 'on',
    };
    warehouseService.saveUser(data);
    setIsModalOpen(false);
    refresh();
    toast(`User ${data.username} berhasil disimpan`, 'success');
  };

  const deleteUser = (username: string) => {
    if (username === currentUser.username) {
      toast("Tidak dapat menghapus akun sendiri", "error");
      return;
    }
    if (confirm(`Hapus user ${username}?`)) {
      warehouseService.deleteUser(username);
      refresh();
      toast(`User ${username} telah dihapus`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">User Sistem</h3>
        <Button onClick={() => { setEditItem(null); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" /> Tambah User Baru
        </Button>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Username</th>
              <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Role</th>
              <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u:any) => (
              <tr key={u.username} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-200">{u.username}</span>
                  {u.username === currentUser.username && <Badge variant="info">ANDA</Badge>}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={u.role === 'ADMIN' ? 'danger' : 'success'}>{u.role}</Badge>
                </td>
                <td className="px-6 py-4">
                  {u.active ? <span className="text-emerald-400">● Aktif</span> : <span className="text-rose-400">● Nonaktif</span>}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => { setEditItem(u); setIsModalOpen(true); }} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400">
                    Edit
                  </button>
                  <button onClick={() => deleteUser(u.username)} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{editItem ? 'Edit' : 'Baru'} User</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Username" name="username" defaultValue={editItem?.username} readOnly={!!editItem} required />
              <div className="w-full">
                <label className="block text-xs text-slate-400 mb-1.5 ml-1">Role</label>
                <select 
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  name="role"
                  defaultValue={editItem?.role || 'STAFF'}
                >
                  <option>ADMIN</option>
                  <option>STAFF</option>
                  <option>VIEWER</option>
                </select>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                <input type="checkbox" name="active" defaultChecked={editItem ? editItem.active : true} className="w-5 h-5 accent-cyan-500" />
                <label className="text-slate-300 font-medium">Akun aktif</label>
              </div>
              <Button className="w-full h-12" type="submit">SIMPAN USER</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
