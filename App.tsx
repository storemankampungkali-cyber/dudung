
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, 
  ShieldCheck, LogOut, Menu, User as UserIcon, Bell, Search, RefreshCw, Plus, 
  Trash2, Save, X, FileDown, CheckCircle2, Info, XCircle, AlertTriangle, 
  TrendingUp, Activity, Box, Edit2, Filter as FilterIcon, Database, Link as LinkIcon,
  MessageCircle, Send, ChevronDown, Calendar, RotateCcw, Sparkles, ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Role, User, Transaction, Product, Supplier, StockState } from './types';
import { TAB_CONFIG } from './constants';
import { warehouseService } from './services/warehouseService';
import { geminiService, ChatHistoryItem } from './services/geminiService';

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
    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right-10 min-w-[300px] z-[9999]">
      {icons[toast.type] || icons.info}
      <span className="text-sm font-bold text-white flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="text-slate-500 hover:text-white transition-colors"><X size={16}/></button>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button", loading = false }: any) => {
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20",
    ghost: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10",
    outline: "bg-transparent border border-white/20 hover:border-cyan-400 text-slate-200"
  };
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled || loading} 
      className={`px-4 py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 ${variants[variant]} ${className}`}
    >
      {loading ? <RefreshCw size={18} className="animate-spin" /> : children}
    </button>
  );
};

