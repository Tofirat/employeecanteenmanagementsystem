// import { useState } from 'react';
// import { Outlet, Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { LayoutDashboard, Utensils, ClipboardList, LogOut, Menu, X, Bell, User as UserIcon, Settings, ShoppingCart, DollarSign } from 'lucide-react';

// export default function EmployeeLayout() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const { user, logout } = useAuth();
//   const location = useLocation();

//   const navItems = [
//     { name: 'Dashboard', path: '/', icon: LayoutDashboard },
//     { name: 'Place Order', path: '/order', icon: ShoppingCart },
//     { name: 'Browse Menu', path: '/menu', icon: Utensils },
//     { name: 'My Orders', path: '/orders', icon: ClipboardList },
//     { name: 'Payment/Billing', path: '/payments', icon: DollarSign },
//     { name: 'Settings', path: '/settings', icon: Settings },
//   ];

//   const handleLogout = () => {
//     logout();
//   };

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex text-sm">
      
//       {/* Mobile Sidebar Overlay */}
//       {sidebarOpen && (
//         <div 
//           className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         ></div>
//       )}

//       {/* Sidebar */}
//       <aside className={`fixed top-0 left-0 z-50 h-screen w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
//         {/* Sidebar Header */}
//         <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
//           <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
//             SmartCanteen
//           </h2>
//           <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         {/* Sidebar Nav */}
//         <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
//           <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
//           {navItems.map((item) => {
//             const Icon = item.icon;
//             // Handle root path strictly, else startsWith for others
//             const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
//             return (
//               <Link 
//                 key={item.name}
//                 to={item.path}
//                 onClick={() => setSidebarOpen(false)}
//                 className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
//                   isActive 
//                   ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
//                   : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
//                 }`}
//               >
//                 <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
//                 {item.name}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Sidebar Footer */}
//         <div className="p-4 border-t border-slate-800">
//           <button 
//             onClick={handleLogout}
//             className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors font-medium"
//           >
//             <LogOut className="w-5 h-5" />
//             Sign Out
//           </button>
//         </div>
//       </aside>

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col min-h-screen lg:pl-72 transition-all duration-300 relative w-full">
        
//         {/* Top Navbar */}
//         <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center">
//             <button 
//               className="p-2 mr-3 -ml-2 rounded-md lg:hidden text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
//               onClick={() => setSidebarOpen(true)}
//             >
//               <Menu className="w-6 h-6" />
//             </button>
//             <h1 className="text-lg font-semibold text-slate-100 hidden sm:block">
//               {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
//             </h1>
//           </div>

//           {/* Right side actions */}
//           <div className="flex items-center gap-4">
//             {/* Notifications */}
//             <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-white transition-colors">
//               <Bell className="w-5 h-5" />
//               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-slate-900"></span>
//             </Link>

//             {/* Profile Dropdown */}
//             <div className="relative">
//               <button 
//                 className="flex items-center gap-3 p-1 pl-3 rounded-full hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
//                 onClick={() => setProfileOpen(!profileOpen)}
//               >
//                 <div className="text-right hidden sm:block">
//                   <p className="text-sm font-medium text-slate-200 leading-none mb-1">{user?.first_name || 'Employee'}</p>
//                   <p className="text-xs text-slate-400 leading-none capitalize">{user?.department_name || 'Staff'}</p>
//                 </div>
//                 <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
//                   <UserIcon className="w-5 h-5 text-slate-400" />
//                 </div>
//               </button>

//               {/* Dropdown Menu */}
//               {profileOpen && (
//                 <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
//                   <div className="px-4 py-2 border-b border-slate-800 sm:hidden">
//                     <p className="text-sm font-medium text-slate-200">{user?.first_name}</p>
//                     <p className="text-xs text-slate-400 capitalize">{user?.department_name}</p>
//                   </div>
//                   <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
//                     <Settings className="w-4 h-4 text-slate-500" /> Settings
//                   </Link>
//                   <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800">
//                     <LogOut className="w-4 h-4" /> Sign Out
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </header>

//         {/* Page Content */}
//         <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
//           <Outlet />
//         </main>
//       </div>

//       {/* Mobile Bottom Navigation (Hidden on large screens) */}
//       <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 z-40 flex items-center justify-around px-2 pb-safe">
//         {navItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
//           return (
//             <Link 
//               key={item.name}
//               to={item.path}
//               className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
//                 isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
//               }`}
//             >
//               <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
//               <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.name}</span>
//             </Link>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Utensils, ClipboardList, LogOut, 
  Menu, X, Bell, User as UserIcon, Settings, 
  ShoppingCart, DollarSign 
} from 'lucide-react';

// --- Constants ---
const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Place Order', path: '/order', icon: ShoppingCart },
  { name: 'Browse Menu', path: '/menu', icon: Utensils },
  { name: 'My Orders', path: '/orders', icon: ClipboardList },
  { name: 'Payments', path: '/payments', icon: DollarSign },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to determine active route
  const isPathActive = (path) => 
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex text-sm">
      
      {/* 1. Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Sidebar (Desktop & Mobile) */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72 
        bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 
        transition-transform duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
            SmartCanteen
          </h2>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`nav-link ${isPathActive(item.path) ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              <item.icon className={`w-5 h-5 ${isPathActive(item.path) ? 'text-indigo-400' : 'text-slate-500'}`} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-72 transition-all w-full">
        
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 lg:hidden text-slate-400 hover:bg-slate-800 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-100 hidden sm:block">
              {NAV_ITEMS.find(i => isPathActive(i.path))?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-slate-950"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-dropdown">
                  <div className="px-4 py-2 border-b border-slate-800 mb-2">
                    <p className="text-sm font-semibold text-white">{user?.first_name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || 'employee@company.com'}</p>
                  </div>
                  <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* 4. Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-40 flex items-center justify-around px-2">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link 
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center gap-1 w-full ${isPathActive(item.path) ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <item.icon className={`w-5 h-5 ${isPathActive(item.path) ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}