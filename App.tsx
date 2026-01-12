
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, 
  ShieldCheck, LogOut, Menu, User as UserIcon, Bell, Search, RefreshCw, Plus, 
  Trash2, Save, X, FileDown, CheckCircle2, Info, XCircle, Loader2, AlertTriangle, ChevronRight, UserPlus
} from 'lucide-react';
import { Role, User, Transaction, Product, Supplier, StockState } from './types';
import { TAB_CONFIG, INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_SUPPLIERS } from './constants';
import { warehouseService } from './services/warehouseService';
import { geminiService } from './services/geminiService';

// --- Shared UI Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }: any) => {
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg",
    ghost: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = React.forwardRef(({ label, ...props }: any, ref: any) => (
  <div className="w-full">
    {label && <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">{label}</label>}
    <input ref={ref} {...props} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors" />
  </div>
));

const Select = ({ label, options, ...props }: any) => (
  <div className="w-full">
    {label && <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1 tracking-widest">{label}</label>}
    <select {...props} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors appearance-none">
      {options.map((opt: any) => <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>)}
    </select>
  </div>
);

const Card = ({ children, title, icon: Icon, className = "" }: any) => (
  <div className={`glass-panel p-5 rounded-2xl flex flex-col gap-4 ${className}`}>
    {title && (
      <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm uppercase tracking-wider">
        {Icon && <Icon size={18} />} {title}
      </div>
    )}
    {children}
  </div>
);

const Badge = ({ children, variant = 'info' }: any) => {
  const variants: any = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${variants[variant]}`}>{children}</span>;
};

// --- Toast Item Component to fix "Cannot find name 'ToastItem'" error ---
const ToastItem = ({ toast, onRemove }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons: any = {
    success: <CheckCircle2 size={18} className="text-emerald-400" />,
    error: <XCircle size={18} className="text-rose-400" />,
    info: <Info size={18} className="text-cyan-400" />,
  };

  const bgColors: any = {
    success: "bg-emerald-500/10 border-emerald-500/20",
    error: "bg-rose-500/10 border-rose-500/20",
    info: "bg-cyan-500/10 border-cyan-500/20",
  };

  return (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl animate-in slide-in-from-right duration-300 shadow-2xl ${bgColors[toast.type] || bgColors.info}`}>
      {icons[toast.type] || icons.info}
      <span className="text-sm font-bold tracking-tight">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
};

// --- View: Transaction Form (Masuk/Keluar/Opname) ---
function TransactionView({ type, products, suppliers, user, onSave, loading }: any) {
  const [formData, setFormData] = useState({
    kode: '',
    qty: '',
    satuan: '',
    supplier: '',
    noSJ: '',
    noPO: '',
    keterangan: ''
  });

  const selectedProduct = products.find((p: any) => p.kode === formData.kode);
  
  const unitOptions = useMemo(() => {
    if (!selectedProduct) return [{ value: '', label: 'Pilih Barang Dulu' }];
    const opts = [{ value: selectedProduct.satuanDefault, label: selectedProduct.satuanDefault }];
    if (selectedProduct.satuanAlt1) opts.push({ value: selectedProduct.satuanAlt1, label: selectedProduct.satuanAlt1 });
    if (selectedProduct.satuanAlt2) opts.push({ value: selectedProduct.satuanAlt2, label: selectedProduct.satuanAlt2 });
    return opts;
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct && !formData.satuan) {
      setFormData(prev => ({ ...prev, satuan: selectedProduct.satuanDefault }));
    }
  }, [selectedProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode || !formData.qty) return;

    // Hitung qty base
    let baseQty = Number(formData.qty);
    if (selectedProduct) {
      if (formData.satuan === selectedProduct.satuanAlt1) baseQty *= (selectedProduct.konversiAlt1 || 1);
      if (formData.satuan === selectedProduct.satuanAlt2) baseQty *= (selectedProduct.konversiAlt2 || 1);
    }

    onSave({
      ...formData,
      jenis: type.toUpperCase(),
      nama: selectedProduct?.nama || '',
      qty: baseQty,
      displayQty: Number(formData.qty),
      user: user.username,
      tgl: new Date().toISOString().split('T')[0]
    });

    setFormData({ kode: '', qty: '', satuan: '', supplier: '', noSJ: '', noPO: '', keterangan: '' });
  };

  return (
    <Card title={`Transaksi Stok ${type}`} icon={type === 'masuk' ? PackagePlus : type === 'keluar' ? PackageMinus : ClipboardCheck}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Select 
            label="Pilih Barang" 
            value={formData.kode} 
            onChange={(e: any) => setFormData({ ...formData, kode: e.target.value, satuan: '' })}
            options={[{ value: '', label: '-- Pilih Produk --' }, ...products.map((p: any) => ({ value: p.kode, label: `${p.kode} - ${p.nama}` }))]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Jumlah" type="number" value={formData.qty} onChange={(e: any) => setFormData({ ...formData, qty: e.target.value })} required />
            <Select label="Satuan" value={formData.satuan} onChange={(e: any) => setFormData({ ...formData, satuan: e.target.value })} options={unitOptions} />
          </div>
          {type === 'masuk' && (
            <Select 
              label="Supplier" 
              value={formData.supplier} 
              onChange={(e: any) => setFormData({ ...formData, supplier: e.target.value })}
              options={[{ value: '', label: '-- Pilih Supplier --' }, ...suppliers.map((s: any) => ({ value: s.nama, label: s.nama }))]}
            />
          )}
        </div>
        <div className="space-y-4">
          <Input label="No. Surat Jalan / Referensi" value={formData.noSJ} onChange={(e: any) => setFormData({ ...formData, noSJ: e.target.value })} />
          <Input label="Keterangan" value={formData.keterangan} onChange={(e: any) => setFormData({ ...formData, keterangan: e.target.value })} />
          <div className="pt-4">
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} SIMPAN TRANSAKSI
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

// --- View: Supplier ---
function SupplierView({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <Card title="Daftar Supplier" icon={Truck}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-white/5">
            <tr><th className="p-3">Nama</th><th className="p-3">PIC</th><th className="p-3">Telepon</th><th className="p-3">Alamat</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-white/[0.02]">
                <td className="p-3 font-bold text-cyan-400">{s.nama}</td>
                <td className="p-3">{s.pic}</td>
                <td className="p-3">{s.telp}</td>
                <td className="p-3 opacity-60">{s.alamat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// --- View: Admin ---
function AdminView({ products }: { products: Product[] }) {
  return (
    <div className="space-y-6">
      <Card title="Master Data Barang" icon={ShieldCheck}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-white/5">
              <tr><th className="p-3">Kode</th><th className="p-3">Nama Barang</th><th className="p-3">Satuan</th><th className="p-3 text-right">Min Stok</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map(p => (
                <tr key={p.kode} className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono text-xs">{p.kode}</td>
                  <td className="p-3 font-medium">{p.nama}</td>
                  <td className="p-3 text-xs opacity-60">{p.satuanDefault} / {p.satuanAlt1 || '-'}</td>
                  <td className="p-3 text-right font-bold text-amber-400">{p.minStok}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// --- View: History ---
function HistoryView({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card title="Riwayat Transaksi" icon={History}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-white/5">
            <tr><th className="p-3">Tanggal</th><th className="p-3">Jenis</th><th className="p-3">Barang</th><th className="p-3 text-right">Qty</th><th className="p-3">User</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.length > 0 ? transactions.slice().reverse().slice(0, 50).map((t, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-xs opacity-50">{t.tgl}</td>
                <td className="p-3"><Badge variant={t.jenis === 'MASUK' ? 'success' : t.jenis === 'KELUAR' ? 'danger' : 'info'}>{t.jenis}</Badge></td>
                <td className="p-3">
                  <span className="font-medium">{t.nama}</span>
                  <div className="text-[10px] opacity-40">{t.kode} {t.noSJ ? `| Ref: ${t.noSJ}` : ''}</div>
                </td>
                <td className="p-3 text-right font-bold">{t.displayQty || t.qty} <span className="text-[10px] opacity-40 font-normal">{t.satuan}</span></td>
                <td className="p-3 text-[10px] font-bold uppercase opacity-40">{t.user}</td>
              </tr>
            )) : <tr><td colSpan={5} className="p-12 text-center opacity-30 italic">Belum ada aktivitas terekam.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// --- View: Dashboard ---
function DashboardView({ stock, products, transactions, insights }: any) {
  const lowStock = products.filter((p: any) => (stock[p.kode] || 0) < p.minStok);
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total SKU" icon={LayoutDashboard}><div className="text-3xl font-black">{products.length}</div></Card>
        <Card title="Stok Kritis" icon={AlertTriangle}><div className="text-3xl font-black text-rose-500">{lowStock.length}</div></Card>
        <Card title="Transaksi" icon={History}><div className="text-3xl font-black text-cyan-500">{transactions.length}</div></Card>
        <Card title="Sync Status" icon={RefreshCw}><Badge variant="success">Cloud Online</Badge></Card>
      </div>
      <Card title="AI Analyst Insights" icon={Bell} className="border-cyan-500/20 bg-cyan-500/[0.02]">
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5">
          <p className="text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">{insights}</p>
        </div>
      </Card>
      <Card title="Peringatan Stok Rendah" icon={AlertTriangle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-white/5">
              <tr><th className="p-3">Nama Barang</th><th className="p-3 text-right">Stok</th><th className="p-3 text-right">Minimum</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {lowStock.length > 0 ? lowStock.map((p: any) => (
                <tr key={p.kode} className="border-t border-white/5">
                  <td className="p-3 font-bold">{p.nama}</td>
                  <td className="p-3 text-right text-rose-500 font-black">{stock[p.kode] || 0}</td>
                  <td className="p-3 text-right opacity-40">{p.minStok}</td>
                  <td className="p-3"><Badge variant="danger">RESTOCK</Badge></td>
                </tr>
              )) : <tr><td colSpan={4} className="p-10 text-center text-emerald-400 font-bold">Semua stok terpenuhi.</td></tr>}
            </tbody>
          </table>
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
  const [toasts, setToasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<StockState>({});
  const [aiInsights, setAiInsights] = useState<string>('Memulai audit AI...');

  const showToast = useCallback((message: string, type: string = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const result = await warehouseService.getAllData();
      if (result && !result.error) {
        setProducts(result.products || INITIAL_PRODUCTS);
        setSuppliers(result.suppliers || INITIAL_SUPPLIERS);
        setTransactions(result.transactions || []);
        setStock(warehouseService.calculateStock(result.transactions, result.products || INITIAL_PRODUCTS));
      }
    } catch (err) {
      showToast('Gagal memuat data cloud', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async (data: any) => {
    setLoading(true);
    try {
      const res = await warehouseService.saveTransaction(data);
      if (res.error) throw new Error(res.error);
      showToast('Transaksi Berhasil Disimpan!', 'success');
      refreshData();
      setActiveTab('riwayat');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan transaksi', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = INITIAL_USERS.find(u => u.username === loginForm.username);
    if (found && loginForm.password === 'admin123') {
      setUser(found);
      localStorage.setItem('wareflow_session', JSON.stringify(found));
      showToast(`Selamat datang, ${found.username}!`, 'success');
    } else {
      showToast('Login Gagal. Cek Kredensial.', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wareflow_session');
    showToast('Sesi Berakhir', 'info');
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-[#070b14]">
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
          {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
        </div>
        <div className="w-full max-w-md glass-panel p-12 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6">
              <PackagePlus size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">WAREFLOW</h1>
            <p className="text-slate-500 mt-2 text-xs uppercase tracking-[0.4em] font-bold opacity-70">Inventory Management System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input label="Username" value={loginForm.username} onChange={(e: any) => setLoginForm({ ...loginForm, username: e.target.value })} required />
            <Input label="Password" type="password" value={loginForm.password} onChange={(e: any) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            <Button className="w-full h-16 text-xl font-black" type="submit">LOGIN SYSTEM</Button>
          </form>
        </div>
      </div>
    );
  }

  const icons: any = { LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, ShieldCheck };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070b14] text-slate-200">
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
      </div>

      <aside className={`transition-all duration-500 glass-panel border-r border-white/5 flex flex-col h-full z-40 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <PackagePlus size={28} className="text-white" />
          </div>
          {isSidebarOpen && <span className="font-black text-2xl tracking-tighter whitespace-nowrap">WAREFLOW</span>}
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {Object.keys(TAB_CONFIG).filter(key => TAB_CONFIG[key].roles.includes(user.role)).map(key => {
            const config = TAB_CONFIG[key];
            const IconComp = icons[config.icon] || LayoutDashboard;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === key ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'hover:bg-white/5 text-slate-500'}`}>
                <div className="shrink-0"><IconComp size={24} /></div>
                {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{config.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-colors">
            <LogOut size={24} /> {isSidebarOpen && <span className="font-black text-sm uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-24 border-b border-white/5 px-10 flex items-center justify-between glass-panel z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 transition-colors"><Menu size={24}/></button>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-white tracking-tight capitalize">{activeTab}</h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <button onClick={refreshData} className={`p-3 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-2xl transition-all ${loading ? 'animate-spin' : ''}`}>
               <RefreshCw size={22} />
             </button>
             <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-lg shadow-lg">{user.username[0].toUpperCase()}</div>
               <div className="flex flex-col">
                 <span className="text-sm font-black text-white leading-none">{user.username}</span>
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{user.role}</span>
               </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 relative scroll-smooth">
          {loading && <div className="absolute inset-0 bg-[#070b14]/60 backdrop-blur-xl flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-6 p-10 glass-panel rounded-[3rem] border border-white/10">
              <Loader2 className="animate-spin text-cyan-400" size={64}/>
              <span className="text-xs font-black tracking-[0.5em] text-cyan-400 uppercase">Synchronizing...</span>
            </div>
          </div>}
          
          <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {activeTab === 'dashboard' && <DashboardView stock={stock} products={products} transactions={transactions} insights={aiInsights} />}
            {activeTab === 'masuk' && <TransactionView type="masuk" products={products} suppliers={suppliers} user={user} onSave={handleSaveTransaction} loading={loading} />}
            {activeTab === 'keluar' && <TransactionView type="keluar" products={products} user={user} onSave={handleSaveTransaction} loading={loading} />}
            {activeTab === 'opname' && <TransactionView type="opname" products={products} user={user} onSave={handleSaveTransaction} loading={loading} />}
            {activeTab === 'riwayat' && <HistoryView transactions={transactions} />}
            {activeTab === 'supplier' && <SupplierView suppliers={suppliers} />}
            {activeTab === 'admin' && <AdminView products={products} />}
          </div>
        </main>
      </div>
    </div>
  );
}
