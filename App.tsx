
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, 
  ShieldCheck, LogOut, Menu, User as UserIcon, Bell, Search, RefreshCw, Plus, 
  Trash2, Save, X, FileDown, CheckCircle2, Info, XCircle, Loader2, AlertTriangle, ChevronRight
} from 'lucide-react';
import { Role, User, Transaction, Product, Supplier, StockState } from './types';
import { TAB_CONFIG, INITIAL_PRODUCTS, INITIAL_USERS } from './constants';
import { warehouseService } from './services/warehouseService';
import { geminiService } from './services/geminiService';

// --- Shared UI Components ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }: any) => {
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
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

// --- Toast Component ---
const ToastItem = ({ toast, onRemove }: { toast: any, onRemove: (id: string) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);
  return (
    <div className="flex items-center gap-3 p-4 glass-panel rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-right-full min-w-[300px]">
      <div className="shrink-0">{toast.type === 'error' ? <XCircle className="text-rose-400" /> : <CheckCircle2 className="text-emerald-400" />}</div>
      <p className="flex-1 text-sm font-medium text-slate-200">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="p-1 hover:bg-white/10 rounded-full"><X size={14} /></button>
    </div>
  );
};

// --- View: History ---
function HistoryView({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card title="Riwayat Transaksi" icon={History}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-white/5">
            <tr><th className="p-3">Tanggal</th><th className="p-3">Jenis</th><th className="p-3">Barang</th><th className="p-3 text-right">Qty</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.length > 0 ? transactions.slice(0, 50).map((t, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-xs">{t.tgl}</td>
                <td className="p-3"><Badge variant={t.jenis === 'MASUK' ? 'success' : 'danger'}>{t.jenis}</Badge></td>
                <td className="p-3">{t.nama} <br/><span className="text-[10px] text-slate-500">{t.kode}</span></td>
                <td className="p-3 text-right font-bold">{t.qty} <span className="text-[10px] opacity-50">{t.satuan}</span></td>
              </tr>
            )) : <tr><td colSpan={4} className="p-10 text-center opacity-30 italic">Belum ada riwayat.</td></tr>}
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
        <Card title="Total SKU" icon={LayoutDashboard}><div className="text-3xl font-bold">{products.length}</div></Card>
        <Card title="Stok Kritis" icon={AlertTriangle}><div className="text-3xl font-bold text-rose-400">{lowStock.length}</div></Card>
        <Card title="Transaksi" icon={History}><div className="text-3xl font-bold text-cyan-400">{transactions.length}</div></Card>
        <Card title="AI Analyst" icon={Bell}><Badge variant="success">Active</Badge></Card>
      </div>
      <Card title="AI Insights" icon={Bell} className="border-cyan-500/20">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <p className="text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">{insights}</p>
        </div>
      </Card>
      <Card title="Stok Dibawah Minimum" icon={AlertTriangle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-white/5">
              <tr><th className="p-3">Nama Barang</th><th className="p-3">Kode</th><th className="p-3 text-right">Stok Saat Ini</th><th className="p-3 text-right">Min</th></tr>
            </thead>
            <tbody>
              {lowStock.length > 0 ? lowStock.map((p: any) => (
                <tr key={p.kode} className="border-t border-white/5">
                  <td className="p-3 font-medium">{p.nama}</td>
                  <td className="p-3 font-mono text-xs opacity-50">{p.kode}</td>
                  <td className="p-3 text-right text-rose-400 font-bold">{stock[p.kode] || 0}</td>
                  <td className="p-3 text-right text-slate-400">{p.minStok}</td>
                </tr>
              )) : <tr><td colSpan={4} className="p-8 text-center text-emerald-400 text-sm">Semua stok dalam kondisi aman.</td></tr>}
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<StockState>({});
  const [aiInsights, setAiInsights] = useState<string>('Memulai analisis stok...');

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
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        setProducts(result.products || INITIAL_PRODUCTS);
        setSuppliers(result.suppliers || []);
        setTransactions(result.transactions || []);
        setStock(warehouseService.calculateStock(result.transactions, result.products || INITIAL_PRODUCTS));
      }
    } catch (err) {
      showToast('Gagal terhubung ke Cloud Storage', 'error');
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
    const found = warehouseService.getUsers().find(u => u.username === loginForm.username);
    if (found && loginForm.password === 'admin123') {
      const sessionUser = { ...found, lastLogin: new Date().toISOString() };
      setUser(sessionUser);
      localStorage.setItem('wareflow_session', JSON.stringify(sessionUser));
      showToast('Berhasil masuk ke sistem!', 'success');
    } else {
      showToast('Kredensial salah (Default: admin / admin123)', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wareflow_session');
    showToast('Berhasil keluar', 'info');
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-[#070b14]">
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
          {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
        </div>
        <div className="w-full max-w-md glass-panel p-10 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6">
              <PackagePlus size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Wareflow <span className="text-blue-500">MLASS</span></h1>
            <p className="text-slate-500 mt-2 text-xs uppercase tracking-[0.3em] font-bold opacity-70">Secured Cloud Infrastructure</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <Input label="Username" value={loginForm.username} onChange={(e: any) => setLoginForm({ ...loginForm, username: e.target.value })} required />
            <Input label="Password" type="password" value={loginForm.password} onChange={(e: any) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            <Button className="w-full h-14 text-lg font-bold tracking-widest" type="submit">AUTHORIZE ACCESS</Button>
            <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest mt-4">Login default: admin / admin123</p>
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

      <aside className={`transition-all duration-500 glass-panel border-r border-white/5 flex flex-col h-full z-40 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <PackagePlus size={24} className="text-white" />
          </div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tight whitespace-nowrap">WAREFLOW</span>}
        </div>
        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto">
          {Object.keys(TAB_CONFIG).filter(key => TAB_CONFIG[key].roles.includes(user.role)).map(key => {
            const config = TAB_CONFIG[key];
            const isActive = activeTab === key;
            const IconComponent = icons[config.icon] || LayoutDashboard;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-500/10' : 'hover:bg-white/5 text-slate-500 hover:text-slate-300'}`}>
                <div className="shrink-0"><IconComponent size={22} /></div>
                {isSidebarOpen && <span className="font-semibold text-sm">{config.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut size={22} /> {isSidebarOpen && <span className="font-bold text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between glass-panel z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"><Menu size={22}/></button>
            <h2 className="text-xl font-bold text-white tracking-tight capitalize flex items-center gap-3">
              <span className="opacity-30">/</span> {activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-5">
             <button onClick={refreshData} className={`p-2.5 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}>
               <RefreshCw size={20} />
             </button>
             <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-2xl border border-white/5">
               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">{user.username[0].toUpperCase()}</div>
               <div className="flex flex-col">
                 <span className="text-sm font-bold text-white leading-none">{user.username}</span>
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{user.role}</span>
               </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
          {loading && <div className="absolute inset-0 bg-[#070b14]/40 backdrop-blur-md flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-cyan-400" size={56}/>
              <span className="text-xs font-bold tracking-[0.4em] text-cyan-400/50 uppercase">Syncing with Cloud...</span>
            </div>
          </div>}
          
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView stock={stock} products={products} transactions={transactions} insights={aiInsights} />}
            {activeTab === 'riwayat' && <HistoryView transactions={transactions} />}
            
            {(activeTab === 'masuk' || activeTab === 'keluar' || activeTab === 'opname' || activeTab === 'supplier' || activeTab === 'admin') && (
              <div className="flex flex-col items-center justify-center py-32 opacity-20 space-y-6">
                <div className="w-24 h-24 border-2 border-dashed border-slate-400 rounded-3xl flex items-center justify-center">
                  <PackagePlus size={48} />
                </div>
                <div className="text-center">
                  <p className="font-black tracking-[0.5em] uppercase text-lg">Modul {activeTab}</p>
                  <p className="text-sm mt-2">Sinkronisasi fitur sedang berlangsung...</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
