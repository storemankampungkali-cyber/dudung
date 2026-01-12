
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
    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right-10 min-w-[320px] z-[2000]">
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
 * ProductAutocomplete Component - Langsung Ketik, Tidak Perlu Klik Dulu
 */
const ProductAutocomplete = ({ products, value, onChange, label, autoFocus = false }: any) => {
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

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex(prev => (prev + 1) % (filteredProducts.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredProducts.length) % (filteredProducts.length || 1));
    } else if (e.key === 'Enter') {
      if (isOpen && filteredProducts.length > 0) {
        e.preventDefault();
        onSelect(filteredProducts[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const onSelect = (p: Product) => {
    onChange(p);
    setSearch('');
    setIsOpen(false);
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
          autoFocus={autoFocus}
          placeholder={selectedProduct ? `${selectedProduct.kode} - ${selectedProduct.nama}` : "Ketik SKU atau Nama Barang..."}
          className={`w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-all ${selectedProduct ? 'placeholder:text-blue-400 font-bold' : ''}`}
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
                  <span className="text-xs font-bold leading-tight">{p.nama}</span>
                </div>
                {selectedIndex === idx && <ArrowRight size={14} className="text-white/40" />}
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
        <Card title="Stok Kritis" icon={AlertTriangle} subtitle="Dibawah Minimum"><div className="text-3xl font-black text-rose-500">{lowStock.length} <span className="text-[10px] opacity-40 uppercase">SKU</span></div></Card>
        <Card title="Audit Trailing" icon={Activity} subtitle="Total Record"><div className="text-3xl font-black text-blue-500">{transactions.length} <span className="text-[10px] opacity-40 uppercase">Item</span></div></Card>
        <Card title="AI Analyst" icon={TrendingUp} subtitle="Sistem Intelijen"><Badge variant="success">Online</Badge></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Wawasan Intelijen AI" icon={Sparkles} className="border-blue-500/20 bg-blue-500/[0.02]">
            <p className="text-sm leading-relaxed text-slate-300 italic opacity-90">{insights || "Menganalisis data gudang Anda..."}</p>
          </Card>
          <Card title="Peringatan Restock Segera" icon={AlertTriangle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                  <tr><th className="p-4">Nama Barang</th><th className="p-4 text-right">Stok</th><th className="p-4 text-right">Min</th><th className="p-4 text-center">Status</th></tr>
                </thead>
                <tbody>
                  {lowStock.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-slate-600 italic">Level stok aman. Tidak ada peringatan kritis.</td></tr>
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
        <Card title="Aktivitas Terkini" icon={History}>
          <div className="space-y-3">
            {transactions.slice(-10).reverse().map((t: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group">
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
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Maaf, koneksi AI terputus. Silakan coba lagi." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-4 max-w-5xl mx-auto">
      <Card title="Wareflow AI Intelligence" icon={MessageCircle} subtitle="Asisten Cerdas Anda" className="flex-1 flex flex-col min-h-0 overflow-hidden relative border-blue-500/10 shadow-2xl">
        <button onClick={() => setMessages([])} className="absolute top-6 right-8 p-2 text-slate-700 hover:text-rose-500 transition-colors" title="Bersihkan Chat"><RotateCcw size={18} /></button>
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-30 space-y-4 text-center">
              <Sparkles size={64} className="text-blue-400 animate-pulse" />
              <div>
                <p className="text-lg font-black uppercase tracking-widest">Selamat Datang</p>
                <p className="text-xs font-medium max-w-xs mx-auto">Tanyakan apapun seputar manajemen stok, tips logistik, atau bantuan operasional lainnya.</p>
              </div>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-slate-100 rounded-tl-sm backdrop-blur-md'}`}>
                <div className="flex items-center gap-2 mb-2 opacity-50">
                   <span className="text-[9px] font-black uppercase tracking-widest">{m.role === 'user' ? 'USER' : 'WAREFLOW AI'}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.parts[0].text}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start"><div className="bg-white/5 border border-white/10 p-5 rounded-3xl rounded-tl-sm flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" /><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div>
          )}
        </div>
        <form onSubmit={onSend} className="mt-6 flex gap-3">
          <input 
            placeholder="Tanyakan sesuatu kepada AI..." 
            value={input} 
            onChange={(e: any) => setInput(e.target.value)} 
            disabled={loading} 
            className="flex-1 bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-14 w-14 !rounded-2xl shrink-0 shadow-2xl"><Send size={20}/></Button>
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
      toast('Wajib mengisi Barang, Qty, dan Satuan', 'warning');
      return;
    }

    const qtyNum = parseFloat(formData.qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast('Jumlah harus lebih dari 0', 'error');
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

    toast(`Transaksi ${type} ${formData.kode} berhasil disimpan`, 'success');
    setFormData({ kode: '', qty: '', satuan: '', supplier: '', noSJ: '', noPO: '', keterangan: '' });
    refresh();
  };

  const handleProductSelect = (p: Product | null) => {
    if (p) {
      setFormData({...formData, kode: p.kode, satuan: p.satuanDefault});
      // Pindahkan fokus ke input Qty setelah memilih barang
      setTimeout(() => qtyRef.current?.focus(), 150);
    } else {
      setFormData({...formData, kode: '', satuan: ''});
    }
  };

  const recentEntries = useMemo(() => {
    return allTransactions.filter((t: any) => t.jenis === type).slice(-8).reverse();
  }, [allTransactions, type]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <Card title={`FORM TRANSAKSI ${type}`} icon={type === 'MASUK' ? PackagePlus : type === 'KELUAR' ? PackageMinus : ClipboardCheck} subtitle="Entri Data Presisi" className="shadow-2xl !bg-slate-950/40">
        <form onSubmit={handleSubmit} className="space-y-10 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Kolom Kiri: Utama */}
            <div className="space-y-8">
              <ProductAutocomplete 
                label="Pilih Barang (Langsung Ketik SKU / Nama) *" 
                products={products} 
                value={formData.kode} 
                onChange={handleProductSelect} 
                autoFocus={true}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input 
                  ref={qtyRef} 
                  label="Jumlah / Qty *" 
                  type="number" 
                  step="any" 
                  placeholder="0.00" 
                  value={formData.qty} 
                  onChange={(e:any) => setFormData({...formData, qty: e.target.value})} 
                  onKeyDown={(e:any) => e.key === 'Enter' && handleSubmit()}
                />
                <div className="w-full">
                  <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-1 tracking-widest">Satuan</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
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
                <div className="p-5 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 flex justify-between items-center animate-in zoom-in-95">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stok Real-time</p>
                    <p className={`text-3xl font-black ${currentStock < selectedProduct.minStok ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {currentStock.toLocaleString()} <span className="text-xs font-bold opacity-50 uppercase">{selectedProduct.satuanDefault}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Min Stok</p>
                    <p className="text-lg font-bold text-amber-500">{selectedProduct.minStok}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Kolom Kanan: Detail */}
            <div className="space-y-8">
              {type === 'MASUK' && (
                <>
                  <div className="w-full">
                    <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-1 tracking-widest">Supplier</label>
                    <select 
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none" 
                      value={formData.supplier} 
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    >
                      <option value="">-- Pilih Supplier --</option>
                      {suppliers.map((s: any) => (<option key={s.id} value={s.nama}>{s.nama}</option>))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input label="No. Surat Jalan" placeholder="SJ-XXXX" value={formData.noSJ} onChange={(e:any) => setFormData({...formData, noSJ: e.target.value})} />
                    <Input label="No. Purchase Order" placeholder="PO-XXXX" value={formData.noPO} onChange={(e:any) => setFormData({...formData, noPO: e.target.value})} />
                  </div>
                </>
              )}
              <Input label="Catatan / Keterangan" placeholder="Ketik catatan tambahan di sini..." value={formData.keterangan} onChange={(e:any) => setFormData({...formData, keterangan: e.target.value})} />
            </div>
          </div>
          
          <div className="flex justify-center pt-8">
            <Button 
              type="submit" 
              variant={type === 'MASUK' ? 'success' : type === 'KELUAR' ? 'danger' : 'primary'} 
              className="w-full md:w-1/2 h-16 text-base tracking-[0.25em] font-black rounded-2xl shadow-2xl"
            >
              SIMPAN DATA {type}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Baru Saja Diproses" icon={History} subtitle={`Log Operasional ${type}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentEntries.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-700 italic text-sm">Belum ada aktivitas baru tercatat.</div>
          ) : recentEntries.map((t: any, idx: number) => (
            <div key={idx} className="flex flex-col p-5 rounded-3xl bg-white/5 border border-white/10 group hover:border-blue-500/40 transition-all animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-3">
                <Badge variant={t.jenis === 'MASUK' ? 'success' : 'danger'}>{t.jenis}</Badge>
                <span className="text-[10px] font-bold text-slate-500">{t.waktu}</span>
              </div>
              <p className="text-sm font-black text-slate-200 truncate">{t.nama}</p>
              <div className="flex justify-between items-end mt-4">
                 <p className="text-sm font-black text-blue-400">{t.displayQty || t.qty} <span className="text-[10px] opacity-40 uppercase tracking-tighter">{t.satuan}</span></p>
                 <div className="text-right"><p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{t.user}</p></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div><h3 className="text-2xl font-black uppercase tracking-tighter text-white">Log Audit & Riwayat</h3><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Found {filtered.length} total records</p></div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="ghost" onClick={() => setIsAdvancedVisible(!isAdvancedVisible)}><FilterIcon size={18}/> {isAdvancedVisible ? 'Sembunyikan' : 'Filter Lanjut'}</Button>
          <Button variant="ghost" onClick={() => {}}><FileDown size={18}/> Export CSV</Button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${isAdvancedVisible ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <Card title="Panel Kontrol Filter" icon={FilterIcon} className="!bg-white/[0.03]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Input label="Pencarian Bebas" placeholder="Cari apapun..." icon={Search} value={filter.search} onChange={(e:any) => setFilter({...filter, search: e.target.value})} />
              <div className="w-full"><label className="block text-[10px] uppercase font-black text-slate-500 mb-2 ml-1">Jenis Transaksi</label><select className="w-full bg-slate-900/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase text-slate-200" value={filter.type} onChange={(e) => setFilter({...filter, type: e.target.value})}><option value="">SEMUA JENIS</option><option value="MASUK">MASUK</option><option value="KELUAR">KELUAR</option><option value="OPNAME">OPNAME</option></select></div>
            </div>
            <div className="space-y-6">
              <ProductAutocomplete label="Spesifik Kode SKU" products={products} value={filter.kode} onChange={(p:any) => setFilter({...filter, kode: p ? p.kode : ''})} />
              <div className="grid grid-cols-2 gap-4"><Input label="Dari" type="date" value={filter.startDate} onChange={(e:any)=>setFilter({...filter, startDate: e.target.value})} icon={Calendar} /><Input label="Sampai" type="date" value={filter.endDate} onChange={(e:any)=>setFilter({...filter, endDate: e.target.value})} icon={Calendar} /></div>
            </div>
            <div className="flex flex-col justify-end pb-1"><Button onClick={() => setFilter(INITIAL_FILTER)} variant="ghost" className="w-full text-rose-500 border-rose-500/10"><RotateCcw size={16}/> Reset Semua</Button></div>
          </div>
        </Card>
      </div>

      <Card className="!p-0 overflow-hidden !border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5 bg-white/[0.02] tracking-widest">
              <tr><th className="p-5">Waktu</th><th className="p-5">Tipe</th><th className="p-5">Barang</th><th className="p-5 text-right">Volume</th><th className="p-5">Operator</th><th className="p-5">Catatan</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-24 text-center opacity-20"><Search size={64} className="mx-auto mb-6"/><p className="text-lg font-black uppercase tracking-widest">Data Tidak Ditemukan</p></td></tr>
              ) : filtered.map((t: any) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all group">
                  <td className="p-5 font-bold text-slate-300 text-xs">{t.tgl}<br/><span className="text-[10px] opacity-40 font-medium">{t.waktu}</span></td>
                  <td className="p-5"><Badge variant={t.jenis === 'MASUK' ? 'success' : t.jenis === 'KELUAR' ? 'danger' : t.jenis === 'AWAL' ? 'purple' : 'info'}>{t.jenis}</Badge></td>
                  <td className="p-5"><p className="font-black text-blue-400 text-[10px] tracking-widest mb-0.5">{t.kode}</p><p className="font-bold text-slate-200 truncate max-w-[200px]">{t.nama}</p></td>
                  <td className="p-5 text-right font-black text-base">{t.jenis === 'KELUAR' ? '-' : '+'}{t.displayQty || t.qty} <span className="text-[10px] opacity-40 font-bold">{t.satuan}</span></td>
                  <td className="p-5 text-xs font-bold text-slate-400">{t.user}</td>
                  <td className="p-5 text-[11px] text-slate-500 italic max-w-[200px] truncate" title={t.keterangan}>{t.keterangan || '-'}</td>
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
    toast(`Supplier ${payload.nama} berhasil disimpan`, 'success');
    setModal({ open: false, editing: null, data: {} }); refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h3 className="text-2xl font-black uppercase tracking-tighter text-white">Database Pihak Ketiga</h3><Button onClick={() => setModal({ open: true, editing: null, data: {} })}><Plus size={18}/> Supplier Baru</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((s: Supplier) => (
          <Card key={s.id} title={s.nama} icon={Truck} subtitle={s.id}>
            <div className="space-y-4 text-sm py-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <p className="font-bold text-slate-200 flex items-center gap-2"><UserIcon size={14} className="text-blue-500"/> {s.pic || '-'}</p>
                <p className="text-slate-400 text-xs flex items-center gap-2 font-mono"><Search size={14} className="text-blue-500"/> {s.telp || '-'}</p>
                <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{s.alamat || '-'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal({ open: true, editing: s, data: s })} className="p-2.5 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"><Edit2 size={18}/></button>
                <button onClick={async () => confirm('Hapus supplier ini?') && (await warehouseService.deleteSupplier(s.id), refresh())} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {modal.open && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[2000] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
          <Card className="w-full max-w-lg shadow-2xl border-white/10" title={modal.editing ? "Update Data Supplier" : "Registrasi Supplier"}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input label="Nama Perusahaan *" value={modal.data.nama || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, nama: e.target.value}})} required />
              <div className="grid grid-cols-2 gap-6">
                <Input label="Kontak PIC" value={modal.data.pic || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, pic: e.target.value}})} />
                <Input label="No. Telp" value={modal.data.telp || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, telp: e.target.value}})} />
              </div>
              <div className="w-full">
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 ml-1 tracking-widest">Alamat Lengkap</label>
                <textarea 
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 min-h-[120px]"
                  value={modal.data.alamat || ''}
                  onChange={(e:any)=>setModal({...modal, data: {...modal.data, alamat: e.target.value}})}
                />
              </div>
              <div className="flex justify-end gap-4 pt-6"><button type="button" onClick={() => setModal({ open: false, editing: null, data: {} })} className="text-slate-600 font-black px-4 text-xs uppercase tracking-widest hover:text-white transition-all">Batal</button><Button type="submit" variant="success" className="px-8">Simpan Database</Button></div>
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
    toast(`Pengguna ${modal.data.username} diperbarui`, 'success'); setModal({ open: false, editing: null, data: {} }); refresh();
  };

  const saveSku = async (e: any) => {
    e.preventDefault();
    await warehouseService.saveProduct({ ...modal.data, minStok: Number(modal.data.minStok || 0), stokAwal: Number(modal.data.stokAwal || 0) });
    toast(`Master SKU ${modal.data.kode} diperbarui`, 'success'); setModal({ open: false, editing: null, data: {} }); refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        {['users', 'skus', 'cloud'].map((tab: any) => (
          <button key={tab} onClick={() => setSubTab(tab)} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${subTab === tab ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-600 hover:text-slate-300'}`}>{tab}</button>
        ))}
      </div>
      {subTab === 'cloud' && (
        <Card title="Cloud Database Integration" icon={LinkIcon} subtitle="Integrasi Google Sheets"><div className="space-y-8 py-4"><Input label="GAS Web App URL (Deployment ID)" value={gasUrl} onChange={(e:any)=>setGasUrl(e.target.value)} placeholder="https://script.google.com/macros/s/..." /><Button variant="success" onClick={() => { warehouseService.setBackendUrl(gasUrl); toast("Sinkronisasi Cloud Aktif", "success"); refresh(); }} className="h-14 w-full md:w-auto px-10"><Save size={18}/> Hubungkan Sistem</Button></div></Card>
      )}
      {subTab === 'users' && (
        <Card title="Akses & Otoritas" icon={UserIcon}>
          <div className="flex justify-end mb-4"><Button onClick={() => setModal({ open: true, editing: null, data: {role:'STAFF', active:true} })}><Plus size={18}/> Tambah Akses</Button></div>
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5 tracking-widest"><tr><th className="p-5">Pengguna</th><th className="p-5">Level</th><th className="p-5 text-right">Aksi</th></tr></thead>
            <tbody>
              {warehouseService.getUsers().map(u => (
                <tr key={u.username} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"><td className="p-5 font-black text-slate-200">{u.username}</td><td className="p-5"><Badge variant={u.role==='ADMIN'?'danger':'info'}>{u.role}</Badge></td><td className="p-5 text-right flex justify-end gap-3"><button onClick={() => setModal({ open: true, editing: u, data: { ...u } })} className="p-2.5 text-blue-400 hover:bg-blue-400/10 rounded-xl"><Edit2 size={18}/></button></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {subTab === 'skus' && (
        <Card title="Inventory Master Database" icon={Database}>
          <div className="flex justify-end mb-4"><Button onClick={() => setModal({ open: true, editing: null, data: {satuanDefault:'PCS', minStok:10, stokAwal:0} })}><Plus size={18}/> SKU Baru</Button></div>
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5 tracking-widest"><tr><th className="p-5">SKU ID</th><th className="p-5">Deskripsi Barang</th><th className="p-5 text-right">Aksi</th></tr></thead>
            <tbody>
              {products.map((p: Product) => (
                <tr key={p.kode} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"><td className="p-5 font-mono text-blue-400 font-bold tracking-widest">{p.kode}</td><td className="p-5 font-bold text-slate-200">{p.nama}</td><td className="p-5 text-right flex justify-end gap-3"><button onClick={() => setModal({ open: true, editing: p, data: { ...p } })} className="p-2.5 text-blue-400 hover:bg-blue-400/10 rounded-xl"><Edit2 size={18}/></button></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {modal.open && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[2000] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
          <Card className="w-full max-w-xl shadow-2xl border-white/10" title={modal.editing ? `Edit ${subTab === 'users' ? 'User' : 'SKU'}` : `Tambah ${subTab === 'users' ? 'User' : 'SKU'}`}>
            <form onSubmit={subTab === 'users' ? saveUser : saveSku} className="space-y-6">
              {subTab === 'users' ? (
                <>
                  <Input label="Username" value={modal.data.username || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, username: e.target.value}})} required disabled={!!modal.editing} />
                  <Input label="Kata Sandi" type="password" value={modal.data.newPassword || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, newPassword: e.target.value}})} required={!modal.editing} />
                  <div className="w-full"><label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Otoritas</label><select className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none" value={modal.data.role} onChange={(e:any)=>setModal({...modal, data: {...modal.data, role: e.target.value}})}><option value="STAFF">STAFF (OPERATOR)</option><option value="ADMIN">ADMIN (FULL ACCESS)</option><option value="VIEWER">VIEWER (READ ONLY)</option></select></div>
                </>
              ) : (
                <>
                  <Input label="Kode SKU *" value={modal.data.kode || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, kode: e.target.value}})} required disabled={!!modal.editing} />
                  <Input label="Nama Lengkap Barang *" value={modal.data.nama || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, nama: e.target.value}})} required />
                  <div className="grid grid-cols-2 gap-6"><Input label="Satuan Dasar *" value={modal.data.satuanDefault || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, satuanDefault: e.target.value}})} required /><Input label="Minimum Safety Stok *" type="number" value={modal.data.minStok || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, minStok: e.target.value}})} required /></div>
                  <Input label="Saldo Awal Inventaris" type="number" value={modal.data.stokAwal || 0} onChange={(e:any)=>setModal({...modal, data: {...modal.data, stokAwal: e.target.value}})} />
                </>
              )}
              <div className="flex justify-end gap-4 pt-6"><button type="button" onClick={() => setModal({ open: false, editing: null, data: {} })} className="text-slate-600 font-black px-4 text-xs uppercase tracking-widest hover:text-white transition-all">Batal</button><Button type="submit" variant="success" className="px-10">Simpan Data</Button></div>
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
    try {
      const success = await warehouseService.syncAll();
      const pData = warehouseService.getProducts();
      setProducts(pData);
      setSuppliers(warehouseService.getSuppliers());
      setTransactions(warehouseService.getTransactions());
      setStock(warehouseService.getStockState());
      if (success) showToast('Database Cloud Sinkron', 'success');
    } catch (e) {
      console.error(e);
      showToast('Gagal sinkron data cloud', 'error');
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
      geminiService.getStockInsights(cachedProducts, stock, transactions).then(setAiInsights);
    }
  }, [activeTab, user, stock, cachedProducts, transactions]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const u = e.target.username.value;
    const p = e.target.password.value;
    
    try {
      const users = warehouseService.getUsers();
      const found = users.find(x => x.username === u);
      
      if (found && found.active) {
        const hashed = await warehouseService.hashPassword(p);
        if (hashed === found.password) {
          setUser(found);
          localStorage.setItem('wareflow_session', JSON.stringify(found));
          showToast(`Sesi Aktif: ${found.username}`, 'success');
        } else {
          showToast('Kata sandi salah.', 'error');
        }
      } else {
        showToast('Pengguna tidak ditemukan atau nonaktif.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal melakukan autentikasi sistem.', 'error');
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#070b14] p-6 bg-main overflow-hidden">
        <Card className="w-full max-w-md p-12 !border-white/5 animate-in fade-in zoom-in-95 duration-500 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 shadow-blue-500/30 animate-pulse"><PackagePlus size={48} className="text-white" /></div>
            <h1 className="text-4xl font-black tracking-tighter text-white italic">WAREFLOW</h1>
            <p className="text-[10px] uppercase font-black text-slate-600 tracking-[0.4em] mt-3">Advanced Warehouse Control</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-8">
            <Input label="Username" name="username" required autoComplete="username" />
            <Input label="Password" type="password" name="password" required autoComplete="current-password" />
            <Button className="w-full h-16 tracking-[0.2em] font-black text-sm" type="submit">LOGIN SECURE</Button>
            <div className="flex justify-between px-1">
               <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest">Internal Access</p>
               <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest">v1.2.5</p>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  const icons: any = { LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, ShieldCheck, MessageCircle };
  const availableTabs = Object.keys(TAB_CONFIG).filter(k => TAB_CONFIG[k].roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-200 overflow-hidden bg-main">
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[3000]">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={(id:string)=>setToasts(toasts.filter(x=>x.id!==id))} />)}
      </div>

      <aside className={`transition-all duration-500 glass-panel border-r border-white/5 h-full flex flex-col z-[100] shrink-0 ${isSidebarOpen ? 'w-80' : 'w-24'}`}>
        <div className="p-10 flex items-center gap-5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-blue-900/40"><PackagePlus size={28} className="text-white"/></div>
          {isSidebarOpen && <span className="font-black text-2xl tracking-tighter text-white italic">WAREFLOW</span>}
        </div>
        <nav className="flex-1 px-5 space-y-3 overflow-y-auto custom-scrollbar mt-6">
          {availableTabs.map(k => {
            const Icon = icons[TAB_CONFIG[k].icon] || LayoutDashboard;
            return (
              <button 
                key={k} 
                onClick={() => setActiveTab(k)} 
                className={`w-full flex items-center gap-5 p-4.5 rounded-[1.5rem] transition-all ${activeTab === k ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40' : 'text-slate-600 hover:bg-white/5 hover:text-slate-300'}`}
              >
                <Icon size={22}/>
                {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-[0.2em]">{TAB_CONFIG[k].label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-8 border-t border-white/5">
          <button onClick={() => { setUser(null); localStorage.removeItem('wareflow_session'); }} className={`w-full flex items-center gap-5 p-4.5 rounded-[1.5rem] text-rose-500 hover:bg-rose-500/10 transition-all ${!isSidebarOpen && 'justify-center'}`}><LogOut size={22}/>{isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-[0.2em]">Logout</span>}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-24 border-b border-white/5 px-12 flex items-center justify-between glass-panel z-50 shrink-0">
          <div className="flex items-center gap-6"><button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-4 hover:bg-white/5 rounded-2xl text-slate-500 transition-colors"><Menu size={24}/></button><h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">{TAB_CONFIG[activeTab]?.label || activeTab}</h2></div>
          <div className="flex items-center gap-8">
            <button onClick={refreshData} disabled={isSyncing} className={`p-4 text-cyan-400 hover:bg-cyan-500/10 rounded-2xl transition-all ${isSyncing ? 'opacity-50' : 'active:rotate-180 duration-500'}`}><RefreshCw size={24} className={isSyncing ? 'animate-spin' : ''}/></button>
            <div className="flex items-center gap-5 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 shadow-inner">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-2xl">{user.username[0].toUpperCase()}</div>
              <div className="hidden lg:block text-right"><p className="text-sm font-black text-slate-100">{user.username}</p><p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-0.5">{user.role}</p></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto pb-24">
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
