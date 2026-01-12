
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, 
  ShieldCheck, LogOut, Menu, User as UserIcon, Bell, Search, RefreshCw, Plus, 
  Trash2, Save, X, FileDown, CheckCircle2, Info, XCircle, AlertTriangle, 
  TrendingUp, Activity, Box, Edit2, Filter as FilterIcon, Database, Link as LinkIcon,
  MessageCircle, Send, ChevronDown, Calendar, RotateCcw, Sparkles, ArrowRight
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
    {label && <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-1 tracking-[0.1em]">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />}
      <input ref={ref} {...props} className={`w-full bg-slate-900/40 border border-white/10 rounded-xl py-2.5 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all ${Icon ? 'pl-10 pr-4' : 'px-4'}`} />
    </div>
  </div>
));

/**
 * ProductAutocomplete Component - Langsung Ketik, Navigasi Panah, Enter Pilih & Fokus Next
 */
const ProductAutocomplete = ({ products, value, onChange, label }: { products: Product[], value: string, onChange: (p: Product | null) => void, label: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = useMemo(() => products.find(p => p.kode === value), [products, value]);

  const filteredProducts = useMemo(() => {
    const s = search.toLowerCase();
    return products.filter(p => 
      p.kode.toLowerCase().includes(s) || 
      p.nama.toLowerCase().includes(s)
    ).slice(0, 10);
  }, [products, search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') setIsOpen(true);
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
        onChange(filteredProducts[selectedIndex]);
        setIsOpen(false);
        setSearch('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
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
      <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-1 tracking-widest">{label}</label>
      <div className="relative">
        <input 
          ref={inputRef}
          type="text"
          placeholder={selectedProduct ? `${selectedProduct.kode} - ${selectedProduct.nama}` : "Cari Barang (Ketik SKU/Nama)..."}
          className={`w-full bg-slate-900/40 border border-white/10 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all ${selectedProduct ? 'placeholder:text-blue-400 font-bold' : 'placeholder:text-slate-700'}`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[300] glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
            {filteredProducts.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-600 italic">Barang tidak ditemukan</p>
            ) : (
              filteredProducts.map((p, idx) => (
                <div 
                  key={p.kode} 
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => { onChange(p); setIsOpen(false); setSearch(''); }}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex justify-between items-center ${selectedIndex === idx ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-300'}`}
                >
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase ${selectedIndex === idx ? 'text-blue-100' : 'text-blue-400'}`}>{p.kode}</span>
                    <span className="text-xs font-bold leading-tight">{p.nama}</span>
                  </div>
                  {selectedIndex === idx && <ArrowRight size={14} className="text-white/40" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
        <Card title="Unit Tersedia" icon={Box} subtitle="Volume Real-time"><div className="text-3xl font-black">{totalUnits.toLocaleString()} <span className="text-[10px] opacity-40 uppercase">Pcs</span></div></Card>
        <Card title="Stok Kritis" icon={AlertTriangle} subtitle="Batas Minimum"><div className="text-3xl font-black text-rose-500">{lowStock.length} <span className="text-[10px] opacity-40 uppercase">SKU</span></div></Card>
        <Card title="Log Aktivitas" icon={Activity} subtitle="Total Transaksi"><div className="text-3xl font-black text-blue-500">{transactions.length} <span className="text-[10px] opacity-40 uppercase">Record</span></div></Card>
        <Card title="Insight AI" icon={TrendingUp} subtitle="Analitik Otomatis"><Badge variant="success">Active</Badge></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Audit Berbasis AI" icon={Sparkles} className="border-blue-500/20 bg-blue-500/[0.02]">
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap italic opacity-90">{insights || "Asisten AI sedang menganalisis data gudang Anda..."}</p>
          </Card>
          <Card title="Peringatan Restock" icon={AlertTriangle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                  <tr><th className="p-3">Barang</th><th className="p-3 text-right">Stok</th><th className="p-3 text-right">Min</th><th className="p-3 text-center">Status</th></tr>
                </thead>
                <tbody>
                  {lowStock.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-700 italic">Semua stok di atas batas minimum. Aman.</td></tr>
                  ) : lowStock.map((p: Product) => (
                    <tr key={p.kode} className="border-b border-white/5 hover:bg-rose-500/[0.02]">
                      <td className="p-3 font-bold text-slate-200">{p.nama}</td>
                      <td className="p-3 text-right font-black text-rose-500">{stock[p.kode] || 0}</td>
                      <td className="p-3 text-right opacity-40">{p.minStok}</td>
                      <td className="p-3 text-center"><Badge variant="danger">KRITIS</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <Card title="Log Terbaru" icon={History}>
          <div className="space-y-3">
            {transactions.slice(-8).reverse().map((t: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.jenis === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : t.jenis === 'KELUAR' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {t.jenis === 'MASUK' ? <Plus size={16}/> : t.jenis === 'KELUAR' ? <PackageMinus size={16}/> : <ClipboardCheck size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-slate-200">{t.nama}</p>
                  <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">{t.jenis} • {t.displayQty || t.qty} {t.satuan}</p>
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
    const newUserMsg: ChatHistoryItem = { role: 'user', parts: [{ text: userText }] };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await geminiService.chat(userText, messages);
      if (response) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Maaf, AI gagal merespons. Periksa koneksi internet Anda." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-4 max-w-5xl mx-auto">
      <Card title="Wareflow Intelligence" icon={MessageCircle} subtitle="Asisten Virtual Logistik" className="flex-1 flex flex-col min-h-0 overflow-hidden relative border-blue-500/10">
        <button onClick={() => setMessages([])} className="absolute top-6 right-6 p-2 text-slate-700 hover:text-rose-500 transition-colors" title="Bersihkan Chat"><RotateCcw size={16} /></button>
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-40 space-y-4 text-center">
              <Sparkles size={48} className="text-blue-500 animate-pulse" />
              <div>
                <p className="text-sm font-black uppercase tracking-widest">Halo, ada yang bisa saya bantu?</p>
                <p className="text-[10px] font-medium leading-relaxed">Tanyakan tentang stok, supplier, atau cara optimal mengelola gudang.</p>
              </div>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'}`}>
                <div className="flex items-center gap-2 mb-1.5 opacity-40">
                   <span className="text-[8px] font-black uppercase tracking-widest">{m.role === 'user' ? 'USER' : 'AI ASSISTANT'}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.parts[0].text}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start"><div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-tl-sm flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div>
          )}
        </div>
        <form onSubmit={onSend} className="mt-4 flex gap-3 p-1">
          <input 
            placeholder="Tulis pesan Anda di sini..." 
            value={input} 
            onChange={(e: any) => setInput(e.target.value)} 
            disabled={loading} 
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-12 w-12 !rounded-2xl shrink-0"><Send size={18}/></Button>
        </form>
      </Card>
    </div>
  );
}

function TransactionView({ type, products, suppliers, stock, user, refresh, toast, allTransactions }: any) {
  const [formData, setFormData] = useState({
    kode: '',
    qty: '',
    satuan: '',
    supplier: '',
    noSJ: '',
    noPO: '',
    keterangan: ''
  });
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
      toast('Jumlah tidak valid', 'error');
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

    toast(`Data ${type} tersimpan`, 'success');
    setFormData({ kode: '', qty: '', satuan: '', supplier: '', noSJ: '', noPO: '', keterangan: '' });
    refresh();
  };

  const handleProductSelect = (p: Product | null) => {
    if (p) {
      setFormData({...formData, kode: p.kode, satuan: p.satuanDefault});
      // Auto focus ke Qty setelah memilih barang
      setTimeout(() => qtyRef.current?.focus(), 100);
    } else {
      setFormData({...formData, kode: '', satuan: ''});
    }
  };

  const recentItems = useMemo(() => {
    return allTransactions.filter((t: any) => t.jenis === type).slice(-8).reverse();
  }, [allTransactions, type]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <Card title={`TRANSAKSI ${type}`} icon={type === 'MASUK' ? PackagePlus : type === 'KELUAR' ? PackageMinus : ClipboardCheck} className="shadow-2xl !bg-[#0f1423]/60">
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Bagian Kiri: Barang & Jumlah */}
            <div className="space-y-6">
              <ProductAutocomplete label="Pilih Barang (SKU / Nama) *" products={products} value={formData.kode} onChange={handleProductSelect} />
              
              <div className="grid grid-cols-2 gap-6">
                <Input 
                  ref={qtyRef} 
                  label="Jumlah / Qty *" 
                  type="number" 
                  step="any" 
                  placeholder="Ketik angka..." 
                  value={formData.qty} 
                  onChange={(e:any) => setFormData({...formData, qty: e.target.value})} 
                  onKeyDown={(e:any) => e.key === 'Enter' && handleSubmit()}
                />
                <div className="w-full">
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-1 tracking-widest">Satuan</label>
                  <select 
                    className="w-full bg-slate-900/40 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={formData.satuan}
                    onChange={(e) => setFormData({...formData, satuan: e.target.value})}
                  >
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

              {selectedProduct && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex justify-between items-center animate-in zoom-in-95">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase">Stok Sistem Saat Ini</p>
                    <p className={`text-2xl font-black ${currentStock < selectedProduct.minStok ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {currentStock} <span className="text-xs font-bold opacity-50 uppercase tracking-tighter">{selectedProduct.satuanDefault}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Minimum</p>
                    <p className="text-base font-bold text-amber-500">{selectedProduct.minStok}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bagian Kanan: Info Tambahan */}
            <div className="space-y-6">
              {type === 'MASUK' && (
                <>
                  <div className="w-full">
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-1 tracking-widest">Supplier</label>
                    <select 
                      className="w-full bg-slate-900/40 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer" 
                      value={formData.supplier} 
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    >
                      <option value="">-- Pilih Supplier --</option>
                      {suppliers.map((s: any) => (<option key={s.id} value={s.nama}>{s.nama}</option>))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <Input label="No. SJ" placeholder="SJ-..." value={formData.noSJ} onChange={(e:any) => setFormData({...formData, noSJ: e.target.value})} />
                    <Input label="No. PO" placeholder="PO-..." value={formData.noPO} onChange={(e:any) => setFormData({...formData, noPO: e.target.value})} />
                  </div>
                </>
              )}
              <Input label="Keterangan / Notes" placeholder="Tambahkan catatan jika perlu..." value={formData.keterangan} onChange={(e:any) => setFormData({...formData, keterangan: e.target.value})} />
            </div>
          </div>
          
          <div className="flex justify-center pt-6">
            <Button 
              type="submit" 
              variant={type === 'MASUK' ? 'success' : type === 'KELUAR' ? 'danger' : 'primary'} 
              className="w-full md:w-[400px] h-14 text-sm tracking-[0.2em] font-black"
            >
              PROSES TRANSAKSI {type}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card title="Baru Saja Diinput" icon={History} subtitle={`Log Transaksi ${type}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentItems.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-700 italic text-sm">Belum ada aktivitas baru hari ini.</div>
            ) : recentItems.map((t: any, idx: number) => (
              <div key={idx} className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-blue-500/40 transition-all animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${t.jenis === 'MASUK' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{t.jenis}</span>
                  <span className="text-[9px] font-bold text-slate-500">{t.waktu}</span>
                </div>
                <p className="text-xs font-black text-slate-200 truncate">{t.nama}</p>
                <div className="flex justify-between items-end mt-3">
                   <p className="text-xs font-bold text-blue-400">{t.displayQty || t.qty} <span className="text-[9px] opacity-40 uppercase">{t.satuan}</span></p>
                   <p className="text-[8px] text-slate-600 font-bold uppercase">{t.user}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function HistoryView({ transactions, products, toast }: any) {
  const INITIAL_FILTER = { search: '', type: '', startDate: '', endDate: '', kode: '' };
  const [filter, setFilter] = useState(INITIAL_FILTER);
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);

  const filtered = useMemo(() => transactions.filter((t: any) => {
    const s = filter.search.toLowerCase();
    const matchesSearch = !filter.search || t.nama.toLowerCase().includes(s) || t.kode.toLowerCase().includes(s) || (t.keterangan && t.keterangan.toLowerCase().includes(s));
    const matchesType = !filter.type || t.jenis === filter.type;
    const matchesKode = !filter.kode || t.kode === filter.kode;
    let matchesDate = true;
    if (filter.startDate) matchesDate = matchesDate && t.tgl >= filter.startDate;
    if (filter.endDate) matchesDate = matchesDate && t.tgl <= filter.endDate;
    return matchesSearch && matchesType && matchesKode && matchesDate;
  }).reverse(), [transactions, filter]);

  const exportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Waktu', 'Jenis', 'Kode', 'Nama', 'Qty', 'Satuan', 'User', 'Keterangan', 'Supplier', 'NoSJ', 'NoPO'];
    const rows = filtered.map((t: any) => [t.id, t.tgl, t.waktu, t.jenis, t.kode, t.nama, t.displayQty || t.qty, t.satuan, t.user, t.keterangan, t.supplier || '', t.noSJ || '', t.noPO || '']);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_log_wareflow_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Data diekspor ke CSV', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div><h3 className="text-2xl font-black uppercase tracking-tighter text-white">Logistik & Audit Trailing</h3><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Ditemukan {filtered.length} transaksi</p></div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="ghost" onClick={() => setIsAdvancedVisible(!isAdvancedVisible)}><FilterIcon size={18}/> {isAdvancedVisible ? 'Tutup Filter' : 'Filter Data'}</Button>
          <Button variant="ghost" onClick={exportCSV}><FileDown size={18}/> Export CSV</Button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${isAdvancedVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <Card title="Filter Pencarian" icon={FilterIcon} className="!bg-white/[0.03]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Input label="Cari Kata Kunci" placeholder="SKU / Nama / Ket..." icon={Search} value={filter.search} onChange={(e:any) => setFilter({...filter, search: e.target.value})} />
              <div className="w-full"><label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 ml-1">Jenis</label><select className="w-full bg-slate-900/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black uppercase text-slate-200" value={filter.type} onChange={(e) => setFilter({...filter, type: e.target.value})}><option value="">SEMUA JENIS</option><option value="MASUK">MASUK</option><option value="KELUAR">KELUAR</option><option value="OPNAME">OPNAME</option></select></div>
            </div>
            <div className="space-y-4">
              <ProductAutocomplete label="Filter Spesifik SKU" products={products} value={filter.kode} onChange={(p) => setFilter({...filter, kode: p ? p.kode : ''})} />
              <div className="grid grid-cols-2 gap-4"><Input label="Dari Tanggal" type="date" value={filter.startDate} onChange={(e:any)=>setFilter({...filter, startDate: e.target.value})} icon={Calendar} /><Input label="Hingga Tanggal" type="date" value={filter.endDate} onChange={(e:any)=>setFilter({...filter, endDate: e.target.value})} icon={Calendar} /></div>
            </div>
            <div className="flex flex-col justify-end gap-3 pb-1"><Button onClick={() => setFilter(INITIAL_FILTER)} variant="ghost" className="w-full"><RotateCcw size={16}/> Reset Filter</Button></div>
          </div>
        </Card>
      </div>

      <Card className="!p-0 overflow-hidden !border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5 bg-white/[0.02] tracking-widest">
              <tr><th className="p-4">Tanggal</th><th className="p-4">Jenis</th><th className="p-4">Barang</th><th className="p-4 text-right">Qty</th><th className="p-4">User</th><th className="p-4">Catatan</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center opacity-20"><Search size={48} className="mx-auto mb-4"/><p className="text-sm font-bold uppercase tracking-widest">Log Kosong</p></td></tr>
              ) : filtered.map((t: any) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                  <td className="p-4 font-bold text-slate-300 text-xs">{t.tgl}<br/><span className="text-[10px] opacity-40">{t.waktu}</span></td>
                  <td className="p-4"><Badge variant={t.jenis === 'MASUK' ? 'success' : t.jenis === 'KELUAR' ? 'danger' : t.jenis === 'AWAL' ? 'purple' : 'info'}>{t.jenis}</Badge></td>
                  <td className="p-4"><p className="font-black text-blue-400 text-[10px] tracking-widest">{t.kode}</p><p className="font-bold text-slate-200 truncate max-w-[180px]">{t.nama}</p></td>
                  <td className="p-4 text-right font-black text-base">{t.jenis === 'KELUAR' ? '-' : '+'}{t.displayQty || t.qty} <span className="text-[9px] opacity-40">{t.satuan}</span></td>
                  <td className="p-4 text-xs font-bold text-slate-400">{t.user}</td>
                  <td className="p-4 text-[11px] text-slate-500 italic truncate max-w-[200px]" title={t.keterangan}>{t.keterangan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SupplierView({ suppliers, refresh, toast }: any) {
  const [modal, setModal] = useState({ open: false, editing: null as any, data: {} as any });
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = { id: modal.editing?.id || `SUP-${Date.now()}`, ...modal.data };
    await warehouseService.saveSupplier(payload);
    toast(`Supplier tersimpan`, 'success');
    setModal({ open: false, editing: null, data: {} }); refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tighter text-white">Database Supplier</h3><Button onClick={() => setModal({ open: true, editing: null, data: {} })}><Plus size={18}/> Tambah Supplier</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((s: Supplier) => (
          <Card key={s.id} title={s.nama} icon={Truck} subtitle={s.id}>
            <div className="space-y-3 text-sm">
              <p className="font-bold text-slate-300">PIC: {s.pic || '-'}</p>
              <div className="flex items-center gap-2 text-slate-500 text-xs"><Search size={12}/> {s.telp || '-'}</div>
              <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{s.alamat || '-'}</p>
              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button onClick={() => setModal({ open: true, editing: s, data: s })} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"><Edit2 size={16}/></button>
                <button onClick={async () => confirm('Hapus data supplier ini?') && (await warehouseService.deleteSupplier(s.id), refresh())} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={16}/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {modal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <Card className="w-full max-w-lg shadow-2xl" title={modal.editing ? "Edit Supplier" : "Supplier Baru"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nama Perusahaan *" value={modal.data.nama || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, nama: e.target.value}})} required />
              <Input label="PIC (Penanggung Jawab)" value={modal.data.pic || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, pic: e.target.value}})} />
              <Input label="No. Telepon" value={modal.data.telp || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, telp: e.target.value}})} />
              <div className="w-full">
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1.5 ml-1">Alamat Lengkap</label>
                <textarea 
                  className="w-full bg-slate-900/40 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 min-h-[100px]"
                  value={modal.data.alamat || ''}
                  onChange={(e:any)=>setModal({...modal, data: {...modal.data, alamat: e.target.value}})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-6"><button type="button" onClick={() => setModal({ open: false, editing: null, data: {} })} className="text-slate-600 font-black px-4 text-xs uppercase tracking-widest hover:text-white transition-colors">Batal</button><Button type="submit" variant="success">Simpan Database</Button></div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function AdminView({ refresh, currentUser, toast, products }: any) {
  const [subTab, setSubTab] = useState<'users' | 'skus' | 'cloud'>('users');
  const [modal, setModal] = useState({ open: false, editing: null as any, data: {} as any });
  const [gasUrl, setGasUrl] = useState(localStorage.getItem('wareflow_gas_url') || '');

  const saveUser = async (e: any) => {
    e.preventDefault();
    await warehouseService.saveUser(modal.data, modal.data.newPassword);
    toast(`User updated`, 'success'); setModal({ open: false, editing: null, data: {} }); refresh();
  };

  const saveSku = async (e: any) => {
    e.preventDefault();
    await warehouseService.saveProduct({ ...modal.data, minStok: Number(modal.data.minStok || 0), stokAwal: Number(modal.data.stokAwal || 0) });
    toast(`SKU updated`, 'success'); setModal({ open: false, editing: null, data: {} }); refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        {['users', 'skus', 'cloud'].map((tab: any) => (
          <button key={tab} onClick={() => setSubTab(tab)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-300'}`}>{tab}</button>
        ))}
      </div>
      {subTab === 'cloud' && (
        <Card title="Google Sheets Integration" icon={LinkIcon} subtitle="Sinkronisasi Cloud"><div className="space-y-6"><Input label="GAS Web App URL" value={gasUrl} onChange={(e:any)=>setGasUrl(e.target.value)} placeholder="https://script.google.com/..." /><Button variant="success" onClick={() => { warehouseService.setBackendUrl(gasUrl); toast("Konfigurasi Cloud Disimpan", "success"); refresh(); }}><Save size={18}/> Hubungkan Database</Button></div></Card>
      )}
      {subTab === 'users' && (
        <Card title="User Authority" icon={UserIcon}>
          <div className="flex justify-end mb-4"><Button onClick={() => setModal({ open: true, editing: null, data: {role:'STAFF', active:true} })}><Plus size={18}/> Akses Baru</Button></div>
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5 tracking-widest"><tr><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody>
              {warehouseService.getUsers().map(u => (
                <tr key={u.username} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"><td className="p-4 font-black text-slate-200">{u.username}</td><td className="p-4"><Badge variant={u.role==='ADMIN'?'danger':'info'}>{u.role}</Badge></td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => setModal({ open: true, editing: u, data: { ...u } })} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"><Edit2 size={16}/></button></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {subTab === 'skus' && (
        <Card title="Inventory Master Data" icon={Database}>
          <div className="flex justify-end mb-4"><Button onClick={() => setModal({ open: true, editing: null, data: {satuanDefault:'PCS', minStok:10, stokAwal:0} })}><Plus size={18}/> Item SKU Baru</Button></div>
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5 tracking-widest"><tr><th className="p-4">Kode SKU</th><th className="p-4">Nama Item</th><th className="p-4 text-right">Aksi</th></tr></thead>
            <tbody>
              {products.map((p: Product) => (
                <tr key={p.kode} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"><td className="p-4 font-mono text-blue-400 font-bold">{p.kode}</td><td className="p-4 font-bold text-slate-200">{p.nama}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => setModal({ open: true, editing: p, data: { ...p } })} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"><Edit2 size={16}/></button></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {modal.open && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
          <Card className="w-full max-w-xl shadow-2xl border-white/10" title={modal.editing ? `Edit ${subTab === 'users' ? 'User' : 'SKU'}` : `Tambah ${subTab === 'users' ? 'User' : 'SKU'}`}>
            <form onSubmit={subTab === 'users' ? saveUser : saveSku} className="space-y-4">
              {subTab === 'users' ? (
                <>
                  <Input label="Username" value={modal.data.username || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, username: e.target.value}})} required disabled={!!modal.editing} />
                  <Input label="Password" type="password" value={modal.data.newPassword || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, newPassword: e.target.value}})} required={!modal.editing} />
                  <div className="w-full"><label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">Role</label><select className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200" value={modal.data.role} onChange={(e:any)=>setModal({...modal, data: {...modal.data, role: e.target.value}})}><option value="STAFF">STAFF</option><option value="ADMIN">ADMIN</option></select></div>
                </>
              ) : (
                <>
                  <Input label="Kode SKU *" value={modal.data.kode || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, kode: e.target.value}})} required disabled={!!modal.editing} />
                  <Input label="Nama Lengkap *" value={modal.data.nama || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, nama: e.target.value}})} required />
                  <div className="grid grid-cols-2 gap-4"><Input label="Satuan Dasar *" value={modal.data.satuanDefault || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, satuanDefault: e.target.value}})} required /><Input label="Min Stok *" type="number" value={modal.data.minStok || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, minStok: e.target.value}})} required /></div>
                  <Input label="Saldo Awal Inventaris" type="number" value={modal.data.stokAwal || 0} onChange={(e:any)=>setModal({...modal, data: {...modal.data, stokAwal: e.target.value}})} />
                </>
              )}
              <div className="flex justify-end gap-3 pt-6"><button type="button" onClick={() => setModal({ open: false, editing: null, data: {} })} className="text-slate-600 font-black px-4 text-xs uppercase tracking-widest hover:text-white transition-colors">Batal</button><Button type="submit" variant="success">Simpan Database</Button></div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

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

  const cachedProducts = useMemo(() => products, [products]);

  const showToast = useCallback((message: string, type: string = 'info') => {
    setToasts(prev => [...prev, { id: Date.now().toString(), message, type }]);
  }, []);

  const refreshData = useCallback(async () => {
    setIsSyncing(true);
    const success = await warehouseService.syncAll();
    const pData = warehouseService.getProducts();
    setProducts(pData);
    setSuppliers(warehouseService.getSuppliers());
    setTransactions(warehouseService.getTransactions());
    setStock(warehouseService.getStockState());
    setIsSyncing(false);
    
    if (success) showToast('Database Sinkron', 'success');
  }, [showToast]);

  useEffect(() => {
    const saved = localStorage.getItem('wareflow_session');
    if (saved) setUser(JSON.parse(saved));
    refreshData();
  }, []);

  useEffect(() => {
    if (user && activeTab === 'dashboard') {
      geminiService.getStockInsights(cachedProducts, stock, transactions).then(setAiInsights);
    }
  }, [activeTab, user, stock, cachedProducts, transactions]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const u = e.target.username.value;
    const p = e.target.password.value;
    const users = warehouseService.getUsers();
    const found = users.find(x => x.username === u);
    
    if (found && found.active) {
      const hashed = await warehouseService.hashPassword(p);
      if (hashed === found.password) {
        setUser(found);
        localStorage.setItem('wareflow_session', JSON.stringify(found));
        showToast(`Sesi Aktif: ${found.username}`, 'success');
      } else showToast('Password tidak cocok', 'error');
    } else showToast('Otoritas tidak ditemukan', 'error');
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#070b14] p-6 bg-main overflow-hidden">
        <Card className="w-full max-w-md p-10 !border-white/5 animate-in fade-in zoom-in-95 duration-500 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 shadow-blue-500/40"><PackagePlus size={40} className="text-white" /></div>
            <h1 className="text-4xl font-black tracking-tighter text-white italic">WAREFLOW</h1>
            <p className="text-[10px] uppercase font-black text-slate-600 tracking-[0.3em] mt-2">Enterprise Security Engine</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input label="Username" name="username" required />
            <Input label="Password" type="password" name="password" required />
            <Button className="w-full h-14 tracking-widest" type="submit">LOGIN SECURE</Button>
            <p className="text-center text-[8px] text-slate-700 font-bold uppercase tracking-widest">Internal Access Restricted</p>
          </form>
        </Card>
      </div>
    );
  }

  const icons: any = { LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, ShieldCheck, MessageCircle };
  const availableTabs = Object.keys(TAB_CONFIG).filter(k => TAB_CONFIG[k].roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-200 overflow-hidden bg-main">
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={(id:string)=>setToasts(toasts.filter(x=>x.id!==id))} />)}
      </div>

      <aside className={`transition-all duration-500 glass-panel border-r border-white/5 h-full flex flex-col z-50 shrink-0 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40"><PackagePlus size={24} className="text-white"/></div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tighter text-white italic">WAREFLOW</span>}
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar mt-4">
          {availableTabs.map(k => {
            const Icon = icons[TAB_CONFIG[k].icon] || LayoutDashboard;
            return (
              <button 
                key={k} 
                onClick={() => setActiveTab(k)} 
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === k ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40' : 'text-slate-600 hover:bg-white/5 hover:text-slate-300'}`}
              >
                <Icon size={20}/>
                {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-[0.15em]">{TAB_CONFIG[k].label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { setUser(null); localStorage.removeItem('wareflow_session'); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all ${!isSidebarOpen && 'justify-center'}`}><LogOut size={20}/>{isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-widest">Logout</span>}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between glass-panel z-40 shrink-0">
          <div className="flex items-center gap-4"><button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-white/5 rounded-xl text-slate-500 transition-colors"><Menu size={20}/></button><h2 className="text-xl font-black uppercase tracking-tight text-white leading-none tracking-tighter">{TAB_CONFIG[activeTab]?.label || activeTab}</h2></div>
          <div className="flex items-center gap-6">
            <button onClick={refreshData} disabled={isSyncing} className={`p-3 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all ${isSyncing ? 'opacity-50' : 'active:rotate-180 duration-500'}`}><RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''}/></button>
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-xl">{user.username[0].toUpperCase()}</div>
              <div className="hidden lg:block text-right"><p className="text-xs font-black text-slate-200">{user.username}</p><p className="text-[8px] font-black uppercase tracking-wider text-slate-600 mt-0.5">{user.role}</p></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto pb-20">
            {activeTab === 'dashboard' && <DashboardView stock={stock} products={cachedProducts} transactions={transactions} insights={aiInsights} />}
            {activeTab === 'masuk' && <TransactionView type="MASUK" products={cachedProducts} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} allTransactions={transactions} />}
            {activeTab === 'keluar' && <TransactionView type="KELUAR" products={cachedProducts} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} allTransactions={transactions} />}
            {activeTab === 'opname' && <TransactionView type="OPNAME" products={cachedProducts} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} allTransactions={transactions} />}
            {activeTab === 'riwayat' && <HistoryView transactions={transactions} products={cachedProducts} toast={showToast} />}
            {activeTab === 'supplier' && <SupplierView suppliers={suppliers} refresh={refreshData} toast={showToast} />}
            {activeTab === 'chat' && <ChatView />}
            {activeTab === 'admin' && <AdminView refresh={refreshData} currentUser={user} toast={showToast} products={cachedProducts} />}
          </div>
        </main>
      </div>
    </div>
  );
}
