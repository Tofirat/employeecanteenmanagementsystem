import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: ''
  });
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.password_confirm || !formData.first_name || !formData.last_name || !formData.email) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Append default role and phone
      const payload = {
        ...formData,
        role: 'employee',
        phone: ''
      };
      await register(payload);
      // Optional: Auto-login handles the navigate if the register sets AuthContext, but let's navigate just in case.
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Username or email may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center fade-in px-4 py-12">
      <div className="glass-panel max-w-md w-full p-8 relative overflow-hidden">
        <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-secondary rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-primary rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Create Account</h1>
            <p className="text-sm">Join the Canteen Management System</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3 mb-6 text-sm animate-in fade-in slide-in-from-top-2">
              <span className="font-bold shrink-0">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label" htmlFor="first_name">First Name</label>
                <input
                  name="first_name"
                  type="text"
                  className="form-control"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="last_name">Last Name</label>
                <input
                  name="last_name"
                  type="text"
                  className="form-control"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="form-group relative mt-2">
              <label className="form-label" htmlFor="username">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <User size={18} color="var(--text-muted)" />
                </span>
                <input
                  name="username"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                />
              </div>
            </div>

            <div className="form-group relative mt-4">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Mail size={18} color="var(--text-muted)" />
                </span>
                <input
                  name="email"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="form-group relative mt-4">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Lock size={18} color="var(--text-muted)" />
                </span>
                <input
                  name="password"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div className="form-group relative mt-4">
              <label className="form-label" htmlFor="password_confirm">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Lock size={18} color="var(--text-muted)" />
                </span>
                <input
                  name="password_confirm"
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full mt-6 py-3 text-lg flex justify-center items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Register
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted">
            Already have an account? <Link to="/login" className="gradient-text font-semibold hover:opacity-80 transition-opacity">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
