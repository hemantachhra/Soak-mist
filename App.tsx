
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Factory, 
  ArrowUpRight, 
  AlertTriangle, 
  Share2, 
  Settings as SettingsIcon, 
  Save, 
  FlaskConical, 
  Box, 
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
  type = "button"
}: { 
  children?: React.ReactNode, 
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success',
  className?: string,
  disabled?: boolean,
  type?: "button" | "submit"
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

  const todayRaw = new Date().toISOString().split('T')[0];

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
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-[100] h-14 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <h1 className="text-[16px] font-black text-white uppercase tracking-tighter">InvControl</h1>
          <nav className="hidden md:flex items-center gap-1 h-full">
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={16}/>} label="Home" />
            <NavTab active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={16}/>} label="Stock" />
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
               <StatsCard title="Produced Today" value={todayTransactions.filter(t => t.type === 'Production').reduce((acc, t) => acc + t.quantity, 0)} icon={<Factory size={18} className="text-indigo-400"/>} />
               <StatsCard title="Sold Today" value={todayTransactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + t.quantity, 0)} icon={<ShoppingCart size={18} className="text-emerald-400"/>} />
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
                      {item.name}: {formatNumber(item.currentStock)}
                    </span>
                  ))}
                </div>
              </Card>
             )}

             <Card>
                <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                  <h3 className="font-black text-[12px] uppercase tracking-wider">Today's Activity</h3>
                  <button onClick={() => setActiveTab('inventory')} className="text-[11px] font-black text-indigo-600 underline">Full Sheet</button>
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
              <h2 className="text-[18px] font-black uppercase tracking-tighter">Stock Sheet</h2>
              <button onClick={() => shareViaWhatsApp(generateBalanceReport())} className="flex items-center gap-1 text-[11px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded uppercase"><Share2 size={12}/> Share</button>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-center">Status</th>
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
                        <td className="px-4 py-2.5 text-center">
                          <div className={`w-2 h-2 rounded-full mx-auto ${item.currentStock <= item.bufferStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'production' && (
           <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-[18px] font-black uppercase tracking-tighter flex items-center gap-2">Produce</h2>
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
                  <Input label="Date" name="date" type="date" required defaultValue={todayRaw} />
                  <Select label="Product" name="product" options={products.map(p => ({ label: p.name.toUpperCase(), value: p.id }))} />
                  <Input label="Boxes Produced" name="quantity" type="number" required />
                  <Button className="w-full uppercase h-11" type="submit">Log Production</Button>
                </form>
              </Card>
           </div>
        )}

        {activeTab === 'sales' && (
           <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-[18px] font-black uppercase tracking-tighter flex items-center gap-2">Sale</h2>
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
                  <Input label="Date" name="date" type="date" required defaultValue={todayRaw} />
                  <Select label="Product" name="product" options={products.map(p => ({ label: p.name.toUpperCase(), value: p.id }))} />
                  <Input label="Boxes Sold" name="quantity" type="number" required />
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 uppercase h-11" type="submit">Log Sale</Button>
                </form>
              </Card>
           </div>
        )}

        {activeTab === 'purchases' && (
           <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-[18px] font-black uppercase tracking-tighter flex items-center gap-2">Purchase</h2>
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
                  <Input label="Date" name="date" type="date" required defaultValue={todayRaw} />
                  <Select label="Material" name="item" options={inventory.filter(i => i.category !== 'Finished Good').map(i => ({ label: `${i.name} (${i.unit})`, value: i.id }))} />
                  <Input label="Quantity" name="quantity" type="number" step="0.01" required />
                  <Button variant="success" className="w-full uppercase h-11" type="submit">Log Purchase</Button>
                </form>
              </Card>
           </div>
        )}

        {activeTab === 'reports' && (
           <div className="space-y-6 max-w-xl mx-auto">
             <h2 className="text-[18px] font-black uppercase tracking-tighter">Reports</h2>
             <div className="grid grid-cols-2 gap-3">
               <Card className="p-5 text-center flex flex-col items-center">
                 <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3"><Share2 size={20}/></div>
                 <h4 className="font-black text-[10px] uppercase mb-4 tracking-wider">Daily Report</h4>
                 <Button onClick={() => shareViaWhatsApp(generateDailyReport())} className="w-full text-[11px]">WhatsApp</Button>
               </Card>
               <Card className="p-5 text-center flex flex-col items-center">
                 <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3"><Package size={20}/></div>
                 <h4 className="font-black text-[10px] uppercase mb-4 tracking-wider">Stock Sheet</h4>
                 <Button onClick={() => shareViaWhatsApp(generateBalanceReport())} variant="secondary" className="w-full text-[11px]">WhatsApp</Button>
               </Card>
             </div>
             <div className="bg-slate-900 rounded-xl p-4">
                <pre className="text-emerald-400 text-[11px] font-mono whitespace-pre-wrap leading-tight">{generateDailyReport()}</pre>
             </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 pb-10">
            <h2 className="text-[18px] font-black uppercase tracking-tighter">Configuration</h2>

            <div className="space-y-3">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2"><Box size={14}/> Pcs Per Box</h3>
              <div className="grid grid-cols-2 gap-3">
                {tempProducts.map(p => (
                  <Card key={p.id} className="p-3">
                    <label className="text-[10px] font-black uppercase text-slate-500">{p.name}</label>
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
              <h3 className="text-[12px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2"><FlaskConical size={14}/> Formulation (g/pc)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tempProducts.map(prod => (
                  <Card key={prod.id} className="overflow-hidden">
                    <div className="bg-slate-900 p-2 flex justify-between items-center text-white text-[11px] uppercase font-black">
                      <span>{prod.name} Recipe</span>
                    </div>
                    <div className="p-1 max-h-[300px] overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <tbody>
                          {prod.recipe.map(r => (
                            <tr key={r.itemId} className="border-b border-slate-50 last:border-0">
                              <td className="px-2 py-1.5 font-bold text-slate-700">{tempInventory.find(i => i.id === r.itemId)?.name}</td>
                              <td className="px-2 py-1.5">
                                <input 
                                  type="number" step="0.001"
                                  className="w-full text-center py-0.5 bg-slate-50 border rounded font-black text-indigo-600"
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
          </div>
        )}
      </main>

      <nav className="md:hidden bg-slate-900 border-t border-slate-800 fixed bottom-0 left-0 right-0 h-16 grid grid-cols-7 z-[100]">
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

const NavTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[11px] font-black uppercase ${active ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"}`}>
    {icon} <span>{label}</span>
  </button>
);

const MobileTab = ({ active, onClick, icon }: any) => (
  <button onClick={onClick} className={`flex items-center justify-center transition-all ${active ? "text-indigo-400" : "text-slate-500"}`}>
    {icon}
  </button>
);

const StatsCard = ({ title, value, icon }: any) => (
  <Card className="p-4 border-2">
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    <p className="text-[20px] font-black text-slate-900 tracking-tighter">{value}</p>
  </Card>
);

export default App;
