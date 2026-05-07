import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, Mail, Loader2, Server } from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'employee' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setFormData(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const setRole = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      // Pass username, password, and the requested role
      const user = await login(formData.username, formData.password, formData.role);
      
      // Handle the "Remember Me" logic locally
      if (rememberMe) {
        localStorage.setItem('remembered_username', formData.username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      if (user.role === 'admin' || user.role === 'staff') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Invalid credentials. Please double check your details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 relative z-10 transition-all">
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Server className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 mb-2">
            Smart Canteen
          </h1>
          <p className="text-sm text-slate-400">Please enter your details to sign in</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3 mb-6 text-sm animate-in fade-in slide-in-from-top-2">
            <span className="font-bold shrink-0">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wide">Sign in as</label>
            <div className="grid grid-cols-3 gap-2">
              {['employee', 'staff', 'admin'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRole(role)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all duration-200 ${
                    formData.role === role 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="username">Username / Email</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <User className="w-5 h-5" />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                value={formData.username}
                onChange={handleChange}
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="password">Password</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all sm:text-sm"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-slate-950 transition-colors cursor-pointer"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
            </label>
            <a href="#" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Forgot password?
            </a>
          </div>

          <button 
            type="submit" 
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 mt-6 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-400">
          Not registered? <Link to="/register" className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">Request Account</Link>
        </p>
      </div>
    </div>
  );
}
