import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Loader2, Edit2, Trash2, X, Shield } from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '', role: 'employee', password: '', password_confirm: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('auth/users/');
      const data = response.data?.results || response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter.toLowerCase();
    const searchString = `${u.first_name} ${u.last_name} ${u.email} ${u.username}`.toLowerCase();
    return matchesRole && searchString.includes(searchTerm.toLowerCase());
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Admin</span>;
      case 'staff': return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Staff</span>;
      default: return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Employee</span>;
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', first_name: '', last_name: '', role: 'employee', password: '', password_confirm: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({ username: u.username, email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role, password: '', password_confirm: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!editingUser && formData.password !== formData.password_confirm) {
      setModalError('Passwords do not match.');
      return;
    }

    setModalLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        const payload = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        const response = await api.patch(`auth/users/${editingUser.id}/`, payload);
        setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
      } else {
        // Create new user
        const response = await api.post('auth/users/create/', {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          password: formData.password,
          password_confirm: formData.password_confirm,
        });
        setUsers([response.data, ...users]);
      }
      setIsModalOpen(false);
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const firstError = Object.values(errors)[0];
        setModalError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setModalError('Failed to save user. Please try again.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const executeDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`auth/users/${deletingId}/`);
      setUsers(users.filter(u => u.id !== deletingId));
    } catch (error) {
      alert(error.response?.data?.detail || 'Delete failed. Please try again.');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage system accounts, roles, and permissions.</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all">
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex bg-slate-800 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
          {['All', 'Admin', 'Staff', 'Employee'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${roleFilter === r ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, username, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 hidden sm:table-cell">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No users found.</td>
                </tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-slate-700 flex shrink-0 items-center justify-center">
                        <span className="text-sm font-bold text-slate-300">
                          {(u.first_name?.[0] || u.username?.[0] || '?').toUpperCase()}
                          {(u.last_name?.[0] || '').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-slate-500">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-slate-300">{u.email}</td>
                  <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.is_active !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {u.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(u)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors border border-transparent hover:border-slate-700">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.username !== user?.username && user?.role === 'admin' && (
                        <button onClick={() => setDeletingId(u.id)} className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors border border-transparent hover:border-rose-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">{modalError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First Name *</label>
                  <input type="text" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-indigo-500" placeholder="John" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Name *</label>
                  <input type="text" required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-indigo-500" placeholder="Doe" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username *</label>
                  <input type="text" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-indigo-500 disabled:opacity-50" placeholder="jdoe" disabled={!!editingUser} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-indigo-500 appearance-none">
                    <option value="employee">Employee</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-indigo-500" placeholder="jdoe@company.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Password {editingUser && <span className="normal-case font-normal text-slate-500">(blank = unchanged)</span>}
                  </label>
                  <input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-indigo-500" placeholder="••••••••" />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password *</label>
                    <input type="password" required value={formData.password_confirm} onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-indigo-500" placeholder="••••••••" />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={modalLoading} className="px-5 py-2 min-w-[130px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingUser ? 'Save Changes' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-2">Deactivate User?</h3>
              <p className="text-sm text-slate-400">This will deactivate the user account. They will no longer be able to log in.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg">Cancel</button>
                <button onClick={executeDelete} disabled={deleteLoading} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
