import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Banknote, CheckCircle2, ChevronRight, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Payment() {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState('50.00'); // Default top-up amount
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const resp = await api.get('employees/me/');
      if (resp.data) {
        setWalletBalance(parseFloat(resp.data.wallet_balance || 0));
      }
    } catch (err) {
      console.error('Failed to load wallet balance', err);
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount and select a payment method.');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await api.post('payments/', {
        amount: parseFloat(amount),
        payment_method: paymentMethod
      });
      
      if (paymentMethod === 'sslcommerz') {
        const paymentId = response.data.id;
        const initRes = await api.post(`payments/${paymentId}/sslcommerz/initiate/`);
        if (initRes.data.payment_url) {
          window.location.href = initRes.data.payment_url;
          return;
        }
      }
      
      setSuccess(true);
      fetchWallet();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 flex justify-center fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-xl w-full max-w-md">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Top-Up Successful!</h2>
          <p className="text-slate-400 mb-8">Funds have been added to your wallet securely.</p>
          
          <div className="bg-slate-950 rounded-xl p-4 mb-8">
            <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-1">New Wallet Balance</p>
            <p className="text-3xl font-bold text-emerald-400">${(walletBalance + parseFloat(amount)).toFixed(2)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { setSuccess(false); setAmount('50.00'); setPaymentMethod(''); }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-lg transition-colors border border-slate-700"
            >
              Add More
            </button>
            <button 
              onClick={() => navigate('/order')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Order Food
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 slide-up">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-100">Wallet Top-Up</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Col: Current Balance & Input */}
        <div className="w-full lg:w-[45%] space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-600 rounded-2xl p-8 shadow-lg text-white border border-indigo-400/30 relative overflow-hidden">
            <Wallet className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 text-white" />
            <p className="text-indigo-200 font-medium mb-1 relative z-10">Current Balance</p>
            <h2 className="text-5xl font-bold mb-4 relative z-10">${walletBalance.toFixed(2)}</h2>
            <div className="pt-4 border-t border-indigo-400/30 relative z-10">
              <p className="text-sm text-indigo-100 inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Use this balance for instant checkouts
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-100 pb-2 mb-4">Enter Amount</h3>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="5"
                step="5"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-10 pr-4 text-3xl font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="0.00"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[20, 50, 100].map(val => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className={`py-2 rounded-lg font-medium text-sm border transition-colors ${amount === val.toString() ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Payment Area */}
        <div className="w-full lg:w-[55%]">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-300 mb-6 uppercase tracking-wider">Select Payment Method</h3>
            
            <div className="space-y-4 mb-8">
              {[
                { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard className="w-6 h-6" /> },
                { id: 'sslcommerz', name: 'Mobile Banking', icon: <Banknote className="w-6 h-6" /> },
                { id: 'cash', name: 'Cash on Counter', icon: <Plus className="w-6 h-6" /> },
              ].map((method) => (
                <label 
                  key={method.id} 
                  className={`flex flex-row items-center cursor-pointer justify-between p-5 rounded-xl border transition-all duration-200 ${
                    paymentMethod === method.id 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${paymentMethod === method.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                      {method.icon}
                    </div>
                    <span className={`font-semibold text-lg ${paymentMethod === method.id ? 'text-indigo-100' : 'text-slate-300'}`}>{method.name}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-indigo-500' : 'border-slate-600'}`}>
                    {paymentMethod === method.id && <div className="w-3 h-3 rounded-full bg-indigo-500"></div>}
                  </div>
                  <input 
                    type="radio" 
                    name="payment" 
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="hidden"
                  />
                </label>
              ))}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <button 
              onClick={handlePayment}
              disabled={!paymentMethod || isProcessing || !amount || parseFloat(amount) <= 0}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-base font-bold shadow-xl transition-all duration-300 ${
                paymentMethod && !isProcessing && amount && parseFloat(amount) > 0
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-70'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Top Up ${parseFloat(amount || 0).toFixed(2)} <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-5 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Secure 256-bit encrypted checkout
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function Lock({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
