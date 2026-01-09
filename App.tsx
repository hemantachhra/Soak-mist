
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Factory, 
  ArrowUpRight, 
  AlertTriangle, 
  Share2, 
  History, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Settings as SettingsIcon, 
  Save, 
  FlaskConical, 
  Box, 
  CheckCircle,
  XCircle,
  Pencil,
  X
} from 'lucide-react';
import { INITIAL_INVENTORY, PRODUCTS as INITIAL_PRODUCTS } from './constants';
import { StockItem, Transaction, Product } from './types';

const Card: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "",
  disabled = false,
  type = "button",
  title
}: { 
  children?: React.ReactNode, 
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success',
  className?: string,
  disabled?: boolean,
  type?: "button" | "submit",
  title?: string
}) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-2.5 rounded-lg font-black text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>}
      <input 
        className="px-3 py-2 bg-white border-2 border-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 text-[14px] font-black transition-all"
        {...props} 
      />
    </div>
  );
};

const Select = ({ label, options, ...props }: any) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>}
    <select 
      className="px-3 py-2 bg-white border-2 border-slate-100 rounded-lg focus:outline-none focus:border-indigo-500 text-[14px] font-black transition-all appearance-none"
      {...props}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="font-black text-[14px]">{opt.label}</option>
      ))}
    </select>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'production' | 'purchases' | 'sales' | 'reports' | 'settings'>('dashboard');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [inventory, setInventory] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [tempInventory, setTempInventory] = useState<StockItem[]>([]);
  const [tempProducts, setTempProducts] = useState<Product[]>([]);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [inventory, products, transactions]);

  // Internal date is YYYY-MM-DD for standard input compat
  const todayRaw = new Date().toISOString().split('T')[0];

  // Helper to convert YYYY-MM-DD to DD/MM/YYYY
  const formatToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const todayFormatted = formatToDDMMYYYY(todayRaw);

  const todayTransactions = useMemo(() => 
    transactions.filter(t => t.date === todayRaw),
  [transactions, todayRaw]);

  const lowStockItems = useMemo(() => 
    inventory.filter(item => item.currentStock <= item.bufferStock),
  [inventory]);

  const updateInventoryFromTx = (t: Transaction, reverse: boolean = false) => {
    const multiplier = reverse ? -1 : 1;
    
    setInventory(prev => prev.map(item => {
      let change = 0;
      
      if (t.type === 'Purchase' && t.itemId === item.id) {
        change = t.quantity * multiplier;
      }
      
      if (t.type === 'Production') {
        const product = products.find(p => p.id === t.productId);
        if (product) {
          const fgId = product.id === 'mist' ? 'mist_finished' : 'soak_finished';
          if (item.id === fgId) change = t.quantity * multiplier;
          if (item.id === 'boxes') change = -t.quantity * multiplier;

          const recipeItem = product.recipe.find(r => r.itemId === item.id);
          if (recipeItem) {
            change = -(t.quantity * product.pcsPerBox * recipeItem.amountPerUnit) * multiplier;
          }
        }
      }

      if (t.type === 'Sale') {
        const product = products.find(p => p.id === t.productId);
        if (product) {
          const fgId = product.id === 'mist' ? 'mist_finished' : 'soak_finished';
          if (item.id === fgId) {
            change = -t.quantity * multiplier;
          }
        }
      }

      return { ...item, currentStock: Math.max(0, item.currentStock + change) };
    }));
  };

  const addTransaction = (t: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setTransactions(prev => [newTransaction, ...prev]);
    updateInventoryFromTx(newTransaction);
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && confirm(`Reverse this ${tx.type}? This will undo stock changes.`)) {
      updateInventoryFromTx(tx, true);
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveSettings = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setInventory(tempInventory);
    setProducts(tempProducts);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      setTempInventory(inventory);
      setTempProducts(products);
    }
  }, [activeTab, inventory, products]);

  const formatNumber = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  const shareViaWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const generateBalanceReport = () => {
    let report = `*Stock Sheet (${todayFormatted})*\n\n`;
    inventory.forEach(item => {
      const alert = item.currentStock <= item.bufferStock ? ' ⚠️' : '';
      report += `• ${item.name}: *${formatNumber(item.currentStock)} ${item.unit}*${alert}\n`;
    });
    return report;
  };

  const generateDailyReport = () => {
    let report = `*DAILY ACTIVITY REPORT*\n📅 Date: ${todayFormatted}\n\n`;
    
    report += `📦 *TODAY'S PRODUCTION:*\n`;
    const prodToday = todayTransactions.filter(t => t.type === 'Production');
    if (prodToday.length === 0) report += "None\n";
    prodToday.forEach(t => {
      report += `✅ Produced ${t.quantity} boxes of ${t.productId?.toUpperCase()}\n`;
    });

    report += `\n📈 *TODAY'S SALES:*\n`;
    const salesToday = todayTransactions.filter(t => t.type === 'Sale');
    if (salesToday.length === 0) report += "None\n";
    salesToday.forEach(t => {
      report += `📉 Sold ${t.quantity} boxes of ${t.productId?.toUpperCase()}\n`;
    });

    report += `\n📊 *CURRENT STOCK BALANCES:*\n`;
    inventory.forEach(item => {
        const alert = item.currentStock <= item.bufferStock ? ' ⚠️' : '';
        report += `• ${item.name}: *${formatNumber(item.currentStock)} ${item.unit}*${alert}\n`;
    });
    
    return report;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-[14px] overflow-x-hidden">
      {/* STICKY HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-[100] h-14 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <h1 className="text-[16px] font-black text-white uppercase tracking-tighter">InvControl</h1>
          <nav className="hidden md:flex items-center gap-1 h-full">
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={16}/>} label="Home" />
            <NavTab active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={16}/>} label="Stock Sheet" />
            <NavTab active={activeTab === 'production'} onClick={() => setActiveTab('production')} icon={<Factory size={16}/>} label="Produce" />
            <NavTab active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')} icon={<ShoppingCart size={16}/>} label="Purchase" />
            <NavTab active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<ArrowUpRight size={16}/>} label="Sale" />
            <NavTab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<Share2 size={16}/>} label="Reports" />
            <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={16}/>} label="Settings" />
          </nav>
          <div className="flex items-center gap-2">
            {activeTab === 'settings' && (
              <button onClick={handleSaveSettings} className="p-2 bg-indigo-600 rounded text-white active:scale-95 transition-all"><Save size={20}/></button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
             <h2 className="text-[18px] font-black uppercase tracking-tighter">Summary ({todayFormatted})</h2>
             <div className="grid grid-cols-2 gap-3">
               <StatsCard title="Boxes Produced Today" value={todayTransactions.filter(t => t.type === 'Production').reduce((acc, t) => acc + t.quantity, 0)} icon={<Factory size={18} className="text-indigo-400"/>} />
               <StatsCard title="Boxes Sold Today" value={todayTransactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + t.quantity, 0)} icon={<ShoppingCart size={18} className="text-emerald-400"/>} />
             </div>

             {lowStockItems.length > 0 && (
              <Card className="bg-amber-50 border-amber-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-amber-600" size={18} />
                  <span className="font-black text-[12px] uppercase text-amber-900">Alert: Low Stocks</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lowStockItems.map(item => (
                    <span key={item.id} className="px-2 py-1 bg-white rounded border border-amber-200 text-[11px] font-bold text-amber-900">
                      {item.name}: {formatNumber(item.currentStock)} {item.unit}
                    </span>
                  ))}
                </div>
              </Card>
             )}

             <Card>
                <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                  <h3 className="font-black text-[12px] uppercase tracking-wider">Today's Activity ({todayFormatted})</h3>
                  <button onClick={() => setActiveTab('inventory')} className="text-[11px] font-black text-indigo-600 underline">View Full Sheet</button>
                </div>
                <div className="divide-y">
                  {todayTransactions.length === 0 ? (
                    <p className="p-6 text-center text-slate-400 font-bold italic">No records for today.</p>
                  ) : (
                    todayTransactions.map(t => (
                      <div key={t.id} className="p-3 flex items-center justify-between text-[13px]">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase mr-2 ${t.type === 'Production' ? 'bg-indigo-100 text-indigo-700' : t.type === 'Sale' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {t.type}
                          </span>
                          <span className="font-black text-slate-800 uppercase">
                            {t.type === 'Purchase' ? inventory.find(i => i.id === t.itemId)?.name : t.productId}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black">{t.quantity} {t.type === 'Purchase' ? inventory.find(i => i.id === t.itemId)?.unit : 'Boxes'}</span>
                          <button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </Card>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-[18px] font-black uppercase tracking-tighter">Stock Sheet ({todayFormatted})</h2>
              <button onClick={() => shareViaWhatsApp(generateBalanceReport())} className="flex items-center gap-1 text-[11px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded uppercase"><Share2 size={12}/> Share Sheet</button>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-right">Min Buffer</th>
                      <th className="px-4 py-3 text-center">Stat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-black text-slate-800 text-[12px]">{item.name}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="font-black text-slate-900">{formatNumber(item.currentStock)}</span>
                          <span className="ml-1 text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-400 font-bold">{formatNumber(item.bufferStock)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <div className={`w-2 h-2 rounded-full mx-auto ${item.currentStock <= item.bufferStock ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500'}`}></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* LOG PRODUCTION - NO LAYOUT SHIFT */}
        {activeTab === 'production' && (
           <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-[18px] font-black uppercase tracking-tighter flex items-center gap-2"><Factory size={20} className="text-indigo-600"/> Log Production</h2>
              <Card className="p-6 border-t-4 border-indigo-600">
                <form className="space-y-5" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addTransaction({
                    type: 'Production',
                    date: formData.get('date') as string,
                    productId: formData.get('product') as any,
                    quantity: Number(formData.get('quantity'))
                  });
                  e.currentTarget.reset();
                  alert('Production Saved.');
                }}>
                  <Input label="Production Date" name="date" type="date" required defaultValue={todayRaw} />
                  <Select label="Select Product" name="product" options={products.map(p => ({ label: p.name.toUpperCase(), value: p.id }))} />
                  <Input label="No. of Boxes Produced" name="quantity" type="number" required placeholder="Boxes" />
                  <Button className="w-full uppercase tracking-wider h-11 text-[13px]" type="submit">Confirm Production</Button>
                </form>
              </Card>
           </div>
        )}

        {/* LOG SALE - NO LAYOUT SHIFT */}
        {activeTab === 'sales' && (
           <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-[18px] font-black uppercase tracking-tighter flex items-center gap-2"><ArrowUpRight size={20} className="text-blue-600"/> Log Sale</h2>
              <Card className="p-6 border-t-4 border-blue-600">
                <form className="space-y-5" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addTransaction({
                    type: 'Sale',
                    date: formData.get('date') as string,
                    productId: formData.get('product') as any,
                    quantity: Number(formData.get('quantity'))
                  });
                  e.currentTarget.reset();
                  alert('Sale Saved.');
                }}>
                  <Input label="Sale Date" name="date" type="date" required defaultValue={todayRaw} />
                  <Select label="Product Sold" name="product" options={products.map(p => ({ label: p.name.toUpperCase(), value: p.id }))} />
                  <Input label="No. of Boxes Sold" name="quantity" type="number" required />
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 uppercase h-11 text-[13px]" type="submit">Confirm Sale</Button>
                </form>
              </Card>
           </div>
        )}

        {/* LOG PURCHASE - NO LAYOUT SHIFT */}
        {activeTab === 'purchases' && (
           <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-[18px] font-black uppercase tracking-tighter flex items-center gap-2"><ShoppingCart size={20} className="text-emerald-600"/> Material Purchase</h2>
              <Card className="p-6 border-t-4 border-emerald-600">
                <form className="space-y-5" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addTransaction({
                    type: 'Purchase',
                    date: formData.get('date') as string,
                    itemId: formData.get('item') as string,
                    quantity: Number(formData.get('quantity'))
                  });
                  e.currentTarget.reset();
                  alert('Purchase Saved.');
                }}>
                  <Input label="Purchase Date" name="date" type="date" required defaultValue={todayRaw} />
                  <Select label="Item Purchased" name="item" options={inventory.filter(i => i.category !== 'Finished Good').map(i => ({ label: `${i.name} (${i.unit})`, value: i.id }))} />
                  <Input label="Quantity Received" name="quantity" type="number" step="0.01" required />
                  <Button variant="success" className="w-full uppercase h-11 text-[13px]" type="submit">Confirm Purchase</Button>
                </form>
              </Card>
           </div>
        )}

        {activeTab === 'reports' && (
           <div className="space-y-6 max-w-xl mx-auto">
             <h2 className="text-[18px] font-black uppercase tracking-tighter px-2">Reports Hub</h2>
             <div className="grid grid-cols-2 gap-3">
               <Card className="p-5 text-center flex flex-col items-center">
                 <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3"><Share2 size={24}/></div>
                 <h4 className="font-black text-[11px] uppercase mb-4 tracking-wider">Daily Activity</h4>
                 <Button onClick={() => shareViaWhatsApp(generateDailyReport())} className="w-full text-[11px]">WhatsApp</Button>
               </Card>
               <Card className="p-5 text-center flex flex-col items-center">
                 <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3"><Package size={24}/></div>
                 <h4 className="font-black text-[11px] uppercase mb-4 tracking-wider">Stock Sheet</h4>
                 <Button onClick={() => shareViaWhatsApp(generateBalanceReport())} variant="secondary" className="w-full text-emerald-700 border-emerald-100 text-[11px]">WhatsApp</Button>
               </Card>
             </div>
             <div className="bg-slate-900 rounded-xl p-4">
                <p className="text-[9px] text-slate-500 font-black uppercase mb-3 tracking-widest">Live Report Preview</p>
                <pre className="text-emerald-400 text-[11px] font-mono font-bold whitespace-pre-wrap leading-tight">{generateDailyReport()}</pre>
             </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 pb-10">
            <h2 className="text-[18px] font-black uppercase tracking-tighter px-2">System Configuration</h2>

            <div className="space-y-3">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-indigo-600 px-2 flex items-center gap-2"><Box size={14}/> Pcs Per Box</h3>
              <div className="grid grid-cols-2 gap-3 px-2">
                {tempProducts.map(p => (
                  <Card key={p.id} className="p-3">
                    <label className="text-[10px] font-black uppercase text-slate-500">{p.name} Units/Box</label>
                    <input 
                      type="number"
                      className="w-full mt-1 border-b-2 border-slate-100 focus:border-indigo-500 outline-none text-[16px] font-black"
                      value={p.pcsPerBox}
                      onChange={(e) => setTempProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, pcsPerBox: Number(e.target.value) } : prod))}
                    />
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-indigo-600 px-2 flex items-center gap-2"><FlaskConical size={14}/> Formulation (Grams/Pc)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tempProducts.map(prod => (
                  <Card key={prod.id} className="overflow-hidden border-2">
                    <div className="bg-slate-900 p-2.5 flex justify-between items-center">
                      <h4 className="font-black text-white text-[12px] uppercase">{prod.name} Recipe</h4>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{prod.weightPerPc}g Total</span>
                    </div>
                    <div className="p-1 max-h-[300px] overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <th className="px-2 py-2 text-left uppercase">Ingredient</th>
                            <th className="px-2 py-2 text-center uppercase">G/Pc</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prod.recipe.map(r => (
                            <tr key={r.itemId} className="border-b border-slate-50 last:border-0">
                              <td className="px-2 py-1.5 font-bold text-slate-700">{tempInventory.find(i => i.id === r.itemId)?.name}</td>
                              <td className="px-2 py-1.5">
                                <input 
                                  type="number" step="0.001"
                                  className="w-full text-center py-0.5 bg-slate-50 border border-slate-100 rounded font-black text-indigo-600"
                                  value={r.amountPerUnit}
                                  onChange={(e) => setTempProducts(prev => prev.map(p => {
                                    if (p.id !== prod.id) return p;
                                    return {
                                      ...p,
                                      recipe: p.recipe.map(recipeItem => recipeItem.itemId === r.itemId ? { ...recipeItem, amountPerUnit: Number(e.target.value) } : recipeItem)
                                    };
                                  }))}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-indigo-600 px-2 flex items-center gap-2"><Package size={14}/> Opening Stock</h3>
              <Card className="overflow-hidden border-2">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-2">Item Name</th>
                      <th className="px-4 py-2 text-center">Bal</th>
                      <th className="px-4 py-2 text-center">Buf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[12px]">
                    {tempInventory.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-1.5 font-bold">{item.name}</td>
                        <td className="px-4 py-1.5">
                          <input 
                            type="number" step="0.01"
                            className="w-full text-center py-1 bg-white border rounded font-black focus:border-indigo-500 outline-none"
                            value={item.currentStock}
                            onChange={(e) => setTempInventory(prev => prev.map(inv => inv.id === item.id ? { ...inv, currentStock: Number(e.target.value) } : inv))}
                          />
                        </td>
                        <td className="px-4 py-1.5">
                          <input 
                            type="number" step="0.01"
                            className="w-full text-center py-1 bg-white border rounded font-black focus:border-indigo-500 outline-none"
                            value={item.bufferStock}
                            onChange={(e) => setTempInventory(prev => prev.map(inv => inv.id === item.id ? { ...inv, bufferStock: Number(e.target.value) } : inv))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE TAB BAR */}
      <nav className="md:hidden bg-slate-900 border-t border-slate-800 fixed bottom-0 left-0 right-0 h-16 grid grid-cols-7 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <MobileTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18}/>} />
        <MobileTab active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={18}/>} />
        <MobileTab active={activeTab === 'production'} onClick={() => setActiveTab('production')} icon={<Factory size={18}/>} />
        <MobileTab active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')} icon={<ShoppingCart size={18}/>} />
        <MobileTab active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} icon={<ArrowUpRight size={18}/>} />
        <MobileTab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<Share2 size={18}/>} />
        <MobileTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={18}/>} />
      </nav>
    </div>
  );
};

const NavTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[11px] font-black uppercase ${active ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"}`}>
    {icon} <span>{label}</span>
  </button>
);

const MobileTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`flex items-center justify-center transition-all ${active ? "text-indigo-400 border-t-4 border-indigo-400 -mt-1" : "text-slate-500"}`}>
    {icon}
  </button>
);

const StatsCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Card className="p-4 border-2">
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <p className="text-[20px] font-black text-slate-900 tracking-tighter">{value}</p>
  </Card>
);

export default App;
