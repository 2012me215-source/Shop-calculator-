/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Build Version: 2.0.1 - 2026-04-23 09:20
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  History, 
  Plus, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { cn } from './lib/utils';
import { Product, Transaction, Customer, Category } from './types';

// Initial Mock Data or LocalStorage
const STORAGE_KEY = 'atif_traders_data';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'customers' | 'history'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load Data
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const { products, transactions, customers } = JSON.parse(savedData);
      setProducts(products || []);
      setTransactions(transactions || []);
      setCustomers(customers || []);
    } else {
      // Seed initial data if empty
      const initialProducts: Product[] = [
        { id: '1', name: 'DAP Fertilizer', category: 'Fertilizer', stock: 50, unit: 'Bag', purchasePrice: 12000, salePrice: 13500 },
        { id: '2', name: 'Urea Fertilizer', category: 'Fertilizer', stock: 100, unit: 'Bag', purchasePrice: 4500, salePrice: 5200 },
        { id: '3', name: 'Wheat Seed (Faisalabad-08)', category: 'Seed', stock: 200, unit: 'Kg', purchasePrice: 150, salePrice: 180 },
      ];
      setProducts(initialProducts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products: initialProducts, transactions: [], customers: [] }));
    }
  }, []);

  // Save Data
  useEffect(() => {
    if (products.length > 0 || transactions.length > 0 || customers.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, transactions, customers }));
    }
  }, [products, transactions, customers]);

  // Calculations
  const stats = useMemo(() => {
    const totalSales = transactions.filter(t => t.type === 'Sale').reduce((acc, t) => acc + t.total, 0);
    const totalCredit = transactions.filter(t => t.type === 'Sale' && t.isCredit).reduce((acc, t) => acc + (t.total - (t.paidAmount || 0)), 0);
    const lowStockItems = products.filter(p => p.stock < 10).length;
    const inventoryValue = products.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0);

    return { totalSales, totalCredit, lowStockItems, inventoryValue };
  }, [products, transactions]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    return last7Days.map(date => {
      const daySales = transactions
        .filter(t => t.type === 'Sale' && t.date.startsWith(date))
        .reduce((acc, t) => acc + t.total, 0);
      return { date: format(new Date(date), 'MMM dd'), sales: daySales };
    });
  }, [transactions]);

  // Handlers
  const addSale = (sale: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...sale, id: Math.random().toString(36).substr(2, 9) };
    setTransactions([newTransaction, ...transactions]);
    
    // Update Stock
    setProducts(prev => prev.map(p => 
      p.id === sale.productId ? { ...p, stock: p.stock - sale.quantity } : p
    ));

    // Update Customer Balance
    if (sale.isCredit && sale.customerName) {
      const existingCustomer = customers.find(c => c.name === sale.customerName);
      if (existingCustomer) {
        setCustomers(prev => prev.map(c => 
          c.id === existingCustomer.id ? { ...c, balance: c.balance + (sale.total - (sale.paidAmount || 0)) } : c
        ));
      } else {
        const newCustomer: Customer = {
          id: Math.random().toString(36).substr(2, 9),
          name: sale.customerName,
          phone: '',
          balance: sale.total - (sale.paidAmount || 0)
        };
        setCustomers([...customers, newCustomer]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row" dir="rtl">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-l border-slate-200 flex flex-col sticky top-0 h-auto md:h-screen z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
            <Package className="w-8 h-8" />
            عاطف ٹریڈرز
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wider uppercase">Atif Traders Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="ڈیش بورڈ" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Package />} 
            label="اسٹاک / انوینٹری" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
          />
          <NavItem 
            icon={<ShoppingCart />} 
            label="نئی فروخت (Sale)" 
            active={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
          />
          <NavItem 
            icon={<Users />} 
            label="گاہکوں کا کھاتہ" 
            active={activeTab === 'customers'} 
            onClick={() => setActiveTab('customers')} 
          />
          <NavItem 
            icon={<History />} 
            label="تاریخچہ (History)" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-xs text-emerald-600 font-bold mb-1">مدد چاہیے؟</p>
            <p className="text-[10px] text-emerald-500 leading-relaxed">کسی بھی مسئلے کی صورت میں ہم سے رابطہ کریں۔</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'خوش آمدید!'}
              {activeTab === 'inventory' && 'اسٹاک مینجمنٹ'}
              {activeTab === 'sales' && 'نئی فروخت کا اندراج'}
              {activeTab === 'customers' && 'گاہکوں کا ریکارڈ'}
              {activeTab === 'history' && 'لین دین کی تفصیلات'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">آج کی تاریخ: {format(new Date(), 'dd MMMM, yyyy')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="تلاش کریں..." 
                className="bg-white border border-slate-200 rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView stats={stats} chartData={chartData} products={products} />
            )}
            {activeTab === 'inventory' && (
              <InventoryView products={products} setProducts={setProducts} />
            )}
            {activeTab === 'sales' && (
              <SalesView products={products} addSale={addSale} />
            )}
            {activeTab === 'customers' && (
              <CustomersView customers={customers} />
            )}
            {activeTab === 'history' && (
              <HistoryView transactions={transactions} products={products} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Views ---

function DashboardView({ stats, chartData, products }: { stats: any, chartData: any, products: Product[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="کل فروخت" 
          value={`Rs. ${stats.totalSales.toLocaleString()}`} 
          icon={<TrendingUp className="text-emerald-600" />} 
          trend="+12%" 
          color="emerald"
        />
        <StatCard 
          title="کل ادھار (Credit)" 
          value={`Rs. ${stats.totalCredit.toLocaleString()}`} 
          icon={<ArrowUpRight className="text-rose-600" />} 
          trend="+5%" 
          color="rose"
        />
        <StatCard 
          title="کم اسٹاک آئٹمز" 
          value={stats.lowStockItems} 
          icon={<AlertTriangle className="text-amber-600" />} 
          trend="فوری توجہ" 
          color="amber"
        />
        <StatCard 
          title="انوینٹری کی مالیت" 
          value={`Rs. ${stats.inventoryValue.toLocaleString()}`} 
          icon={<Package className="text-blue-600" />} 
          trend="موجودہ" 
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">فروخت کا گراف (آخری 7 دن)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">کم اسٹاک الرٹ</h3>
          <div className="space-y-4">
            {products.filter(p => p.stock < 10).length > 0 ? (
              products.filter(p => p.stock < 10).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                    <p className="text-xs text-amber-600">باقی: {p.stock} {p.unit}</p>
                  </div>
                  <button className="text-xs bg-amber-600 text-white px-3 py-1 rounded-full font-medium">آرڈر کریں</button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">تمام اسٹاک مکمل ہے</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryView({ products, setProducts }: { products: Product[], setProducts: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    category: 'Fertilizer',
    stock: 0,
    unit: 'Bag',
    purchasePrice: 0,
    salePrice: 0
  });

  const handleAdd = () => {
    if (!newProduct.name) return;
    setProducts([...products, { ...newProduct, id: Math.random().toString(36).substr(2, 9) }]);
    setIsAdding(false);
    setNewProduct({ name: '', category: 'Fertilizer', stock: 0, unit: 'Bag', purchasePrice: 0, salePrice: 0 });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">موجودہ اسٹاک</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          نیا آئٹم شامل کریں
        </button>
      </div>

      {isAdding && (
        <div className="p-6 bg-emerald-50/50 border-b border-emerald-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input 
            type="text" placeholder="نام" 
            className="bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
          />
          <select 
            className="bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm outline-none"
            value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
          >
            <option value="Fertilizer">کھاد</option>
            <option value="Seed">بیج</option>
            <option value="Feed">کھل / فیڈ</option>
            <option value="Other">دیگر</option>
          </select>
          <input 
            type="number" placeholder="اسٹاک" 
            className="bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm outline-none"
            value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
          />
          <input 
            type="number" placeholder="خرید قیمت" 
            className="bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm outline-none"
            value={newProduct.purchasePrice} onChange={e => setNewProduct({...newProduct, purchasePrice: Number(e.target.value)})}
          />
          <input 
            type="number" placeholder="فروخت قیمت" 
            className="bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm outline-none"
            value={newProduct.salePrice} onChange={e => setNewProduct({...newProduct, salePrice: Number(e.target.value)})}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 bg-emerald-600 text-white rounded-xl py-2 font-bold text-sm">محفوظ کریں</button>
            <button onClick={() => setIsAdding(false)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><XCircle /></button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">نام</th>
              <th className="px-6 py-4 font-bold">کیٹیگری</th>
              <th className="px-6 py-4 font-bold">اسٹاک</th>
              <th className="px-6 py-4 font-bold">خرید قیمت</th>
              <th className="px-6 py-4 font-bold">فروخت قیمت</th>
              <th className="px-6 py-4 font-bold">ایکشن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold",
                    p.category === 'Fertilizer' ? "bg-emerald-100 text-emerald-700" :
                    p.category === 'Seed' ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {p.category === 'Fertilizer' ? 'کھاد' : p.category === 'Seed' ? 'بیج' : 'فیڈ'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("font-mono font-bold", p.stock < 10 ? "text-rose-600" : "text-slate-600")}>
                    {p.stock} {p.unit}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-slate-500">Rs. {p.purchasePrice}</td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-600">Rs. {p.salePrice}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit className="w-4 h-4" /></button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesView({ products, addSale }: { products: Product[], addSale: any }) {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const product = products.find(p => p.id === selectedProduct);
  const total = product ? product.salePrice * quantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;
    
    addSale({
      type: 'Sale',
      productId: selectedProduct,
      quantity,
      price: product!.salePrice,
      total,
      date: new Date().toISOString(),
      customerName,
      isCredit,
      paidAmount: isCredit ? paidAmount : total
    });

    // Reset
    setSelectedProduct('');
    setQuantity(1);
    setCustomerName('');
    setIsCredit(false);
    setPaidAmount(0);
    alert('فروخت کا اندراج کامیابی سے ہو گیا!');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">آئٹم منتخب کریں</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
              required
            >
              <option value="">منتخب کریں...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (باقی: {p.stock})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">مقدار (Quantity)</label>
            <input 
              type="number" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none"
              value={quantity} onChange={e => setQuantity(Number(e.target.value))}
              min="1"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">گاہک کا نام (اختیاری)</label>
          <input 
            type="text" 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none"
            placeholder="نام درج کریں..."
            value={customerName} onChange={e => setCustomerName(e.target.value)}
          />
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">کل رقم:</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">Rs. {total.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox" id="credit" 
              className="w-5 h-5 accent-emerald-600"
              checked={isCredit} onChange={e => setIsCredit(e.target.checked)}
            />
            <label htmlFor="credit" className="text-sm font-bold text-slate-700 cursor-pointer">ادھار (Credit Sale)</label>
          </div>

          {isCredit && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-2 pt-2 border-t border-slate-200"
            >
              <label className="text-xs font-bold text-slate-500 uppercase">وصول شدہ رقم</label>
              <input 
                type="number" 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none"
                value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))}
              />
              <p className="text-xs text-rose-500 font-bold">باقی ادھار: Rs. {(total - paidAmount).toLocaleString()}</p>
            </motion.div>
          )}
        </div>

        <button 
          type="submit"
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-6 h-6" />
          فروخت مکمل کریں
        </button>
      </form>
    </div>
  );
}

function CustomersView({ customers }: { customers: Customer[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">گاہکوں کا لیجر (Ledger)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">نام</th>
              <th className="px-6 py-4 font-bold">فون نمبر</th>
              <th className="px-6 py-4 font-bold">موجودہ بیلنس</th>
              <th className="px-6 py-4 font-bold">ایکشن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                <td className="px-6 py-4 text-slate-500 font-mono">{c.phone || '---'}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "font-mono font-bold px-3 py-1 rounded-full text-xs",
                    c.balance > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {c.balance > 0 ? `Rs. ${c.balance} (ادھار)` : `Rs. ${Math.abs(c.balance)} (صاف)`}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-emerald-600 text-xs font-bold hover:underline">تفصیل دیکھیں</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryView({ transactions, products }: { transactions: Transaction[], products: Product[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">لین دین کی تاریخچہ</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">تاریخ</th>
              <th className="px-6 py-4 font-bold">آئٹم</th>
              <th className="px-6 py-4 font-bold">مقدار</th>
              <th className="px-6 py-4 font-bold">کل رقم</th>
              <th className="px-6 py-4 font-bold">گاہک</th>
              <th className="px-6 py-4 font-bold">اسٹیٹس</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(t => {
              const p = products.find(prod => prod.id === t.productId);
              return (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-500">{format(new Date(t.date), 'dd MMM, hh:mm a')}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{p?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 font-mono">{t.quantity}</td>
                  <td className="px-6 py-4 font-mono font-bold">Rs. {t.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">{t.customerName || 'عام گاہک'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold",
                      t.isCredit ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {t.isCredit ? 'ادھار' : 'نقد'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Components ---

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
          : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
      )}
    >
      <span className={cn("w-5 h-5", active ? "text-white" : "text-slate-400 group-hover:text-emerald-600")}>
        {icon}
      </span>
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: string | number, icon: React.ReactNode, trend: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", 
          color === 'emerald' ? "bg-emerald-50" : 
          color === 'rose' ? "bg-rose-50" : 
          color === 'amber' ? "bg-amber-50" : "bg-blue-50"
        )}>
          {icon}
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full",
          color === 'emerald' ? "bg-emerald-100 text-emerald-700" : 
          color === 'rose' ? "bg-rose-100 text-rose-700" : 
          color === 'amber' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
        )}>
          {trend}
        </span>
      </div>
      <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">{title}</p>
      <h4 className="text-xl font-black text-slate-800 font-mono">{value}</h4>
    </div>
  );
}
