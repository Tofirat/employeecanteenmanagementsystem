import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Receipt, FileDown } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pending action state for Confirmation UX
  const [pendingAction, setPendingAction] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    fetchOrders();
    // For "Real-time updates", we would typically use WebSockets. 
    // Here we simulate it by polling every 30 seconds if admin
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('orders/');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const confirmStatusUpdate = (orderId, newStatus) => {
    setPendingAction({ orderId, newStatus });
  };

  const executeStatusUpdate = async () => {
    if (!pendingAction) return;
    const { orderId, newStatus } = pendingAction;
    try {
      await api.patch(`orders/${orderId}/update-status/`, { status: newStatus });
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus, status_display: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) } : order
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Could not update order status.');
    } finally {
      setPendingAction(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'served': 
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
      case 'cancelled': 
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      case 'preparing': 
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing</span>;
      default: 
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter.toLowerCase();
    const searchString = `${order.id} ${order.employee_name} ${order.items.map(i=>i.food_name).join(' ')}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
     return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative border-gray-900 border">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{isAdmin ? 'Order Management' : 'My Orders History'}</h1>
          <p className="text-sm text-slate-400 mt-1">{isAdmin ? 'Track, filter, and process live canteen orders.' : 'Review your past and current food orders.'}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex bg-slate-800 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
          {['All', 'Pending', 'Preparing', 'Completed', 'Cancelled'].map(status => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                statusFilter === status ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search Order ID, employee, or item..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
             <AlertCircle className="w-10 h-10 text-slate-600 mb-3" />
             <p className="text-slate-300 font-medium">No orders found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Order Details</th>
                  {isAdmin && <th className="px-6 py-4">Customer</th>}
                  <th className="px-6 py-4">Items Summary</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/20 transition-colors">
                    
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-200">#{order.id.toString().padStart(4, '0')}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(order.order_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-200">{order.employee_name || 'Guest'}</p>
                        <p className="text-xs text-slate-500">{order.department_name || 'Unknown Dept'}</p>
                      </td>
                    )}

                    <td className="px-6 py-4 max-w-[200px] sm:max-w-xs truncate">
                      <p className="text-slate-300 truncate">
                        {order.items?.map(i => `${i.quantity}x ${i.food_name}`).join(', ') || 'No items'}
                      </p>
                      {order.notes && <p className="text-xs text-amber-500/80 mt-0.5 truncate">Note: {order.notes}</p>}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-slate-200">
                      ${parseFloat(order.total_amount || 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>

                    {isAdmin ? (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a 
                            href={`${api.defaults.baseURL}payments/${order.payment_id || order.payments?.[0]?.id}/invoice/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Download Invoice"
                          >
                            <Receipt className="w-4 h-4" />
                          </a>
                          {order.status !== 'served' && order.status !== 'cancelled' && (
                            <>
                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => confirmStatusUpdate(order.id, 'preparing')}
                                  className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Accept
                                </button>
                              )}
                              {order.status === 'preparing' && (
                                <button 
                                  onClick={() => confirmStatusUpdate(order.id, 'served')}
                                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Mark Ready
                                </button>
                              )}
                              <button 
                                onClick={() => confirmStatusUpdate(order.id, 'cancelled')}
                                className="px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td className="px-6 py-4 text-right">
                         <a 
                            href={`${api.defaults.baseURL}payments/${order.payment_id || order.payments?.[0]?.id}/invoice/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                          >
                            <FileDown className="w-3.5 h-3.5" /> Invoice
                          </a>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setPendingAction(null)}></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-2">Confirm Action</h3>
              <p className="text-sm text-slate-400">
                Are you sure you want to transition Order #{pendingAction.orderId.toString().padStart(4, '0')} to <span className="font-semibold text-slate-300 capitalize">"{pendingAction.newStatus}"</span>?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setPendingAction(null)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={executeStatusUpdate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
