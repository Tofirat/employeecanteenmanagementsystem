
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Bell, Key, Mail, CheckCircle2, Loader2, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: '',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      showToast('Profile updated successfully');
    }, 1000);
  };

  const handleSecuritySave = (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Password updated securely');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transform transition-all animate-in slide-in-from-top-5 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
           <CheckCircle2 className="w-5 h-5" />
           <p className="font-medium text-sm">{toast.msg}</p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Account Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your profile, security preferences, and notifications.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Settings Sidebar Nav */}
        <div className="w-full lg:w-64 space-y-1">
          {[
            { id: 'profile', name: 'Profile Details', icon: <User className="w-5 h-5" /> },
            { id: 'security', name: 'Security & Password', icon: <Shield className="w-5 h-5" /> },
            { id: 'notifications', name: 'Notifications', icon: <Bell className="w-5 h-5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          
          {activeTab === 'profile' && (
            <div className="p-8 fade-in">
              <div className="border-b border-slate-800 pb-6 mb-6 flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-800 border-2 border-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold text-slate-300 shadow-xl relative">
                  {profileData.first_name[0]}{profileData.last_name[0]}
                  <button className="absolute bottom-0 right-0 p-1.5 bg-indigo-500 rounded-full border-2 border-slate-900 hover:bg-indigo-400 transition-colors">
                     <User className="w-3 h-3 text-white" />
                  </button>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Profile Picture</h2>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                    <input type="text" value={profileData.first_name} onChange={e => setProfileData({...profileData, first_name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                    <input type="text" value={profileData.last_name} onChange={e => setProfileData({...profileData, last_name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:border-indigo-500" />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-8 fade-in">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Key className="w-5 h-5 text-indigo-400"/> Update Password</h2>
                <p className="text-sm text-slate-400 mt-1">Ensure your account is using a long, random password to stay secure.</p>
              </div>

              <form onSubmit={handleSecuritySave} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                  <input type="password" required value={securityData.currentPassword} onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="••••••••" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                  <input type="password" required minLength="8" value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="••••••••" />
                  {securityData.newPassword && securityData.newPassword.length < 8 && <p className="text-xs text-rose-500 mt-1">Password must be at least 8 characters</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <input type="password" required value={securityData.confirmPassword} onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="••••••••" />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-8 fade-in">
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-400"/> Notification Preferences</h2>
                <p className="text-sm text-slate-400 mt-1">Choose how and when you want to be notified.</p>
              </div>

              <div className="space-y-6 max-w-2xl">
                {[
                  { id: '1', title: 'Order Updates', desc: 'Get notified when your order status changes' },
                  { id: '2', title: 'Daily Menu Alerts', desc: 'Receive an email when the new menu is published' },
                  { id: '3', title: 'System Alerts', desc: 'Security alerts and account status changes' },
                ].map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between py-4 border-b border-slate-800/50 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-200">{pref.title}</p>
                      <p className="text-xs text-slate-500">{pref.desc}</p>
                    </div>
                    <label className="relative flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={pref.id !== '2'} />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
