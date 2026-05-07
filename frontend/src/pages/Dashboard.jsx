import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  Users, Utensils, ClipboardList, TrendingUp, DollarSign, Plus, Settings,
  ArrowRight, Activity, ShoppingBag, CreditCard, Clock, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, ShoppingCart, FileText, Trash2,
  Eye, X, Receipt, BadgeCheck, XCircle, Loader2, CalendarDays
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

// ============================================================================
// MAIN DASHBOARD EXPORT  (Admin or Employee based on role)
// ============================================================================
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [orderTrendsData, setOrderTrendsData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([
    { id: '1023', user: 'Sarah Jenkins', items: '2x Grilled Chicken', status: 'pending', time: '10 mins ago', amount: 24.50 },
    { id: '1022', user: 'Michael Chen', items: '1x Vegan Salad', status: 'served', time: '1 hour ago', amount: 12.00 },
    { id: '1021', user: 'Emily Davis', items: '3x Beef Tacos, 1x Coke', status: 'preparing', time: '2 hours ago', amount: 35.75 },
    { id: '1020', user: 'Alex Wong', items: '1x Margherita Pizza', status: 'served', time: '3 hours ago', amount: 18.00 },
  ]);

  // Employee state
  const [empStats, setEmpStats] = useState({ walletBalance: 0, totalSpent: 0, ordersThisMonth: 0, pendingOrders: 0 });
  const [empMenu, setEmpMenu] = useState([]);
  const [empOrders, setEmpOrders] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      fetchAdminData();
    } else {
      fetchEmployeeData();
    }
  }, [user]);

  const fetchEmployeeData = async () => {
    try {
      const [walletRes, ordersRes, menuRes] = await Promise.allSettled([
        api.get('employees/me/'),
        api.get('orders/?ordering=-order_date'),
        api.get('menu/')
      ]);
      let wBalance = 0;
      if (walletRes.status === 'fulfilled' && walletRes.value.data) {
        wBalance = parseFloat(walletRes.value.data.wallet_balance || 0);
      }
      let tSpent = 0, oThisMonth = 0, pOrders = 0, recent = [];
      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data?.results || ordersRes.value.data || [];
        recent = orders.slice(0, 8);
        const now = new Date();
        orders.forEach(o => {
          const d = new Date(o.order_date);
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            oThisMonth += 1;
            tSpent += parseFloat(o.total_amount || 0);
          }
          if (o.status === 'pending' || o.status === 'preparing') pOrders += 1;
        });
      }
      if (menuRes.status === 'fulfilled') {
        const mItems = menuRes.value.data?.results || menuRes.value.data || [];
        setEmpMenu(mItems.filter(i => i.is_available !== false).slice(0, 8));
      }
      setEmpStats({ walletBalance: wBalance, totalSpent: tSpent, ordersThisMonth: oThisMonth, pendingOrders: pOrders });
      setEmpOrders(recent);
    } catch (err) {
      console.error('Failed to load employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [statsRes, trendsRes, ordersRes] = await Promise.allSettled([
        api.get('reports/dashboard/stats/'),
        api.get('reports/trends/weekly/'),
        api.get('orders/?ordering=-order_date'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (trendsRes.status === 'fulfilled') {
        const trends = trendsRes.value.data?.trends || [];
        setRevenueData(trends.map(t => ({ name: t.day, revenue: t.revenue })));
        setOrderTrendsData(trends.map(t => ({ time: t.day, orders: t.orders })));
      }
      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data?.results || ordersRes.value.data || [];
        if (orders.length > 0) {
          setRecentOrders(orders.slice(0, 4).map(o => ({
            id: o.id,
            user: o.employee_name || 'Unknown',
            items: o.items?.map(i => `${i.quantity}x ${i.food_name}`).join(', ') || 'No items',
            status: o.status,
            time: new Date(o.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amount: parseFloat(o.total_amount || 0),
          })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-400 mr-3" />
        <span className="text-slate-400 font-medium">Loading dashboard...</span>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  if (isAdmin) {
    return <AdminDashboardView stats={stats} recentOrders={recentOrders} revenueData={revenueData} orderTrendsData={orderTrendsData} user={user} />;
  }

  return <EmployeeDashboardView empStats={empStats} empMenu={empMenu} empOrders={empOrders} user={user} onRefreshOrders={fetchEmployeeData} />;
}

// ============================================================================
// ADMIN DASHBOARD VIEW
// ============================================================================
function AdminDashboardView({ stats, recentOrders, revenueData, orderTrendsData, user }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'served': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'preparing': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'pending': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Welcome back, {user?.first_name}! 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Here's what's happening in the canteen today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/orders" className="px-4 py-2 text-sm font-medium border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg transition">
            View All Orders
          </Link>
          <Link to="/admin/menu" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Update Menu
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard title="Total Orders Today" value={stats?.total_orders_today || 142} trend="+12% from yesterday" trendUp={true} icon={<ShoppingBag className="w-6 h-6 text-indigo-400" />} bgColor="bg-indigo-500/10" />
        <AdminStatCard title="Revenue Today" value={`$${stats?.monthly_revenue ? (stats.monthly_revenue / 30).toFixed(2) : '1,245.00'}`} trend="+5.4% from yesterday" trendUp={true} icon={<DollarSign className="w-6 h-6 text-emerald-400" />} bgColor="bg-emerald-500/10" />
        <AdminStatCard title="Pending Orders" value={stats?.pending_orders || 18} trend="-2 since last hour" trendUp={false} icon={<ClipboardList className="w-6 h-6 text-amber-400" />} bgColor="bg-amber-500/10" />
        <AdminStatCard title="Active Employees" value={stats?.total_employees || 89} trend="Stable" trendUp={true} icon={<Users className="w-6 h-6 text-pink-400" />} bgColor="bg-pink-500/10" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-slate-100">Weekly Revenue Overview</h2>
            <select className="bg-slate-800 border-none text-xs text-slate-300 rounded-md py-1 px-2 focus:ring-0">
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-base font-semibold text-slate-100 mb-6">Peak Order Hours</h2>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTrendsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="orders" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-100">Live Orders</h2>
            <Link to="/admin/orders" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Order ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-medium text-slate-300">#{order.id}</td>
                    <td className="p-4 text-slate-200">{order.user} <span className="block text-xs text-slate-500">{order.time}</span></td>
                    <td className="p-4 text-slate-400 truncate max-w-[150px]">{order.items}</td>
                    <td className="p-4 font-medium text-slate-200 text-right">${order.amount.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <span className={`${getStatusColor(order.status)} px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase inline-flex`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-slate-100 mb-6">Recent Activity</h2>
          <div className="space-y-5">
            {[
              { title: 'New Order #1023', time: '10 mins ago', icon: <ShoppingBag className="w-4 h-4 text-indigo-400" />, bg: 'bg-indigo-500/10' },
              { title: 'Inventory Low: Chicken', time: '1 hour ago', icon: <TrendingUp className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-500/10' },
              { title: 'Menu Updated', time: '3 hours ago', icon: <Utensils className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/10' },
              { title: 'New Employee Registered', time: '5 hours ago', icon: <Users className="w-4 h-4 text-pink-400" />, bg: 'bg-pink-500/10' },
            ].map((notice, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notice.bg}`}>
                  {notice.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{notice.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{notice.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ title, value, trend, trendUp, icon, bgColor }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {trendUp ? '↑' : '↓'} {trend.split(' ')[0]}
        </span>
        <span className="text-xs text-slate-500">{trend.split(' ').slice(1).join(' ')}</span>
      </div>
    </div>
  );
}

// ============================================================================
// EMPLOYEE DASHBOARD VIEW  —  Main Container
// ============================================================================
function EmployeeDashboardView({ empStats, empMenu, empOrders, user, onRefreshOrders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    setDeletingId(orderId);
    try {
      await api.delete(`orders/${orderId}/`);
      onRefreshOrders();
    } catch (err) {
      alert('Could not delete this order. It may already be processed.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ── Welcome Banner ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {getGreeting()}, <span className="text-indigo-400">{user?.first_name || 'Employee'}!</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's your canteen overview for today.</p>
        </div>
        <button
          onClick={() => navigate('/order')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          Order Now
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EmpStatCard
          title="Orders This Month"
          value={empStats.ordersThisMonth}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="indigo"
          trend="+12%"
          trendUp={true}
        />
        <EmpStatCard
          title="Total Spending"
          value={`$${(empStats.totalSpent || 0).toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
          trend="+8%"
          trendUp={true}
        />
        <EmpStatCard
          title="Pending Orders"
          value={empStats.pendingOrders}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          trend={`${empStats.pendingOrders} active`}
          trendUp={null}
        />
        <EmpStatCard
          title="Payment Status"
          value={empStats.walletBalance >= 0 ? 'Paid' : 'Due'}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="pink"
          trend="Current month"
          trendUp={true}
        />
      </div>

      {/* ── Today's Menu Slider ── */}
      <MenuSlider menu={empMenu} />

      {/* ── Recent Orders + Billing ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentOrdersTable
            orders={empOrders}
            onViewInvoice={handleViewInvoice}
            onDelete={handleDeleteOrder}
            deletingId={deletingId}
          />
        </div>
        <div>
          <BillingCard stats={empStats} />
        </div>
      </div>

      {/* ── Invoice Modal ── */}
      {showInvoice && selectedOrder && (
        <InvoiceModal order={selectedOrder} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
}

// ── Helper ──
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// ============================================================================
// EMPLOYEE STAT CARD
// ============================================================================
const colorMap = {
  indigo: { card: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/30', icon: 'bg-indigo-500/20 text-indigo-300', val: 'text-indigo-100' },
  emerald: { card: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/30', icon: 'bg-emerald-500/20 text-emerald-300', val: 'text-emerald-100' },
  amber: { card: 'from-amber-600/20 to-amber-600/5 border-amber-500/30', icon: 'bg-amber-500/20 text-amber-300', val: 'text-amber-100' },
  pink: { card: 'from-pink-600/20 to-pink-600/5 border-pink-500/30', icon: 'bg-pink-500/20 text-pink-300', val: 'text-pink-100' },
};

function EmpStatCard({ title, value, icon, color, trend, trendUp }) {
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`bg-gradient-to-br ${c.card} border rounded-2xl p-5 flex flex-col justify-between gap-4 hover:scale-[1.02] transition-transform`}>
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        {trendUp !== null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-500/15 text-emerald-400' : trendUp === false ? 'bg-rose-500/15 text-rose-400' : 'bg-slate-500/15 text-slate-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium mb-1">{title}</p>
        <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// TODAY'S MENU — IMAGE SLIDER  (admin adds images manually)
// ============================================================================
function MenuSlider({ menu }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  // Auto-advance slider
  useEffect(() => {
    if (menu.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrent(prev => (prev + 1) % menu.length);
      }, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [menu.length]);

  const prev = () => {
    clearInterval(intervalRef.current);
    setCurrent(prev => (prev - 1 + menu.length) % menu.length);
  };
  const next = () => {
    clearInterval(intervalRef.current);
    setCurrent(prev => (prev + 1) % menu.length);
  };

  const navigate = useNavigate();

  if (menu.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-slate-300 font-semibold">No menu items today</h3>
        <p className="text-slate-500 text-sm mt-1">Check back later — the admin will update the menu soon.</p>
      </div>
    );
  }

  const item = menu[current];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Today's Menu</h2>
          <p className="text-slate-400 text-sm">Available meals — click Order Now to place an order</p>
        </div>
        <Link to="/menu" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Featured Slider ── */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 group" style={{ minHeight: '280px' }}>
        {/* Background Image or Gradient Placeholder */}
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            key={item.id}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-slate-900 flex items-center justify-center">
            <Utensils className="w-24 h-24 text-slate-700/60" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full p-6" style={{ minHeight: '280px' }}>
          <div className="flex items-end justify-between">
            <div>
              {item.category && (
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full mb-3">
                  {item.category}
                </span>
              )}
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">{item.name}</h3>
              <p className="text-slate-300 text-sm max-w-md line-clamp-2">{item.description || 'Fresh and delicious meal made daily.'}</p>
              <p className="text-indigo-300 text-xl font-bold mt-2">
                {item.price ? `$${parseFloat(item.price).toFixed(2)}` : 'See menu for price'}
              </p>
            </div>
            <button
              onClick={() => navigate('/order')}
              className="ml-4 shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/40 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Order Now
            </button>
          </div>

          {/* Slider Dots */}
          {menu.length > 1 && (
            <div className="flex items-center gap-2 mt-5">
              {menu.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-indigo-400' : 'w-2 bg-slate-600'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Prev / Next Arrows */}
        {menu.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-800 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-800 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* ── Horizontal Menu Cards (All Items) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {menu.map((item, idx) => (
          <MenuItemCard key={item.id} item={item} isActive={idx === current} onClick={() => setCurrent(idx)} />
        ))}
      </div>
    </div>
  );
}

function MenuItemCard({ item, isActive, onClick }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border cursor-pointer overflow-hidden transition-all hover:scale-[1.02] ${isActive ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-700/60 bg-slate-900 hover:border-slate-600'}`}
    >
      {/* Item Image */}
      <div className="h-28 bg-slate-800 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Utensils className="w-8 h-8 text-slate-600" />
        )}
        {item.category && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-indigo-600/90 text-white px-2 py-0.5 rounded-md">
            {item.category}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-white text-sm font-semibold truncate">{item.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-indigo-300 text-sm font-bold">
            {item.price ? `$${parseFloat(item.price).toFixed(2)}` : '--'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/order'); }}
            className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600/80 hover:bg-indigo-600 text-white px-2 py-1 rounded-md transition"
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RECENT ORDERS TABLE
// ============================================================================
function RecentOrdersTable({ orders, onViewInvoice, onDelete, deletingId }) {
  const statusBadge = (status) => {
    const map = {
      served: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      preparing: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
      cancelled: 'bg-red-500/10 text-red-400 border border-red-500/30',
    };
    return map[status?.toLowerCase()] || 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white">My Recent Orders</h2>
          <p className="text-slate-400 text-xs mt-0.5">Click details to view invoice or delete an order</p>
        </div>
        <Link to="/orders" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium hidden sm:table-cell">Items</th>
              <th className="px-5 py-3 font-medium hidden md:table-cell">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center">
                  <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">No orders yet</p>
                  <p className="text-slate-500 text-sm mt-1">Place your first order from today's menu!</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-slate-200">
                      #ORD-{String(order.id).padStart(4, '0')}
                    </p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <p className="text-sm text-slate-400 max-w-[180px] truncate">
                      {order.items?.map(i => i.food_name || i).join(', ') || 'Various Items'}
                    </p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-600" />
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A'}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusBadge(order.status)}`}>
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-bold text-slate-200">
                      ${parseFloat(order.total_amount || order.amount || 0).toFixed(2)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewInvoice(order)}
                        title="View Invoice"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(order.status === 'pending' || !order.status) && (
                        <button
                          onClick={() => onDelete(order.id)}
                          title="Delete Order"
                          disabled={deletingId === order.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                        >
                          {deletingId === order.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// BILLING CARD
// ============================================================================
function BillingCard({ stats }) {
  const isPaid = stats.walletBalance >= 0;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-full">
      <h2 className="text-base font-bold text-white mb-1">Payment & Billing</h2>
      <p className="text-slate-400 text-xs mb-6">Monthly billing overview</p>

      {/* Bill Summary */}
      <div className="space-y-3 flex-1">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Current Month Bill</p>
              <p className="text-lg font-bold text-white">${(stats.totalSpent || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Billing Period: This Month</p>
            <p>{stats.ordersThisMonth} order(s) placed</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPaid ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
              {isPaid
                ? <BadgeCheck className="w-4 h-4 text-emerald-400" />
                : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>
            <div>
              <p className="text-xs text-slate-400">Payment Status</p>
              <p className={`text-lg font-bold ${isPaid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPaid ? 'Paid' : 'Unpaid'}
              </p>
            </div>
          </div>
          {!isPaid && (
            <p className="text-xs text-rose-400/70 mt-3">⚠ You have an outstanding balance.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-5">
        <Link
          to="/payments"
          className="w-full text-center bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
        >
          View Details
        </Link>
        <button className="w-full text-center border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition">
          Download Invoice
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// INVOICE MODAL
// ============================================================================
function InvoiceModal({ order, onClose }) {
  const items = order.items || [];
  const total = parseFloat(order.total_amount || order.amount || 0);
  const orderId = String(order.id).padStart(4, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-6">
        {/* Invoice Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Order Invoice</h3>
              <p className="text-xs text-slate-400">#{orderId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Order Date</p>
              <p className="text-slate-200 font-medium mt-0.5">
                {order.order_date ? new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Status</p>
              <p className={`font-semibold mt-0.5 capitalize ${order.status === 'served' ? 'text-emerald-400' : order.status === 'pending' ? 'text-amber-400' : 'text-blue-400'}`}>
                {order.status || 'pending'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800" />

          {/* Items */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Items Ordered</p>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-800 text-xs text-slate-400 flex items-center justify-center font-bold">
                        {item.quantity || 1}
                      </span>
                      <span className="text-slate-200">{item.food_name || item}</span>
                    </div>
                    <span className="text-slate-300 font-medium">
                      {item.price ? `$${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No item details available.</p>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
            <span className="text-slate-400 font-medium">Total Amount</span>
            <span className="text-xl font-extrabold text-indigo-300">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
          >
            Close Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
