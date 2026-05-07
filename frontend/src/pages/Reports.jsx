import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingBag, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';

const PIE_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function Reports() {
  const [timeRange, setTimeRange] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real data states
  const [stats, setStats] = useState(null);
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes, trendsRes, dailyRes, monthlyRes] = await Promise.allSettled([
        api.get('reports/dashboard/stats/'),
        api.get('reports/trends/weekly/'),
        api.get('reports/daily/'),
        api.get('reports/monthly/'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (trendsRes.status === 'fulfilled') setWeeklyTrends(trendsRes.value.data?.trends || []);
      if (dailyRes.status === 'fulfilled') setDailyReport(dailyRes.value.data);
      if (monthlyRes.status === 'fulfilled') setMonthlyReport(monthlyRes.value.data);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const kpiCards = [
    {
      title: 'Monthly Revenue',
      value: stats ? `$${parseFloat(stats.monthly_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      color: 'emerald',
      sub: `${stats?.monthly_order_count ?? '—'} orders this month`,
    },
    {
      title: 'Total Orders Today',
      value: stats?.total_orders_today ?? '—',
      icon: <ShoppingBag className="w-6 h-6 text-indigo-400" />,
      color: 'indigo',
      sub: `${stats?.meals_served_today ?? 0} served`,
    },
    {
      title: 'Pending Orders',
      value: stats?.pending_orders ?? '—',
      icon: <TrendingUp className="w-6 h-6 text-amber-400" />,
      color: 'amber',
      sub: 'Awaiting processing',
    },
  ];

  // Build top items from daily report
  const topItems = dailyReport?.items?.slice(0, 5) || [];

  // Pie data from daily report
  const pieData = dailyReport?.items?.slice(0, 6).map(item => ({
    name: item.menu_item__food_name || 'Unknown',
    value: item.total_quantity,
  })) || [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Loading reports...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Canteen performance breakdown — {stats ? `as of today` : 'loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 hidden sm:flex">
            {['Daily', 'Weekly', 'Monthly'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range.toLowerCase())}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  timeRange === range.toLowerCase() ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${kpi.color}-500/10 border border-${kpi.color}-500/20`}>
                {kpi.icon}
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" /> Live
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-100 mb-1">{kpi.value}</p>
            <p className="text-sm text-slate-500 font-medium">{kpi.title}</p>
            <p className="text-xs text-slate-600 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Weekly Order &amp; Revenue Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 7 days</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-72 w-full">
            {weeklyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrends} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  <Line yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm">No trend data available yet.</div>
            )}
          </div>
        </div>

        {/* Today's Top Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-slate-100">Today's Top Items</h2>
            {dailyReport?.date && <span className="text-xs text-slate-500">{dailyReport.date}</span>}
          </div>
          {topItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">No orders today yet.</div>
          ) : (
            <div className="flex-1 space-y-4">
              {topItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700 group-hover:border-indigo-500/50 transition-colors shrink-0">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 truncate max-w-[160px]">{item.menu_item__food_name}</p>
                      <p className="text-xs text-slate-500">{item.total_quantity} orders</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400 shrink-0">
                    ${parseFloat(item.total_revenue || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Employee Spending */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-slate-100">Monthly Employee Spending</h2>
            <span className="text-xs text-slate-500">{monthlyReport?.month}</span>
          </div>
          {monthlyReport?.employees?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="pb-3 text-left">Employee</th>
                    <th className="pb-3 text-left hidden sm:table-cell">Department</th>
                    <th className="pb-3 text-right">Orders</th>
                    <th className="pb-3 text-right">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {monthlyReport.employees.slice(0, 6).map((emp, i) => (
                    <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 font-medium text-slate-200">{emp.employee__name || '—'}</td>
                      <td className="py-3 text-slate-500 hidden sm:table-cell truncate max-w-[120px]">{emp.employee__department__department_name || '—'}</td>
                      <td className="py-3 text-right text-slate-300">{emp.total_orders}</td>
                      <td className="py-3 text-right font-semibold text-emerald-400">${parseFloat(emp.total_amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No employee data for this month.</div>
          )}
        </div>

        {/* Food Consumption Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-100 mb-6">Today's Order Distribution</h2>
          {pieData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(val) => [`${val} orders`, '']}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-600 text-sm">No order data today.</div>
          )}
        </div>
      </div>
    </div>
  );
}
