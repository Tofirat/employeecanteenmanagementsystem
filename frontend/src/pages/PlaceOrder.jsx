import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { ShoppingCart, Plus, Minus, Trash2, Loader2, CheckCircle2, Search, ShoppingBag, Utensils, CreditCard, Wallet, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PlaceOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [cart, setCart] = useState({}); // { menuItemId: quantity }
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet' or 'sslcommerz'

  const categories = ['All', 'Breakfast', 'Lunch', 'Snacks'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, empRes] = await Promise.allSettled([
        api.get('menu/'),
        api.get('employees/me/')
      ]);

      if (menuRes.status === 'fulfilled') {
        const data = menuRes.value.data?.results || menuRes.value.data;
        setMenuItems((Array.isArray(data) ? data : []).filter(item => item.is_available !== false));
      }

      if (empRes.status === 'fulfilled') {
        setWalletBalance(parseFloat(empRes.value.data.wallet_balance || 0));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeLabel = (code) => {
    const map = { BB: 'Breakfast', LB: 'Lunch', SB: 'Snacks' };
    return map[code] || code;
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.food_name.toLowerCase().includes(searchTerm.toLowerCase());
    const label = getMealTypeLabel(item.meal_type);
    const matchesCat = categoryFilter === 'All' || label === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const addToCart = (itemId) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[itemId] > 1) updated[itemId] -= 1;
      else delete updated[itemId];
      return updated;
    });
  };

  const clearFromCart = (itemId) => {
    setCart(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const item = menuItems.find(m => m.id === parseInt(id));
    return { ...item, quantity: qty };
  }).filter(Boolean);

  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;
    
    if (walletBalance < cartTotal) {
      setError(`Insufficient wallet balance. You need $${(cartTotal - walletBalance).toFixed(2)} more. Please top up your wallet.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          menu_item: item.id,
          quantity: item.quantity,
        })),
        notes,
        payment_method: paymentMethod,
      };
      const response = await api.post('orders/', payload);
      
      if (paymentMethod === 'sslcommerz') {
        const orderId = response.data.id;
        const payment = response.data.payments?.[0] || response.data.payment;
        const paymentId = payment?.id;
        
        if (paymentId) {
          const initRes = await api.post(`payments/${paymentId}/sslcommerz/initiate/`);
          if (initRes.data.payment_url) {
            window.location.href = initRes.data.payment_url;
            return;
          }
        }
      }

      setSuccess(true);
      setCart({});
      setNotes('');
      setTimeout(() => {
        navigate('/orders');
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to place order. Make sure you have an employee profile.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center gap-4 slide-up">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Order Placed!</h2>
          <p className="text-slate-400 mt-2">Your order has been submitted and is being prepared.</p>
          <p className="text-slate-500 text-sm mt-1">Redirecting to your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Place an Order</h1>
        <p className="text-sm text-slate-400 mt-1">Browse today's menu and add items to your cart.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Menu */}
        <div className="flex-1 space-y-4">
          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="flex bg-slate-800 rounded-lg p-1.5 w-full sm:w-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex-1 sm:flex-none ${
                    categoryFilter === cat ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Menu Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No items found</p>
              <p className="text-slate-500 text-sm mt-1">Try a different category or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const qty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900 border rounded-xl overflow-hidden transition-all shadow-sm flex flex-col group ${
                      qty > 0 ? 'border-indigo-500/40 shadow-indigo-500/10 shadow-md' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Image placeholder */}
                    <div className="h-36 bg-slate-800 relative overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.food_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-br from-slate-800 to-slate-900">
                          <Utensils className="w-8 h-8 mb-1 opacity-40" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
                        {getMealTypeLabel(item.meal_type)}
                      </div>
                      {qty > 0 && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                          {qty}
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-sm text-slate-100 leading-tight">{item.food_name}</h3>
                        <span className="font-bold text-indigo-400 ml-2 text-sm shrink-0">${parseFloat(item.price).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1 mb-3">{item.description}</p>

                      <div className="mt-auto">
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item.id)}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition-all"
                          >
                            <Plus className="w-4 h-4" /> Add to Cart
                          </button>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-slate-100 text-sm flex-1 text-center">{qty}</span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="xl:w-80 shrink-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm sticky top-20">
            {/* Cart Header */}
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-100 text-base">Your Cart</h2>
                    <p className="text-xs text-slate-500">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Wallet Balance</span>
                <span className={`text-sm font-bold ${walletBalance < cartTotal ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${walletBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cart Items */}
            <div className="p-5 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="text-center py-6">
                  <ShoppingBag className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Your cart is empty</p>
                  <p className="text-xs text-slate-600 mt-1">Add items from the menu to get started</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{item.food_name}</p>
                      <p className="text-xs text-slate-500">${parseFloat(item.price).toFixed(2)} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-bold text-indigo-400">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => clearFromCart(item.id)}
                        className="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-800 space-y-4">
                {/* Order Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Special Requests (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Allergies, dietary notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setPaymentMethod('wallet')}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${paymentMethod === 'wallet' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className={`w-4 h-4 ${paymentMethod === 'wallet' ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className={`text-sm font-medium ${paymentMethod === 'wallet' ? 'text-indigo-100' : 'text-slate-400'}`}>Wallet Balance</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-indigo-500' : 'border-slate-700'}`}>
                        {paymentMethod === 'wallet' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setPaymentMethod('sslcommerz')}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${paymentMethod === 'sslcommerz' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className={`w-4 h-4 ${paymentMethod === 'sslcommerz' ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className={`text-sm font-medium ${paymentMethod === 'sslcommerz' ? 'text-indigo-100' : 'text-slate-400'}`}>Mobile Banking</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'sslcommerz' ? 'border-indigo-500' : 'border-slate-700'}`}>
                        {paymentMethod === 'sslcommerz' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-xs">
                    {error}
                  </div>
                )}

                {/* Total & Submit */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                  <div>
                    <p className="text-xs text-slate-500">Order Total</p>
                    <p className="text-xl font-bold text-slate-100">${cartTotal.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    {submitting ? 'Placing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