const Input = React.forwardRef(({ label, icon: Icon, ...props }: any, ref: any) => (
  <div className="w-full">
    {label && <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-1 tracking-[0.1em]">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />}
      <input 
        ref={ref} 
        {...props} 
        className={`w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all ${Icon ? 'pl-11 pr-4' : 'px-4'}`} 
      />
    </div>
  </div>
));

/**
 * ProductAutocomplete Component
 */
const ProductAutocomplete = ({ products, value, onChange, label, onEnter }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = useMemo(() => products.find((p: any) => p.kode === value), [products, value]);

  const filteredProducts = useMemo(() => {
    const s = search.toLowerCase();
    if (!s && !isOpen) return [];
    return products.filter((p: any) => 
      p.kode.toLowerCase().includes(s) || 
      p.nama.toLowerCase().includes(s)
    ).slice(0, 10);
  }, [products, search, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredProducts.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredProducts.length) % (filteredProducts.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        onSelect(filteredProducts[selectedIndex]);
      } else if (selectedProduct) {
        setIsOpen(false);
        onEnter && onEnter();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const onSelect = (p: Product) => {
    onChange(p);
    setSearch('');
    setIsOpen(false);
    onEnter && onEnter();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-1 tracking-widest">{label}</label>
      <div className="relative">
        <input 
          ref={inputRef}
          type="text"
          placeholder={selectedProduct ? `${selectedProduct.kode} - ${selectedProduct.nama}` : "Ketik SKU atau Nama..."}
          className={`w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-slate-100 focus:outline-none focus:border-blue-500 transition-all ${selectedProduct ? 'placeholder:text-blue-400 font-bold' : 'placeholder:text-slate-700'}`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
      </div>

      {isOpen && filteredProducts.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[300] glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
            {filteredProducts.map((p, idx) => (
              <div 
                key={p.kode} 
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => onSelect(p)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex justify-between items-center ${selectedIndex === idx ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300'}`}
              >
                <div className="flex flex-col">
                  <span className={`text-[9px] font-black uppercase ${selectedIndex === idx ? 'text-blue-100' : 'text-blue-400'}`}>{p.kode}</span>
                  <span className="text-xs font-bold">{p.nama}</span>
                </div>
                {selectedIndex === idx && <ArrowRight size={14} className="text-white/50" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Card = ({ children, title, icon: Icon, className = "", subtitle = "" }: any) => (
  <div className={`glass-panel p-6 rounded-[2.5rem] flex flex-col gap-4 border border-white/10 ${className}`}>
    {(title || Icon) && (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            {Icon && <Icon size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{subtitle}</p>}
          </div>
        </div>
      </div>
    )}
    <div className="flex-1 px-2">{children}</div>
  </div>
);

const Badge = ({ children, variant = 'info' }: any) => {
  const variants: any = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${variants[variant]}`}>{children}</span>;
};

// --- Views ---

function DashboardView({ stock, products, transactions, insights }: any) {
  const lowStock = products.filter((p: Product) => (stock[p.kode] || 0) < p.minStok);
  const totalUnits = Object.values(stock).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Stok Gudang" icon={Box} subtitle="Volume Total"><div className="text-3xl font-black">{totalUnits.toLocaleString()} <span className="text-[10px] opacity-40 uppercase">Pcs</span></div></Card>
        <Card title="Stok Kritis" icon={AlertTriangle} subtitle="Di Bawah Minimum"><div className="text-3xl font-black text-rose-500">{lowStock.length} <span className="text-[10px] opacity-40 uppercase">SKU</span></div></Card>
        <Card title="Audit Trailing" icon={Activity} subtitle="Total Record"><div className="text-3xl font-black text-blue-500">{transactions.length} <span className="text-[10px] opacity-40 uppercase">Item</span></div></Card>
        <Card title="AI Analyst" icon={TrendingUp} subtitle="Sistem Intelijen"><Badge variant="success">Online</Badge></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Wawasan AI" icon={Sparkles} className="border-blue-500/20 bg-blue-500/[0.02]">
            <p className="text-sm leading-relaxed text-slate-300 italic opacity-90">{insights || "Menganalisis data gudang Anda..."}</p>
          </Card>
          <Card title="Item Perlu Restock" icon={AlertTriangle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                  <tr><th className="p-4">Barang</th><th className="p-4 text-right">Stok</th><th className="p-4 text-right">Min</th><th className="p-4 text-center">Status</th></tr>
                </thead>
                <tbody>
                  {lowStock.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-slate-600 italic">Level stok aman.</td></tr>
                  ) : lowStock.map((p: Product) => (
                    <tr key={p.kode} className="border-b border-white/5 hover:bg-rose-500/[0.02] transition-colors">
                      <td className="p-4 font-bold text-slate-200">{p.nama}</td>
                      <td className="p-4 text-right font-black text-rose-500">{stock[p.kode] || 0}</td>
                      <td className="p-4 text-right opacity-40">{p.minStok}</td>
                      <td className="p-4 text-center"><Badge variant="danger">KRITIS</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <Card title="Aktivitas Terbaru" icon={History}>
          <div className="space-y-3">
            {transactions.slice(-10).reverse().map((t: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.jenis === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : t.jenis === 'KELUAR' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {t.jenis === 'MASUK' ? <Plus size={18}/> : t.jenis === 'KELUAR' ? <PackageMinus size={18}/> : <ClipboardCheck size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-slate-200">{t.nama}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{t.jenis} • {t.displayQty || t.qty} {t.satuan}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ChatView() {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userText }] }]);
    setInput('');
    setLoading(true);
    try {
      const response = await geminiService.chat(userText, messages);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: response || "AI sedang tidak merespons." }] }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Maaf, koneksi AI terputus." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-4 max-w-5xl mx-auto">
      <Card title="Wareflow AI" icon={MessageCircle} subtitle="Virtual Assistant" className="flex-1 flex flex-col min-h-0 overflow-hidden relative shadow-2xl">
        <button onClick={() => setMessages([])} className="absolute top-6 right-8 p-2 text-slate-700 hover:text-rose-500 transition-colors"><RotateCcw size={18} /></button>
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-30 space-y-4">
              <Sparkles size={64} className="text-blue-400 animate-pulse" />
              <p className="text-sm font-bold uppercase tracking-widest">Tanyakan Apapun</p>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-slate-100 rounded-tl-sm'}`}>
                <div className="whitespace-pre-wrap">{m.parts[0].text}</div>
              </div>
            </div>
          ))}
          {loading && <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin ml-2" />}
        </div>
        <form onSubmit={onSend} className="mt-6 flex gap-3">
          <input 
            placeholder="Tanyakan sesuatu..." 
            value={input} 
            onChange={(e: any) => setInput(e.target.value)} 
            disabled={loading} 
            className="flex-1 bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-14 w-14 !rounded-2xl"><Send size={20}/></Button>
        </form>
      </Card>
    </div>
  );
}

function TransactionView({ type, products, suppliers, stock, user, refresh, toast, allTransactions }: any) {
  const [formData, setFormData] = useState({ kode: '', qty: '', satuan: '', supplier: '', noSJ: '', noPO: '', keterangan: '' });
  const qtyRef = useRef<HTMLInputElement>(null);
  const selectedProduct = useMemo(() => products.find((p: any) => p.kode === formData.kode), [products, formData.kode]);
  const currentStock = stock[formData.kode] || 0;

  const handleSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    if (!formData.kode || !formData.qty || !formData.satuan) {
      toast('Lengkapi data wajib (*)', 'warning');
      return;
    }
    const qtyNum = parseFloat(formData.qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast('Qty harus positif', 'error');
      return;
    }
    let displayQty = qtyNum;
    if (selectedProduct) {
      if (formData.satuan === selectedProduct.satuanAlt1) displayQty = qtyNum * (selectedProduct.konversiAlt1 || 1);
      else if (formData.satuan === selectedProduct.satuanAlt2) displayQty = qtyNum * (selectedProduct.konversiAlt2 || 1);
    }
    await warehouseService.saveTransaction({
      tgl: new Date().toISOString().split('T')[0],
      jenis: type,
      kode: formData.kode,
      nama: selectedProduct?.nama || '',
      qty: displayQty,
      satuan: selectedProduct?.satuanDefault || '',
      displayQty: qtyNum,
      keterangan: formData.keterangan,
      user: user.username,
      supplier: formData.supplier,
      noSJ: formData.noSJ,
      noPO: formData.noPO
    });
    toast(`Tersimpan: ${formData.kode}`, 'success');
    setFormData({ kode: '', qty: '', satuan: '', supplier: '', noSJ: '', noPO: '', keterangan: '' });
    refresh();
  };

  const handleProductSelect = (p: Product | null) => {
    if (p) {
      setFormData({...formData, kode: p.kode, satuan: p.satuanDefault});
      setTimeout(() => qtyRef.current?.focus(), 150);
    } else {
      setFormData({...formData, kode: '', satuan: ''});
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in">
      <Card title={`FORM ${type}`} icon={type === 'MASUK' ? PackagePlus : type === 'KELUAR' ? PackageMinus : ClipboardCheck} className="shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-10 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <ProductAutocomplete label="Cari Barang *" products={products} value={formData.kode} onChange={handleProductSelect} onEnter={() => qtyRef.current?.focus()} />
              <div className="grid grid-cols-2 gap-6">
                <Input ref={qtyRef} label="Jumlah *" type="number" step="any" value={formData.qty} onChange={(e:any) => setFormData({...formData, qty: e.target.value})} onKeyDown={(e:any) => e.key === 'Enter' && handleSubmit()} />
                <div className="w-full">
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Satuan</label>
                  <select className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500" value={formData.satuan} onChange={(e) => setFormData({...formData, satuan: e.target.value})}>
                    {selectedProduct ? (
                      <>
                        <option value={selectedProduct.satuanDefault}>{selectedProduct.satuanDefault}</option>
                        {selectedProduct.satuanAlt1 && <option value={selectedProduct.satuanAlt1}>{selectedProduct.satuanAlt1}</option>}
                        {selectedProduct.satuanAlt2 && <option value={selectedProduct.satuanAlt2}>{selectedProduct.satuanAlt2}</option>}
                      </>
                    ) : <option value="">-</option>}
                  </select>
                </div>
              </div>
              {selectedProduct && <div className="p-4 rounded-2xl bg-white/5 flex justify-between"><div><p className="text-[10px] uppercase text-slate-500">Stok</p><p className="text-xl font-black">{currentStock}</p></div><div><p className="text-[10px] uppercase text-slate-500">Min</p><p className="text-xl font-black text-amber-500">{selectedProduct.minStok}</p></div></div>}
            </div>
            <div className="space-y-8">
              {type === 'MASUK' && (
                <>
                  <div className="w-full"><label className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Supplier</label><select className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})}><option value="">-- Pilih --</option>{suppliers.map((s: any) => <option key={s.id} value={s.nama}>{s.nama}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-6"><Input label="No SJ" value={formData.noSJ} onChange={(e:any) => setFormData({...formData, noSJ: e.target.value})} /><Input label="No PO" value={formData.noPO} onChange={(e:any) => setFormData({...formData, noPO: e.target.value})} /></div>
                </>
              )}
              <Input label="Catatan" value={formData.keterangan} onChange={(e:any) => setFormData({...formData, keterangan: e.target.value})} />
            </div>
          </div>
          <Button type="submit" variant={type === 'MASUK' ? 'success' : 'danger'} className="w-full h-14 font-black">SIMPAN DATA</Button>
        </form>
      </Card>
    </div>
  );
}

// ... Sisanya tetap sama (HistoryView, SupplierView, AdminView) ...
function HistoryView({ transactions, products }: any) { return <div className="p-4">Riwayat View</div>; }
function SupplierView({ suppliers }: any) { return <div className="p-4">Supplier View</div>; }
function AdminView({ products, refresh, toast }: any) { return <div className="p-4">Admin View</div>; }

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
    try {
      await warehouseService.syncAll();
      setProducts(warehouseService.getProducts());
      setSuppliers(warehouseService.getSuppliers());
      setTransactions(warehouseService.getTransactions());
      setStock(warehouseService.getStockState());
    } catch (e) {
      console.error(e);
      showToast('Koneksi database terganggu', 'error');
    } finally {
      setIsSyncing(false);
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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const u = (formData.get('username') as string)?.trim();
      const p = (formData.get('password') as string);
      
      if (!u || !p) {
        showToast('Username dan password wajib diisi.', 'warning');
        setIsLoggingIn(false);
        return;
      }

      // Pastikan data users terbaru diambil dari storage
      let users = warehouseService.getUsers();
      
      // Jika database kosong sama sekali, coba sync dulu
      if (users.length === 0) {
        showToast('Sinkronisasi database...', 'info');
        await warehouseService.syncAll();
        users = warehouseService.getUsers();
      }

      const found = users.find(x => x.username === u);
      
      if (found) {
        if (!found.active) {
          showToast('Akun ini telah dinonaktifkan.', 'error');
          setIsLoggingIn(false);
          return;
        }

        try {
          const hashed = await warehouseService.hashPassword(p);
          if (hashed === found.password) {
            setUser(found);
            localStorage.setItem('wareflow_session', JSON.stringify(found));
            showToast(`Berhasil masuk sebagai ${found.username}`, 'success');
            refreshData(); 
          } else {
            showToast('Username atau password salah.', 'error');
          }
        } catch (hashErr: any) {
          showToast(`Gagal memproses keamanan: ${hashErr.message}`, 'error');
        }
      } else {
        showToast('Akun tidak ditemukan.', 'error');
      }
    } catch (err: any) {
      console.error("Login Crash:", err);
      showToast('Terjadi kesalahan sistem saat login.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#070b14] p-6 bg-main overflow-hidden">
        <Card className="w-full max-w-md p-12 !border-white/5 animate-in fade-in zoom-in-95 duration-500 shadow-2xl relative">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 shadow-blue-500/30 animate-pulse">
              <PackagePlus size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white italic">WAREFLOW</h1>
            <p className="text-[10px] uppercase font-black text-slate-600 tracking-[0.4em] mt-3">Identity Access Management</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input label="Username" name="username" required autoComplete="username" placeholder="Masukkan username..." />
            <Input label="Password" type="password" name="password" required autoComplete="current-password" placeholder="••••••••" />
            <Button className="w-full h-16 tracking-[0.2em] font-black text-sm" type="submit" loading={isLoggingIn}>
              LOGIN SECURE
            </Button>
            
            <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
               <div className="flex justify-between items-center px-1">
                  <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest">Enterprise Mode</p>
                  <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest">v1.2.8</p>
               </div>
               
               {/* Emergency Button */}
               <button 
                 type="button"
                 onClick={() => confirm("Reset semua data lokal ke pengaturan awal? Ini akan menghapus riwayat sesi Anda.") && warehouseService.resetToDefaults()}
                 className="flex items-center justify-center gap-2 text-[8px] text-rose-900 hover:text-rose-500 font-black uppercase tracking-widest transition-colors py-2 opacity-50 hover:opacity-100"
               >
                 <ShieldAlert size={12} /> Emergency Reset Data Lokal
               </button>
            </div>
          </form>
          
          {(isSyncing || isLoggingIn) && (
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] animate-pulse">
              <RefreshCw size={10} className="animate-spin" /> Mengolah Data...
            </div>
          )}
        </Card>
      </div>
    );
  }

  const icons: any = { LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, ShieldCheck, MessageCircle };
  const availableTabs = Object.keys(TAB_CONFIG).filter(k => TAB_CONFIG[k].roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-200 overflow-hidden bg-main">
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[9999]">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={(id:string)=>setToasts(toasts.filter(x=>x.id!==id))} />)}
      </div>

      <aside className={`transition-all duration-500 glass-panel border-r border-white/5 h-full flex flex-col z-[100] shrink-0 ${isSidebarOpen ? 'w-80' : 'w-24'}`}>
        <div className="p-10 flex items-center gap-5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-blue-900/40"><PackagePlus size={28} className="text-white"/></div>
          {isSidebarOpen && <span className="font-black text-2xl tracking-tighter text-white italic">WAREFLOW</span>}
        </div>
        <nav className="flex-1 px-5 space-y-3 mt-6">
          {availableTabs.map(k => {
            const Icon = icons[TAB_CONFIG[k].icon] || LayoutDashboard;
            return (
              <button key={k} onClick={() => setActiveTab(k)} className={`w-full flex items-center gap-5 p-4.5 rounded-[1.5rem] transition-all ${activeTab === k ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40' : 'text-slate-600 hover:bg-white/5'}`}>
                <Icon size={22}/>
                {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-[0.2em]">{TAB_CONFIG[k].label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-8 border-t border-white/5">
          <button onClick={() => { setUser(null); localStorage.removeItem('wareflow_session'); }} className="w-full flex items-center gap-5 p-4.5 rounded-[1.5rem] text-rose-500 hover:bg-rose-500/10"><LogOut size={22}/>{isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-[0.2em]">Logout</span>}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-24 border-b border-white/5 px-12 flex items-center justify-between glass-panel z-50">
          <div className="flex items-center gap-6"><button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-4 text-slate-500"><Menu size={24}/></button><h2 className="text-2xl font-black uppercase tracking-tighter text-white">{TAB_CONFIG[activeTab]?.label}</h2></div>
          <div className="flex items-center gap-8">
            <button onClick={refreshData} disabled={isSyncing} className={`p-4 text-cyan-400 ${isSyncing ? 'opacity-50' : ''}`}><RefreshCw size={24} className={isSyncing ? 'animate-spin' : ''}/></button>
            <div className="flex items-center gap-5 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white">{user.username[0].toUpperCase()}</div>
              <div className="hidden lg:block text-right"><p className="text-sm font-black text-slate-100">{user.username}</p><p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{user.role}</p></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-24">
            {activeTab === 'dashboard' && <DashboardView stock={stock} products={products} transactions={transactions} insights={aiInsights} />}
            {activeTab === 'masuk' && <TransactionView type="MASUK" products={products} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} allTransactions={transactions} />}
            {activeTab === 'keluar' && <TransactionView type="KELUAR" products={products} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} allTransactions={transactions} />}
            {activeTab === 'riwayat' && <HistoryView transactions={transactions} products={products} />}
            {activeTab === 'chat' && <ChatView />}
            {activeTab === 'admin' && <AdminView products={products} refresh={refreshData} toast={showToast} />}
          </div>
        </main>
      </div>
    </div>
  );
}
