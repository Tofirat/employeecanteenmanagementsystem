import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Plus, Search, Loader2, Edit2, Trash2, X, Image as ImageIcon, 
  ShoppingCart, Minus, CreditCard, Wallet, Banknote, CheckCircle2,
  Utensils, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Menu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data State
  const [menuItems, setMenuItems] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // UX Features
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Cart & Order State
  const [cart, setCart] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Admin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    food_name: '', description: '', price: '', meal_type: 'LB', is_available: true
  });
  const [modalLoading, setModalLoading] = useState(false);

  const categories = ['All', 'Breakfast', 'Lunch', 'Snacks'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, empRes] = await Promise.allSettled([
        api.get('menu/'),
        api.get('employees/me/')?.catch(() => null)
      ]);

      if (menuRes.status === 'fulfilled') {
        const data = menuRes.value.data?.results || menuRes.value.data || [];
        setMenuItems(Array.isArray(data) ? data : []);
      }

      if (empRes.status === 'fulfilled' && empRes.value?.data) {
        setWalletBalance(parseFloat(empRes.value.data.wallet_balance || 0));
      } else {
        // Fallback for admins or non-employees
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeLabel = (code) => {
    const map = { BB: 'Breakfast', LB: 'Lunch', SB: 'Snacks' };
    return map[code] || code;
  };

  const filteredMenu = menuItems.filter(item => {
    // Only show available items to regular users
    const isAdmin = user?.role === 'admin' || user?.role === 'staff';
    if (!isAdmin && item.is_available === false) return false;

    const matchesSearch = item.food_name.toLowerCase().includes(searchTerm.toLowerCase());
    const label = getMealTypeLabel(item.meal_type);
    const matchesCategory = categoryFilter === 'All' || label === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // --- Cart & Order Logic ---
  const addToCart = (itemId) => {
    setOrderError('');
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
    return item ? { ...item, quantity: qty } : null;
  }).filter(Boolean);

  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;
    if (!paymentMethod) {
      setOrderError('Please select a payment method.');
      return;
    }
    
    if (paymentMethod === 'wallet' && walletBalance < cartTotal) {
      setOrderError(`Insufficient wallet balance. You need $${(cartTotal - walletBalance).toFixed(2)} more.`);
      return;
    }

    setSubmitting(true);
    setOrderError('');
    try {
      const payload = {
        items: cartItems.map(item => ({
          menu_item: item.id,
          quantity: item.quantity,
        })),
        notes: `Paid via: ${paymentMethod.toUpperCase()}`,
      };
      await api.post('orders/', payload);
      setSuccess(true);
      setCart({});
      
      // Auto redirect or reset after success
      setTimeout(() => {
        setSuccess(false);
        fetchData(); // Refresh balance
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to place order. Make sure you have an employee profile.';
      setOrderError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Admin Logic ---
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ food_name: '', description: '', price: '', meal_type: 'LB', is_available: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      food_name: item.food_name,
      description: item.description,
      price: item.price,
      meal_type: item.meal_type,
      is_available: item.is_available ?? true
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editingItem) {
        const response = await api.put(`menu/${editingItem.id}/`, formData);
        setMenuItems(menuItems.map(item => item.id === editingItem.id ? response.data : item));
      } else {
        const response = await api.post('menu/', formData);
        setMenuItems([response.data, ...menuItems]);
      }
      closeModal();
    } catch (error) {
      alert('Action failed. Ensure you have admin privileges and filled all fields.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete(`menu/${id}/`);
        setMenuItems(menuItems.filter(item => item.id !== id));
      } catch (error) {
        alert("Failed to delete item.");
      }
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const updatedItem = { ...item, is_available: !(item.is_available ?? true) };
      await api.put(`menu/${item.id}/`, updatedItem);
      setMenuItems(menuItems.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error("Failed to toggle");
    }
  };

  const getDemoImage = (type, id) => {
    const images = [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', // Burger
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80', // Salad
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80', // Pasta
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', // Grill
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'  // Pizza
    ];
    return images[id % images.length];
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-indigo-500">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 flex justify-center fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl shadow-indigo-500/10 w-full max-w-lg">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0 relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 relative z-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-3">Order Confirmed!</h2>
          <p className="text-slate-400 mb-8 text-lg">Your food is being prepared and will be ready soon.</p>
          <button 
            onClick={() => navigate('/orders')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative slide-up pb-24 lg:pb-0">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Our Menu</h1>
          <p className="text-sm text-slate-400 mt-1">Explore delicious meals and place your order instantly.</p>
        </div>
        {isAdmin && (
          <button onClick={openAddModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Add Food Item
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Col: Menu Display */}
        <div className={`flex-1 space-y-6 transition-all duration-300 ${cartCount > 0 ? 'lg:w-2/3' : 'w-full'}`}>
          {/* Filters and Search Area */}
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm sticky top-0 z-10">
            <div className="flex bg-slate-950/50 rounded-xl p-1.5 w-full md:w-auto">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex-1 md:flex-none ${
                    categoryFilter === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search food items..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Menu Grid */}
          {filteredMenu.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-16 text-center">
              <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300">No menu items found</h3>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or wait for our new items!</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${cartCount > 0 ? 'xl:grid-cols-2' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-5`}>
              {filteredMenu.map(item => {
                const isAvailable = item.is_available ?? true;
                const qtyInCart = cart[item.id] || 0;
                // Use a generated Unsplash image as a high-quality demo placeholder
                const imageSrc = item.image || getDemoImage(item.meal_type, item.id);

                return (
                  <div key={item.id} className={`bg-slate-900 border rounded-2xl overflow-hidden group transition-all duration-300 flex flex-col ${qtyInCart > 0 ? 'border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}>
                    {/* Image Container */}
                    <div className="relative h-44 bg-slate-800 overflow-hidden">
                      <img src={imageSrc} alt={item.food_name} className={`w-full h-full object-cover transition-transform duration-700 ${!isAvailable ? 'grayscale opacity-60' : 'group-hover:scale-110 opacity-90 group-hover:opacity-100'}`} />
                      
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-rose-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Not Available</span>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button onClick={() => openEditModal(item)} className="p-1.5 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-rose-500/90 backdrop-blur border border-rose-500/30 rounded-lg text-white hover:bg-rose-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-700 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold text-slate-200">
                        {getMealTypeLabel(item.meal_type)}
                      </div>
                      
                      {qtyInCart > 0 && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-600/40 z-10 m-4">
                          {qtyInCart}
                        </div>
                      )}
                    </div>

                    {/* Content Container */}
                    <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-slate-900 to-slate-950">
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <h3 className="font-bold text-base text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">{item.food_name}</h3>
                        <span className="font-extrabold text-indigo-400 shrink-0">${parseFloat(item.price).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-5 line-clamp-2 leading-relaxed flex-1">{item.description || 'Deliciously crafted meal.'}</p>
                      
                      <div className="mt-auto">
                        {isAdmin && (
                          <div className="mb-4 pb-4 border-b border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stock Status</span>
                            <button 
                              onClick={() => toggleAvailability(item)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isAvailable ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                               <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isAvailable ? 'translate-x-4.5' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        )}

                        {!isAdmin && isAvailable && (
                          qtyInCart === 0 ? (
                            <button
                              onClick={() => addToCart(item.id)}
                              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium transition-all group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                            >
                              <Plus className="w-4 h-4" /> Add to Cart
                            </button>
                          ) : (
                            <div className="flex items-center justify-between gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold text-slate-100 text-sm">{qtyInCart}</span>
                              <button
                                onClick={() => addToCart(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        )}
                        {!isAdmin && !isAvailable && (
                          <div className="w-full text-center py-2.5 rounded-xl bg-slate-800/30 text-slate-500 text-sm font-medium border border-slate-800/50 cursor-not-allowed">
                            Out of Stock
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

        {/* Right Col: Cart & Checkout (Sticky) */}
        {cartCount > 0 && (
          <div className="lg:w-1/3 xl:w-[400px] shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl sticky top-24 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)] slide-left">
              
              <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Your Order</h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{cartCount} items</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-start gap-3 group">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                      <img src={item.image || getDemoImage(item.meal_type, item.id)} alt="" className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-bold text-slate-200 truncate">{item.food_name}</p>
                      <p className="text-xs text-slate-500 font-medium">${parseFloat(item.price).toFixed(2)} x {item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-indigo-400">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => clearFromCart(item.id)}
                        className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment & Checkout Area */}
              <div className="bg-slate-950 p-6 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Method</h3>
                
                <div className="grid gap-3 mb-6">
                  {/* Digital Wallet Option */}
                  <label className={`relative flex items-center p-4 cursor-pointer rounded-xl border transition-all ${paymentMethod === 'wallet' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}>
                    <input type="radio" name="payment" value="wallet" checked={paymentMethod === 'wallet'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Wallet className={`w-5 h-5 ${paymentMethod === 'wallet' ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <p className={`text-sm font-semibold ${paymentMethod === 'wallet' ? 'text-indigo-100' : 'text-slate-300'}`}>Digital Wallet</p>
                          <p className="text-xs text-emerald-400 font-medium">Bal: ${walletBalance.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-indigo-500' : 'border-slate-700'}`}>
                        {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
                      </div>
                    </div>
                  </label>

                  {/* Credit Card Option */}
                  <label className={`relative flex items-center p-4 cursor-pointer rounded-xl border transition-all ${paymentMethod === 'card' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}>
                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className={`text-sm font-semibold ${paymentMethod === 'card' ? 'text-indigo-100' : 'text-slate-300'}`}>Credit / Debit Card</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-indigo-500' : 'border-slate-700'}`}>
                        {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
                      </div>
                    </div>
                  </label>

                  {/* Cash Option */}
                  <label className={`relative flex items-center p-4 cursor-pointer rounded-xl border transition-all ${paymentMethod === 'cash' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}>
                    <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Banknote className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className={`text-sm font-semibold ${paymentMethod === 'cash' ? 'text-indigo-100' : 'text-slate-300'}`}>Cash at Counter</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-indigo-500' : 'border-slate-700'}`}>
                        {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between items-center mb-6 py-2">
                  <span className="text-slate-400 font-medium">Total Amount</span>
                  <span className="text-2xl font-extrabold text-white">${cartTotal.toFixed(2)}</span>
                </div>

                {orderError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                    <span className="shrink-0 w-1.5 h-4 bg-rose-500 rounded-full"></span>
                    {orderError}
                  </div>
                )}

                <button 
                  onClick={handleSubmitOrder}
                  disabled={submitting || !paymentMethod}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-base font-bold shadow-xl transition-all duration-300 ${
                    !paymentMethod || submitting 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 border border-indigo-500/50 hover:-translate-y-0.5'
                  }`}
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                     <>{paymentMethod === 'wallet' ? 'Pay & Order' : 'Place Order'} <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Floating Mobile Cart summary string at bottom if screen is small */}
      {!isAdmin && cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 lg:hidden flex justify-between items-center z-40 shadow-2xl">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{cartCount} items</p>
            <p className="text-lg font-bold text-white">${cartTotal.toFixed(2)}</p>
          </div>
          <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="px-5 py-2.5 bg-indigo-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
            View Cart
          </button>
        </div>
      )}

      {/* Admin Add/Edit Modal (Unchanged structurally, styled beautifully) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal header & body */}
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-white">{editingItem ? 'Edit Food Item' : 'Add New Food'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-full hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMenu} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Food Name</label>
                <input 
                  type="text" required value={formData.food_name} onChange={(e) => setFormData({...formData, food_name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" 
                  placeholder="e.g. Classic Cheeseburger"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price ($)</label>
                  <input 
                    type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none tabular-nums" 
                    placeholder="9.99"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select 
                    value={formData.meal_type} onChange={(e) => setFormData({...formData, meal_type: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none appearance-none"
                  >
                    <option value="BB">Breakfast</option>
                    <option value="LB">Lunch</option>
                    <option value="SB">Snacks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  rows={3} required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none" 
                  placeholder="Ingredients, dietary info, etc."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 mt-8">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" disabled={modalLoading}
                  className="px-6 py-2.5 flex items-center justify-center min-w-[140px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {modalLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingItem ? 'Update Item' : 'Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
