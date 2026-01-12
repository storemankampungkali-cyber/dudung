
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, 
  ShieldCheck, LogOut, Menu, User as UserIcon, Bell, Search, RefreshCw, Plus, 
  Trash2, Save, X, FileDown, CheckCircle2, Info, XCircle, AlertTriangle, 
  TrendingUp, Activity, Box, Edit2, Filter, Database, Link as LinkIcon,
  MessageCircle, Send
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
          <Card title="Audit Berbasis AI" icon={Bell} className="border-blue-500/20 bg-blue-500/[0.02]">
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap italic opacity-90">{insights || "Sedang memproses data untuk audit..."}</p>
          </Card>
          <Card title="Peringatan Restock Segera" icon={AlertTriangle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                  <tr><th className="p-3">Nama Barang</th><th className="p-3 text-right">Stok</th><th className="p-3 text-right">Min</th><th className="p-3 text-center">Status</th></tr>
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
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <Card title="Aktivitas Terkini" icon={History}>
          <div className="space-y-3">
            {transactions.slice(-8).reverse().map((t: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.jenis === 'MASUK' ? 'bg-emerald-500/20 text-emerald-400' : t.jenis === 'KELUAR' ? 'bg-rose-500/20 text-rose-400' : t.jenis === 'AWAL' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {t.jenis === 'MASUK' ? <PackagePlus size={16}/> : t.jenis === 'KELUAR' ? <PackageMinus size={16}/> : t.jenis === 'AWAL' ? <Plus size={16}/> : <ClipboardCheck size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-slate-200">{t.nama}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">{t.jenis} • {t.displayQty || t.qty} {t.satuan}</p>
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
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const onSend = async (e: any) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const response = await geminiService.chat(userMsg);
    setMessages(prev => [...prev, { role: 'model', text: response || "Maaf, AI sedang tidak dapat merespons." }]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-4">
      <Card title="AI Assistant General" icon={MessageCircle} subtitle="Kecerdasan Buatan Terintegrasi" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-40">
              <MessageCircle size={64} />
              <p className="text-sm font-medium">Apa yang ingin Anda tanyakan hari ini?</p>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-slate-200'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
        <form onSubmit={onSend} className="mt-4 flex gap-2">
          <Input placeholder="Tulis pertanyaan umum di sini..." value={input} onChange={(e: any) => setInput(e.target.value)} />
          <Button type="submit" disabled={loading} className="px-6 h-[42px]"><Send size={18}/></Button>
        </form>
      </Card>
    </div>
  );
}

function SupplierView({ suppliers, refresh, toast }: any) {
  const [modal, setModal] = useState({ open: false, editing: null as any, data: {} as any });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = {
      id: modal.editing?.id || `SUP-${Date.now()}`,
      ...modal.data
    };
    await warehouseService.saveSupplier(payload);
    toast(`Supplier ${payload.nama} disimpan`, 'success');
    setModal({ open: false, editing: null, data: {} });
    refresh();
  };

  const remove = async (id: string) => {
    if (confirm('Hapus supplier ini?')) {
      await warehouseService.deleteSupplier(id);
      toast('Supplier dihapus', 'info');
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tighter text-white">Database Supplier</h3><Button onClick={() => setModal({ open: true, editing: null, data: {} })}><Plus size={18}/> Tambah Supplier</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((s: Supplier) => (
          <Card key={s.id} title={s.nama} icon={Truck} subtitle={s.id}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-300">PIC: {s.pic || '-'}</p>
                  <p className="text-slate-500">{s.telp || '-'}</p>
                  <p className="text-slate-400 line-clamp-2 text-xs mt-1">{s.alamat || '-'}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button onClick={() => setModal({ open: true, editing: s, data: s })} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit2 size={16}/></button>
                <button onClick={() => remove(s.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {modal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <Card className="w-full max-w-lg shadow-2xl" title={modal.editing ? "Edit Supplier" : "Supplier Baru"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nama Supplier" value={modal.data.nama || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, nama: e.target.value}})} required />
              <Input label="PIC" value={modal.data.pic || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, pic: e.target.value}})} />
              <Input label="Telepon" value={modal.data.telp || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, telp: e.target.value}})} />
              <Input label="Alamat" value={modal.data.alamat || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, alamat: e.target.value}})} />
              <div className="flex justify-end gap-3 pt-6"><button type="button" onClick={() => setModal({ open: false, editing: null, data: {} })} className="text-slate-500 font-bold px-4">Batal</button><Button type="submit" variant="success">Simpan Database</Button></div>
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
    const rawPass = modal.data.newPassword;
    await warehouseService.saveUser(modal.data, rawPass);
    toast(`User ${modal.data.username} berhasil disimpan`, 'success');
    setModal({ open: false, editing: null, data: {} }); refresh();
  };

  const saveSku = async (e: any) => {
    e.preventDefault();
    const isNew = !modal.editing;
    const finalProduct = { ...modal.data, minStok: Number(modal.data.minStok) };
    delete finalProduct.stokAwal; // Don't save this in product metadata
    
    await warehouseService.saveProduct(finalProduct);
    
    if (isNew && modal.data.stokAwal > 0) {
      await warehouseService.saveTransaction({
        tgl: new Date().toISOString().split('T')[0],
        jenis: 'AWAL',
        kode: modal.data.kode,
        nama: modal.data.nama,
        qty: parseFloat(modal.data.stokAwal),
        satuan: modal.data.satuanDefault,
        displayQty: parseFloat(modal.data.stokAwal),
        user: currentUser.username,
        keterangan: 'Input Saldo Awal SKU Baru'
      });
    }

    toast(`Master SKU ${modal.data.kode} disimpan`, 'success');
    setModal({ open: false, editing: null, data: {} }); refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        {['users', 'skus', 'cloud'].map((tab: any) => (
          <button key={tab} onClick={() => setSubTab(tab)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>{tab}</button>
        ))}
      </div>

      {subTab === 'cloud' && (
        <Card title="Koneksi Cloud Spreadsheet" icon={LinkIcon}>
          <div className="space-y-6">
            <Input label="GAS Web App URL" value={gasUrl} onChange={(e:any)=>setGasUrl(e.target.value)} placeholder="https://..." />
            <Button variant="success" onClick={() => { warehouseService.setBackendUrl(gasUrl); toast("URL Backend Disimpan", "success"); refresh(); }}><Save size={18}/> Sinkronisasi</Button>
          </div>
        </Card>
      )}

      {subTab === 'users' && (
        <Card title="Otoritas Pengguna" icon={UserIcon}>
          <div className="flex justify-end mb-4"><Button onClick={() => setModal({ open: true, editing: null, data: {role:'STAFF', active:true} })}><Plus size={18}/> Tambah Akses</Button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5 tracking-wider">
                <tr><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr>
              </thead>
              <tbody>
                {warehouseService.getUsers().map(u => (
                  <tr key={u.username} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 font-black">{u.username}</td>
                    <td className="p-4"><Badge variant={u.role==='ADMIN'?'danger':'info'}>{u.role}</Badge></td>
                    <td className="p-4">{u.active ? <span className="text-emerald-400 font-black text-[10px]">● AKTIF</span> : <span className="text-rose-400 font-black text-[10px]">● NONAKTIF</span>}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => setModal({ open: true, editing: u, data: { ...u } })} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit2 size={16}/></button>
                      {u.username !== currentUser.username && (
                        <button onClick={async () => { if(confirm('Hapus user ini?')) { await warehouseService.deleteUser(u.username); refresh(); } }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {subTab === 'skus' && (
        <Card title="Master Data SKU" icon={Database}>
          <div className="flex justify-end mb-4"><Button onClick={() => setModal({ open: true, editing: null, data: {satuanDefault:'PCS', minStok:10, stokAwal:0} })}><Plus size={18}/> SKU Baru</Button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5">
                <tr><th className="p-4">Kode SKU</th><th className="p-4">Nama Barang</th><th className="p-4 text-right">Aksi</th></tr>
              </thead>
              <tbody>
                {products.map((p: Product) => (
                  <tr key={p.kode} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 font-mono text-blue-400 font-bold">{p.kode}</td>
                    <td className="p-4 font-bold">{p.nama}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => setModal({ open: true, editing: p, data: { ...p } })} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit2 size={16}/></button>
                      <button onClick={async () => { if(confirm('Hapus SKU?')) { await warehouseService.deleteProduct(p.kode); refresh(); } }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <Card className="w-full max-w-xl shadow-2xl" title={modal.editing ? `Edit ${subTab === 'users' ? 'User' : 'SKU'}` : `Tambah ${subTab === 'users' ? 'User' : 'SKU'}`}>
            <form onSubmit={subTab === 'users' ? saveUser : saveSku} className="space-y-4">
              {subTab === 'users' ? (
                <>
                  <Input label="Username" value={modal.data.username || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, username: e.target.value}})} required disabled={!!modal.editing} />
                  <Input label={modal.editing ? "Password Baru (Kosongkan jika tidak ubah)" : "Password"} type="password" value={modal.data.newPassword || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, newPassword: e.target.value}})} required={!modal.editing} />
                  <div className="w-full"><label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Role</label><select className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200" value={modal.data.role} onChange={(e:any)=>setModal({...modal, data: {...modal.data, role: e.target.value}})}><option value="STAFF">STAFF</option><option value="ADMIN">ADMIN</option><option value="VIEWER">VIEWER</option></select></div>
                  <div className="flex items-center gap-2 pt-2"><input type="checkbox" checked={modal.data.active} onChange={(e)=>setModal({...modal, data: {...modal.data, active: e.target.checked}})} className="w-4 h-4 accent-blue-600" /><label className="text-sm font-bold">Akun Aktif</label></div>
                </>
              ) : (
                <>
                  <Input label="Kode SKU" value={modal.data.kode || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, kode: e.target.value}})} required disabled={!!modal.editing} />
                  <Input label="Nama Lengkap Barang" value={modal.data.nama || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, nama: e.target.value}})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Satuan Dasar" value={modal.data.satuanDefault || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, satuanDefault: e.target.value}})} required />
                    <Input label="Min Stok" type="number" value={modal.data.minStok || ''} onChange={(e:any)=>setModal({...modal, data: {...modal.data, minStok: e.target.value}})} required />
                  </div>
                  {!modal.editing && <Input label="Saldo Awal Sistem" type="number" value={modal.data.stokAwal || 0} onChange={(e:any)=>setModal({...modal, data: {...modal.data, stokAwal: e.target.value}})} />}
                </>
              )}
              <div className="flex justify-end gap-3 pt-6"><button type="button" onClick={() => setModal({ open: false, editing: null, data: {} })} className="text-slate-500 font-bold px-4">Batal</button><Button type="submit" variant="success">Simpan Data</Button></div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

// --- Missing View Components ---

// Fix for missing TransactionView
function TransactionView({ type, products, suppliers, stock, user, refresh, toast }: any) {
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
  const currentStock = stock[formData.kode] || 0;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.kode || !formData.qty || !formData.satuan) {
      toast('Lengkapi data transaksi', 'warning');
      return;
    }

    const qtyNum = parseFloat(formData.qty);
    let displayQty = qtyNum;
    
    // Simple conversion logic based on Product metadata
    if (selectedProduct) {
      if (formData.satuan === selectedProduct.satuanAlt1) {
        displayQty = qtyNum * (selectedProduct.konversiAlt1 || 1);
      } else if (formData.satuan === selectedProduct.satuanAlt2) {
        displayQty = qtyNum * (selectedProduct.konversiAlt2 || 1);
      }
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

    toast(`Transaksi ${type} berhasil`, 'success');
    setFormData({ kode: '', qty: '', satuan: '', supplier: '', noSJ: '', noPO: '', keterangan: '' });
    refresh();
  };

  return (
    <Card title={`Transaksi ${type}`} icon={type === 'MASUK' ? PackagePlus : type === 'KELUAR' ? PackageMinus : ClipboardCheck}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="w-full">
            <label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 ml-1">Pilih Barang</label>
            <select 
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200"
              value={formData.kode}
              onChange={(e) => {
                const p = products.find((x:any) => x.kode === e.target.value);
                setFormData({...formData, kode: e.target.value, satuan: p?.satuanDefault || ''});
              }}
              required
            >
              <option value="">-- Pilih SKU --</option>
              {products.map((p: any) => (
                <option key={p.kode} value={p.kode}>{p.kode} - {p.nama}</option>
              ))}
            </select>
          </div>
          
          {selectedProduct && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 uppercase">Stok Saat Ini</span>
                <span className={currentStock < selectedProduct.minStok ? 'text-rose-500' : 'text-emerald-500'}>
                  {currentStock} {selectedProduct.satuanDefault}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Jumlah / Qty" type="number" step="any" value={formData.qty} onChange={(e:any) => setFormData({...formData, qty: e.target.value})} required />
            <div className="w-full">
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 ml-1">Satuan</label>
              <select 
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200"
                value={formData.satuan}
                onChange={(e) => setFormData({...formData, satuan: e.target.value})}
                required
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
        </div>

        <div className="space-y-4">
          {type === 'MASUK' && (
            <>
              <div className="w-full">
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1.5 ml-1">Supplier</label>
                <select 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-slate-200"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                >
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.nama}>{s.nama}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="No. SJ" value={formData.noSJ} onChange={(e:any) => setFormData({...formData, noSJ: e.target.value})} />
                <Input label="No. PO" value={formData.noPO} onChange={(e:any) => setFormData({...formData, noPO: e.target.value})} />
              </div>
            </>
          )}
          <Input label="Keterangan / Notes" value={formData.keterangan} onChange={(e:any) => setFormData({...formData, keterangan: e.target.value})} />
          <div className="pt-4">
            <Button type="submit" variant={type === 'MASUK' ? 'success' : type === 'KELUAR' ? 'danger' : 'primary'} className="w-full h-12">
              PROSES TRANSAKSI {type}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

// Fix for missing HistoryView
function HistoryView({ transactions, products, toast }: any) {
  const [filter, setFilter] = useState({ search: '', type: '' });

  const filtered = transactions.filter((t: any) => {
    const matchesSearch = t.nama.toLowerCase().includes(filter.search.toLowerCase()) || 
                         t.kode.toLowerCase().includes(filter.search.toLowerCase()) ||
                         t.keterangan.toLowerCase().includes(filter.search.toLowerCase());
    const matchesType = filter.type === '' || t.jenis === filter.type;
    return matchesSearch && matchesType;
  }).reverse();

  const exportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Waktu', 'Jenis', 'Kode', 'Nama', 'Qty', 'Satuan', 'User', 'Keterangan', 'Supplier', 'NoSJ', 'NoPO'];
    const rows = filtered.map((t: any) => [
      t.id, t.tgl, t.waktu, t.jenis, t.kode, t.nama, t.displayQty || t.qty, t.satuan, t.user, t.keterangan, t.supplier || '', t.noSJ || '', t.noPO || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(",") + "\n" + 
      rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `warehouse_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('History diekspor ke CSV', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Logistik & Audit Trailing</h3>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              placeholder="Cari SKU / Nama / Ket..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
            />
          </div>
          <select 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase text-slate-200"
            value={filter.type}
            onChange={(e) => setFilter({...filter, type: e.target.value})}
          >
            <option value="">SEMUA JENIS</option>
            <option value="MASUK">MASUK</option>
            <option value="KELUAR">KELUAR</option>
            <option value="OPNAME">OPNAME</option>
            <option value="AWAL">SALDO AWAL</option>
          </select>
          <Button variant="ghost" onClick={exportCSV}><FileDown size={18}/> Export</Button>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-500 font-black uppercase border-b border-white/5 bg-white/[0.02]">
              <tr>
                <th className="p-4">Tanggal / Waktu</th>
                <th className="p-4">Jenis</th>
                <th className="p-4">Barang</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4">User</th>
                <th className="p-4">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t: any) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-200">{t.tgl}</p>
                    <p className="text-[10px] text-slate-500">{t.waktu}</p>
                  </td>
                  <td className="p-4">
                    <Badge variant={t.jenis === 'MASUK' ? 'success' : t.jenis === 'KELUAR' ? 'danger' : t.jenis === 'AWAL' ? 'purple' : 'info'}>
                      {t.jenis}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <p className="font-black text-blue-400 text-xs">{t.kode}</p>
                    <p className="font-bold text-slate-300 truncate max-w-[200px]">{t.nama}</p>
                  </td>
                  <td className="p-4 text-right">
                    <p className={`font-black ${t.jenis === 'MASUK' ? 'text-emerald-500' : t.jenis === 'KELUAR' ? 'text-rose-500' : 'text-slate-200'}`}>
                      {t.jenis === 'KELUAR' ? '-' : '+'}{t.displayQty || t.qty}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold">{t.satuan}</p>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-400">{t.user}</td>
                  <td className="p-4 text-[11px] text-slate-500 italic max-w-xs truncate">{t.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// --- Main App Component ---

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
      showToast('Koneksi Cloud Spreadsheet belum diatur.', 'warning');
    } else if (success) {
      showToast('Database Cloud Sinkron', 'success');
    } else {
      showToast('Offline Mode (Data Lokal)', 'info');
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

  // Handle Login
  const handleLogin = async (e: any) => {
    e.preventDefault();
    const u = e.target.username.value;
    const p = e.target.password.value;
    const found = warehouseService.getUsers().find(x => x.username === u);
    
    if (found && found.active) {
      const hashed = await warehouseService.hashPassword(p);
      if (hashed === found.password) {
        setUser(found);
        localStorage.setItem('wareflow_session', JSON.stringify(found));
        showToast(`Selamat datang, ${found.username}!`, 'success');
      } else showToast('Password Salah', 'error');
    } else showToast('User Tidak Ditemukan atau Nonaktif', 'error');
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#070b14] p-6 bg-main">
        <Card className="w-full max-w-md p-10 !border-white/5 animate-in fade-in zoom-in-95">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 shadow-blue-500/30"><PackagePlus size={40} className="text-white" /></div>
            <h1 className="text-4xl font-black tracking-tighter text-white">WAREFLOW</h1>
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-2 opacity-50">Secure AI Inventory</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <Input label="Username" name="username" required />
            <Input label="Password" type="password" name="password" required />
            <Button className="w-full h-14" type="submit">AUTENTIKASI</Button>
            <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-wider">Pass default: admin123</p>
          </form>
        </Card>
      </div>
    );
  }

  const icons: any = { LayoutDashboard, PackagePlus, PackageMinus, ClipboardCheck, History, Truck, ShieldCheck, MessageCircle };

  // Filter tabs based on RBAC
  const availableTabs = Object.keys(TAB_CONFIG).filter(k => TAB_CONFIG[k].roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-200 overflow-hidden bg-main">
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000]">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={(id:string)=>setToasts(toasts.filter(x=>x.id!==id))} />)}
      </div>

      <aside className={`transition-all duration-500 glass-panel border-r border-white/5 h-full flex flex-col z-50 shrink-0 ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-4"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0"><PackagePlus size={24} className="text-white"/></div>{isSidebarOpen && <span className="font-black text-xl tracking-tighter text-white">WAREFLOW</span>}</div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar mt-4">
          {availableTabs.map(k => {
            const Icon = icons[TAB_CONFIG[k].icon] || LayoutDashboard;
            return (<button key={k} onClick={() => setActiveTab(k)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === k ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}><Icon size={20}/>{isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">{TAB_CONFIG[k].label}</span>}</button>);
          })}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => { setUser(null); localStorage.removeItem('wareflow_session'); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all ${!isSidebarOpen && 'justify-center'}`}><LogOut size={20}/>{isSidebarOpen && <span className="font-black text-xs uppercase tracking-widest">Keluar</span>}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between glass-panel z-40 shrink-0">
          <div className="flex items-center gap-4"><button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-white/5 rounded-xl text-slate-400"><Menu size={20}/></button><h2 className="text-xl font-black uppercase tracking-tight text-white leading-none">{TAB_CONFIG[activeTab]?.label || activeTab}</h2></div>
          <div className="flex items-center gap-6">
            <button onClick={refreshData} disabled={isSyncing} className={`p-3 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all ${isSyncing ? 'opacity-50' : 'active:rotate-180 duration-500'}`}><RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''}/></button>
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm">{user.username[0].toUpperCase()}</div>
              <div className="hidden lg:block text-right"><p className="text-xs font-black text-slate-200">{user.username}</p><p className="text-[8px] font-black uppercase tracking-wider text-slate-500 mt-0.5">{user.role}</p></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">
            {activeTab === 'dashboard' && <DashboardView stock={stock} products={products} transactions={transactions} insights={aiInsights} />}
            {activeTab === 'masuk' && <TransactionView type="MASUK" products={products} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'keluar' && <TransactionView type="KELUAR" products={products} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'opname' && <TransactionView type="OPNAME" products={products} suppliers={suppliers} stock={stock} user={user} refresh={refreshData} toast={showToast} />}
            {activeTab === 'riwayat' && <HistoryView transactions={transactions} products={products} toast={showToast} />}
            {activeTab === 'supplier' && <SupplierView suppliers={suppliers} refresh={refreshData} toast={showToast} />}
            {activeTab === 'chat' && <ChatView />}
            {activeTab === 'admin' && <AdminView refresh={refreshData} currentUser={user} toast={showToast} products={products} />}
          </div>
        </main>
      </div>
    </div>
  );
}
