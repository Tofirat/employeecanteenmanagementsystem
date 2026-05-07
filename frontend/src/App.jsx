import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  ChefHat,
  ClipboardList,
  CreditCard,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  ShoppingBag,
  Soup,
  User,
  UserCircle2,
  Users,
} from "lucide-react";
import OrderBuilder from "./components/OrderBuilder";
import SectionCard from "./components/SectionCard";
import StatCard from "./components/StatCard";
import StatusBadge from "./components/StatusBadge";
import LandingPage from "./components/LandingPage";
import CartSidebar from "./components/CartSidebar";
import CheckoutModal from "./components/CheckoutModal";
import {
  cancelOrder,
  clearTokens,
  createDepartment,
  createMenuItem,
  deleteMenuItem,
  createOrder,
  fetchDailyReport,
  fetchAdminOrderReports,
  fetchDashboardStats,
  fetchDepartments,
  fetchEmployees,
  fetchMenuItems,
  fetchMonthlyReport,
  fetchMyEmployeeProfile,
  fetchOrders,
  fetchPayments,
  fetchProfile,
  fetchWeeklyTrends,
  getPublicInvoiceUrl,
  getInvoiceUrl,
  initiateSslPayment,
  login,
  logout,
  register,
  updateMenuItem,
  updateOrderStatus,
  updatePayment,
  updateMyEmployeeProfile,
} from "./services/api";

const initialData = {
  stats: null,
  employees: [],
  departments: [],
  menuItems: [],
  orders: [],
  payments: [],
  reports: { daily: null, monthly: null, weekly: null },
  employeeProfile: null,
};

const PUBLIC_MENU_CACHE_KEY = "canteen_public_menu_cache";
const PUBLIC_DEPARTMENTS_CACHE_KEY = "canteen_public_departments_cache";
const CHECKOUT_INTENT_KEY = "canteen_checkout_intent";

const employeeTabs = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "menu", label: "View Menu", icon: Soup },
  { key: "orders", label: "My Orders", icon: ClipboardList },
  { key: "billing", label: "Payment / Billing", icon: CreditCard },
  { key: "profile", label: "Profile", icon: UserCircle2 },
];

const adminTabs = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "employees", label: "Employees", icon: Users },
  { key: "departments", label: "Departments", icon: Building2 },
  { key: "menu", label: "Menu", icon: Soup },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "reports", label: "Reports", icon: Receipt },
];

const staffTabs = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "incoming", label: "Incoming Orders", icon: ClipboardList },
  { key: "operations", label: "Daily Operations", icon: ChefHat },
];

function getApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  const values = Object.values(data).flat().filter(Boolean);
  return values[0] || fallback;
}

function buildFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    // Standardize file detection and handle nulls
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value === "") return;
    formData.append(key, value);
  });
  return formData;
}

function readPaymentResultFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("payment");
  if (!status) return null;

  const paymentId = params.get("payment_id");
  const invoiceToken = params.get("invoice_token");

  return {
    status,
    invoice: params.get("invoice"),
    orderId: params.get("order_id"),
    paymentId,
    invoiceToken,
    invoiceUrl: paymentId && invoiceToken ? getPublicInvoiceUrl(paymentId, invoiceToken) : null,
  };
}

function PaymentResultScreen({ result, user, onContinue }) {
  const isSuccess = result?.status === "success";
  const title = isSuccess ? "Payment Successful" : result?.status === "cancelled" ? "Payment Cancelled" : "Payment Failed";
  const description = isSuccess
    ? "Your payment has been completed, your order is confirmed, and your invoice is ready to download."
    : result?.status === "cancelled"
      ? "The payment was cancelled before completion. Your order has not been completed through SSLCommerz."
      : "The payment could not be completed. You can try again from your order history when you're ready.";

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
            <Receipt size={34} />
          </div>
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
          </div>

          <div className="mt-8 space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            {result?.invoice ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Invoice</span>
                <span className="text-sm font-bold text-slate-900">{result.invoice}</span>
              </div>
            ) : null}
            {result?.orderId ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Order</span>
                <span className="text-sm font-bold text-slate-900">ORD-{result.orderId}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">Status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${isSuccess ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {isSuccess ? "Confirmed" : result?.status || "Unknown"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isSuccess && result?.invoiceUrl ? (
              <a
                href={result.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-2xl bg-indigo-600 px-5 py-4 text-center text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
              >
                Download Invoice
              </a>
            ) : null}
            <button
              onClick={onContinue}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {user ? "Continue to Dashboard" : "Back to Home"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function UploadPlaceholder({ label = "Upload image", sublabel = "No image added yet", className = "h-full w-full", loading = false }) {
  return (
    <div className={`flex items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 text-center relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px] bg-white/60 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        </div>
      )}
      <div className="max-w-full px-6 py-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
          <ImagePlus size={24} />
        </div>
        <p className="mt-4 break-words text-sm font-semibold leading-5 text-slate-700">{label}</p>
        <p className="mt-1 break-words text-xs leading-5 text-slate-400">{sublabel}</p>
      </div>
    </div>
  );
}

function UploadImageFrame({ src, alt, label, sublabel, className = "h-full w-full rounded-[22px]", loading = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (loading) {
    return <UploadPlaceholder label="Uploading..." sublabel="Please wait" className={className} loading={true} />;
  }

  if (!src || failed) {
    return <UploadPlaceholder label={label} sublabel={sublabel} className={className} />;
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

function AuthScreen({ onLogin, onRegister, departments, loading, error, initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    password_confirm: "",
    department: "",
  });

  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-6 relative selection:bg-indigo-100 selection:text-indigo-900">
      <button 
        onClick={onBack} 
        className="absolute left-6 top-6 sm:left-10 sm:top-10 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition"
      >
        <ChevronDown size={18} className="rotate-90" />
        Back to Home
      </button>

      <div className="w-full max-w-[440px] bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] border border-slate-100">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-4">
            <Soup size={24} />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 mb-2">{mode === "login" ? "Welcome back" : "Create an account"}</h1>
          <p className="text-sm text-slate-500">Access your employee dashboard to continue.</p>
        </div>

        <div className="mb-8 flex rounded-2xl bg-slate-100/80 p-1 border border-slate-100">
          <button onClick={() => setMode("login")} className={`flex-1 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}>Sign In</button>
          <button onClick={() => setMode("register")} className={`flex-1 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${mode === "register" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}>Register</button>
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-600 font-medium">{error}</div> : null}

        {mode === "login" ? (
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onLogin(loginForm); }}>
            <div className="space-y-1.5 mt-2">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" value={loginForm.username} onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))} />
            </div>
            <div className="space-y-1.5 mt-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <input type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
            </div>
            <button className="w-full rounded-2xl bg-indigo-600 px-5 py-4 mt-6 text-sm outline-none font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 hover:-translate-y-0.5" disabled={loading}>{loading ? "Verifying..." : "Sign In"}</button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onRegister({ ...registerForm, role: "employee", department: registerForm.department || null }); }}>
            <div className="grid grid-cols-2 gap-4">
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="First name" value={registerForm.first_name} onChange={(event) => setRegisterForm((current) => ({ ...current, first_name: event.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Last name" value={registerForm.last_name} onChange={(event) => setRegisterForm((current) => ({ ...current, last_name: event.target.value }))} />
            </div>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Username" value={registerForm.username} onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))} />
            <input type="email" className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Email address" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Phone number" value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} />
            <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white appearance-none" value={registerForm.department} onChange={(event) => setRegisterForm((current) => ({ ...current, department: event.target.value }))}>
              <option value="">Select department (optional)</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.department_name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-4">
              <input type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} />
              <input type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Confirm password" value={registerForm.password_confirm} onChange={(event) => setRegisterForm((current) => ({ ...current, password_confirm: event.target.value }))} />
            </div>
            <button className="w-full rounded-2xl bg-indigo-600 px-5 py-4 mt-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 hover:-translate-y-0.5" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
          </form>
        )}
      </div>
    </main>
  );
}

function Sidebar({ brand, items, activeTab, onChange, onLogout }) {
  return (
    <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:w-[270px] lg:flex-col">
      <div className="border-b border-slate-200 px-8 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Soup size={22} />
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-slate-900">Canteen Pro</p>
            <p className="text-sm text-slate-500">{brand}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-2 px-5 py-6">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeTab;
          return (
            <button key={item.key} onClick={() => onChange(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium transition ${active ? "bg-indigo-100 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-5">
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-rose-500 transition hover:bg-rose-50">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </aside>
  );
}

function Topbar({ title, user, onLogout, onChangeTab, cartItemCount, onOpenCart, searchValue = "", onSearchChange, searchPlaceholder = "Search..." }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const initials = `${user.first_name?.[0] || user.username?.[0] || "U"}${user.last_name?.[0] || ""}`.toUpperCase();
  const profileImage = user.employee_profile?.profile_image || null;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 py-5 backdrop-blur xl:px-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="hidden min-w-[320px] items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 transition-all focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 lg:flex">
          <Search size={18} className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </div>
        <button className="relative rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100">
          <Bell size={22} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
        </button>
        {user?.role === "employee" && (
          <button onClick={onOpenCart} className="relative rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100">
            <ShoppingBag size={22} />
            {cartItemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white">{cartItemCount}</span>}
          </button>
        )}
        <div ref={dropdownRef} className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)} 
            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 pr-3 transition-all hover:bg-slate-50 focus:ring-4 focus:ring-indigo-50"
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{initials}</div>
            )}
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username}</p>
              <p className="text-xs capitalize text-slate-500">{user.role === "staff" ? "Canteen Staff" : user.role}</p>
            </div>
            <ChevronDown size={16} className={`hidden text-slate-400 transition-transform md:block ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              {onChangeTab && (
                <button 
                  onClick={() => {
                    onChangeTab("profile");
                    setDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
                >
                  <User size={16} /> My Profile
                </button>
              )}
              <div className="my-1 border-t border-slate-100"></div>
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Shell({ brand, title, user, tabs, activeTab, onChangeTab, onLogout, cartItemCount, onOpenCart, searchValue, onSearchChange, searchPlaceholder, children }) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] lg:flex">
      <Sidebar brand={brand} items={tabs} activeTab={activeTab} onChange={onChangeTab} onLogout={onLogout} />
      <div className="min-h-screen flex-1">
        <Topbar title={title} user={user} onLogout={onLogout} onChangeTab={onChangeTab} cartItemCount={cartItemCount} onOpenCart={onOpenCart} searchValue={searchValue} onSearchChange={onSearchChange} searchPlaceholder={searchPlaceholder} />
        <div className="space-y-6 p-5 xl:p-8">{children}</div>
      </div>
    </div>
  );
}

function EmployeeDashboard({ user, data, activeTab, onChangeTab, onLogout, onStartPayment, onCancelOrder, onUpdateProfile, isUploadingProfile, cartItems, changeQuantity, cartItemCount, onOpenCart, getInvoiceUrl }) {
  const profile = data.employeeProfile || user.employee_profile;
  const [topSearch, setTopSearch] = useState("");
  const deferredTopSearch = useDeferredValue(topSearch);
  // Count only orders placed in the current calendar month
  const now = new Date();
  const totalOrders = data.orders.filter(order => {
    const d = new Date(order.order_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const monthlySpending = data.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const pendingOrders = data.orders.filter((order) => ["pending", "preparing"].includes(order.status)).length;
  const currentStatus = data.payments.some((payment) => ["unpaid", "overdue", "failed", "cancelled"].includes(payment.status)) ? "Action Needed" : "All Clear";
  const latestOpenPayment = data.payments.find((payment) => ["unpaid", "overdue", "failed", "cancelled"].includes(payment.status));
  const recentOrders = data.orders.slice(0, 5);
  const pendingQueue = data.orders.filter((order) => ["pending", "preparing"].includes(order.status)).slice(0, 5);
  const [billingFilter, setBillingFilter] = useState("all");

  const totalBilled = data.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalPaid = data.payments.filter(item => item.status === "paid").reduce((sum, item) => sum + Number(item.amount), 0);
  const totalOutstanding = data.payments.filter(item => ["unpaid", "overdue", "failed", "cancelled"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount), 0);
  
  const filteredPayments = data.payments.filter(payment => {
    if (billingFilter === "unpaid") return ["unpaid", "overdue", "failed", "cancelled"].includes(payment.status);
    if (billingFilter === "paid") return payment.status === "paid";
    return true;
  });
  const normalizedTopSearch = deferredTopSearch.toLowerCase();
  const filteredMenuItems = data.menuItems.filter((item) => !normalizedTopSearch || item.food_name?.toLowerCase().includes(normalizedTopSearch) || item.meal_type_display?.toLowerCase().includes(normalizedTopSearch) || item.meal_type?.toLowerCase().includes(normalizedTopSearch));
  const filteredOrders = data.orders.filter((order) => !normalizedTopSearch || String(order.id).includes(normalizedTopSearch) || order.status?.toLowerCase().includes(normalizedTopSearch) || order.items?.some((item) => item.food_name?.toLowerCase().includes(normalizedTopSearch)));
  const searchedPayments = filteredPayments.filter((payment) => !normalizedTopSearch || payment.invoice_number?.toLowerCase().includes(normalizedTopSearch) || payment.status?.toLowerCase().includes(normalizedTopSearch));
  const canCancelOrder = (order) => ["pending", "preparing"].includes(order.status);
  const getCancellationHint = (order) => {
    if (order.status === "pending") return "Full refund within 5 minutes before preparation starts.";
    if (order.status === "preparing") return "Refund available with 2% deduction.";
    return "";
  };
  const topSearchPlaceholder = activeTab === "menu"
    ? "Search menu items..."
    : activeTab === "orders"
      ? "Search your orders..."
      : activeTab === "billing"
        ? "Search invoices..."
        : "Search food, orders, invoices...";

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    favorite_food: "",
    profile_image: null,
  });

  useEffect(() => {
    setProfileForm({
      name: profile?.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
      email: profile?.email || user.email || "",
      phone: profile?.phone || user.phone || "",
      favorite_food: profile?.favorite_food || "",
      profile_image: null,
    });
  }, [profile, user]);

  const profilePreviewImage = useMemo(() => {
    if (profileForm.profile_image instanceof File) {
      return URL.createObjectURL(profileForm.profile_image);
    }
    return profile?.profile_image || null;
  }, [profile, profileForm.profile_image]);

  useEffect(() => {
    return () => {
      if (profilePreviewImage?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreviewImage);
      }
    };
  }, [profilePreviewImage]);

  return (
    <Shell brand="Employee Portal" title="Employee Dashboard" user={user} tabs={employeeTabs} activeTab={activeTab} onChangeTab={onChangeTab} onLogout={onLogout} cartItemCount={cartItemCount} onOpenCart={onOpenCart} searchValue={topSearch} onSearchChange={setTopSearch} searchPlaceholder={topSearchPlaceholder}>
      {activeTab === "overview" ? (
        <>
          {latestOpenPayment && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-[24px] border border-orange-200 bg-orange-50 px-6 py-4 text-orange-900 md:flex-row">
              <div>
                <strong className="text-lg font-bold">⚠ Outstanding Invoice Alert</strong>
                <p className="text-sm mt-1 text-orange-800">
                  Invoice <span className="font-semibold">{latestOpenPayment.invoice_number}</span> — Amount Due:{" "}
                  <span className="font-bold">৳{Number(latestOpenPayment.amount || 0).toFixed(2)}</span>. Please settle it to avoid disruption.
                </p>
              </div>
              <button onClick={() => { onChangeTab("billing"); }} className="shrink-0 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700">
                Pay Now
              </button>
            </div>
          )}

          <section className="grid gap-5 grid-cols-2">
            <StatCard title="Total Orders" value={totalOrders} helper="This month" accent="text-[#5b50d6]" />
            <StatCard title="Monthly Spending" value={`৳${monthlySpending.toFixed(2)}`} helper="Current billing period" accent="text-emerald-600" />
            <StatCard title="Pending Orders" value={pendingOrders} helper="Kitchen queue" accent="text-amber-600" />
            <StatCard title="Payment Status" value={currentStatus} helper={latestOpenPayment ? `Due: ৳${Number(latestOpenPayment.amount||0).toFixed(2)}` : "Current month"} accent="text-rose-600" />
          </section>

          <SectionCard title="Quick Order" subtitle="Order directly from here">
            <OrderBuilder menuItems={filteredMenuItems} cartItems={cartItems} changeQuantity={changeQuantity} />
          </SectionCard>

          <SectionCard title="Profile Snapshot" subtitle="Your account and canteen identity">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              {profilePreviewImage ? (
                <img src={profilePreviewImage} alt="Profile" className="h-28 w-28 rounded-[28px] object-cover" />
              ) : (
                <UploadPlaceholder label="Your photo" sublabel="Upload from profile settings" className="h-28 w-28 rounded-[28px]" />
              )}
              <div className="grid flex-1 gap-4 md:grid-cols-2">
                {[{ label: "Name", value: profile?.name || user.username }, { label: "Department", value: profile?.department_name || "Not assigned" }, { label: "Phone", value: profile?.phone || "Not provided" }, { label: "Shift", value: profile?.shift || "morning" }].map((field) => (
                  <div key={field.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{field.label}</p>
                    <p className="mt-2 text-lg font-semibold capitalize text-slate-900">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Pending Queue" subtitle="Orders still moving through the canteen">
              <div className="space-y-4">
                {pendingQueue.length ? pendingQueue.map((order) => (
                  <div key={order.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">ORD-{order.id}</p>
                        <p className="mt-1 text-sm text-slate-500">{new Date(order.order_date).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.items.map((item) => <span key={item.id} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{item.food_name} × {item.quantity}</span>)}
                    </div>
                  </div>
                )) : <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No pending orders right now.</div>}
              </div>
            </SectionCard>

            <SectionCard title="Order History" subtitle="Recent orders">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr><th className="pb-3">Order</th><th className="pb-3">Items</th><th className="pb-3">Date</th><th className="pb-3">Status</th><th className="pb-3">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.slice(0, 5).map((order) => (
                      <tr key={order.id}>
                        <td className="py-4 font-semibold text-slate-900">ORD-{order.id}</td>
                        <td className="py-4 text-slate-500">{order.items.length} items</td>
                        <td className="py-4 text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                        <td className="py-4"><StatusBadge status={order.status} /></td>
                        <td className="py-4 font-semibold text-slate-900">৳{order.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}

      {activeTab === "menu" ? (
        <SectionCard title="View Menu" subtitle="Browse all categories and add items to your cart">
          <div className="mb-5 flex items-center gap-3 rounded-[20px] border border-[#ede9ff] bg-[#f5f3ff] px-5 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5b50d6] text-white text-lg">🛒</span>
            <p className="text-sm text-[#5b50d6] font-medium">
              Choose your items below, adjust quantities, then tap the <strong>cart icon</strong> in the top bar to review and checkout.
            </p>
          </div>
          <OrderBuilder menuItems={filteredMenuItems} cartItems={cartItems} changeQuantity={changeQuantity} />
        </SectionCard>
      ) : null}

      {activeTab === "orders" ? (
        <SectionCard title="My Orders" subtitle="Complete order history">
          <div className="space-y-4">
            {data.orders.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No orders placed yet.</div>
            )}
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-[24px] border border-slate-200 bg-white p-5 transition hover:shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-slate-900">ORD-{order.id}</p>
                    <p className="mt-1 text-sm text-slate-500">{new Date(order.order_date).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 font-semibold text-slate-900">Tk{order.total_amount}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <span key={item.id} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                      {item.food_name} x {item.quantity}
                    </span>
                  ))}
                </div>
                {canCancelOrder(order) ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-amber-100 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Cancel available</p>
                      <p className="mt-1 text-xs text-amber-800">{getCancellationHint(order)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCancelOrder(order.id)}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                    >
                      Cancel Order
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "billing" ? (
        <>
          <SectionCard title="Payment Summary" subtitle="Your billing overview at a glance">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5b50d6]">Total Billed</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">৳{totalBilled.toFixed(2)}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Paid</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">৳{totalPaid.toFixed(2)}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Outstanding</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">৳{totalOutstanding.toFixed(2)}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Invoices" subtitle="Invoice history and payment actions">
            <div className="mb-5 flex flex-wrap gap-2">
              {['all', 'unpaid', 'paid'].map(f => (
                <button
                  key={f}
                  onClick={() => setBillingFilter(f)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${billingFilter === f ? "bg-[#5b50d6] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {searchedPayments.length === 0 && <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No invoices match this filter.</div>}
              {searchedPayments.map((payment) => (
                <div key={payment.id} className={`flex flex-col gap-4 rounded-[24px] border p-5 transition lg:flex-row lg:items-center lg:justify-between ${payment.status === 'paid' ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-slate-200'}`}>
                  <div>
                    <p className="font-mono text-lg font-semibold text-slate-900">{payment.invoice_number}</p>
                    <p className="mt-1 text-sm text-slate-500">Billing month: {new Date(payment.billing_month).toLocaleDateString()} • Method: {payment.payment_method}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <StatusBadge status={payment.status} />
                    <span className="text-lg font-semibold text-slate-900">৳{payment.amount}</span>
                    {getInvoiceUrl && (
                      <a
                        href={getInvoiceUrl(payment.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100"
                      >
                        <Receipt size={13} /> View Invoice
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}

      {activeTab === "profile" ? (
        <SectionCard title="Profile" subtitle="Keep your basic canteen profile updated">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onUpdateProfile(profileForm); }}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-semibold text-slate-600">Name</label>
                  <input className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#5b50d6]" placeholder="Full name" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-semibold text-slate-600">Email</label>
                  <input type="email" className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#5b50d6]" placeholder="Email address" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-semibold text-slate-600">Phone</label>
                  <input className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#5b50d6]" placeholder="Phone number" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-semibold text-slate-600">Favorite Food</label>
                  <input className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#5b50d6]" placeholder="Your favorite food" value={profileForm.favorite_food} onChange={(event) => setProfileForm((current) => ({ ...current, favorite_food: event.target.value }))} />
                </div>
              </div>
              <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition hover:border-[#5b50d6] hover:bg-[#f5f3ff]">
                <ImagePlus size={28} className="text-slate-400" />
                <p className="mt-4 text-sm font-semibold text-slate-700">Upload profile picture</p>
                <p className="mt-1 text-xs text-slate-400">Choose a JPG, PNG, or WEBP file</p>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => setProfileForm((current) => ({ ...current, profile_image: event.target.files?.[0] || null }))} />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button className="rounded-2xl bg-[#5b50d6] px-5 py-3 font-semibold text-white transition hover:bg-[#4638c4]">{isUploadingProfile ? "Saving..." : "Save Profile"}</button>
                <button type="button" onClick={() => setProfileForm({ name: profile?.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username, email: profile?.email || user.email || "", phone: profile?.phone || user.phone || "", favorite_food: profile?.favorite_food || "", profile_image: null })} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Reset</button>
              </div>
            </form>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <div className="ml-auto flex w-full justify-end">
                {profilePreviewImage ? (
                  <img src={profilePreviewImage} alt="Profile" className="h-40 w-40 rounded-[30px] object-cover shadow-sm" />
                ) : (
                  <UploadPlaceholder label="Profile photo" sublabel="Upload your own picture" className="h-40 w-40 rounded-[30px]" loading={isUploadingProfile} />
                )}
              </div>
              <div className="mt-8 space-y-4">
                {[
                  { label: "Name", value: profile?.name || user.username },
                  { label: "Email", value: profile?.email || user.email || "Not provided" },
                  { label: "Phone", value: profile?.phone || "Not provided" },
                  { label: "Favorite Food", value: profile?.favorite_food || "Not added yet" },
                ].map((field) => (
                  <div key={field.label} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{field.label}</p>
                    <p className="mt-2 break-words text-base font-semibold text-slate-900">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </Shell>
  );
}

function AdminDashboard({ user, data, activeTab, onChangeTab, onLogout, onCreateDepartment, onCreateMenu, onMarkPaid, onUpdateMenuImage, onUpdateMenu, onDeleteMenu, getInvoiceUrl }) {
  const [empSearch, setEmpSearch] = useState("");
  const [ordSearch, setOrdSearch] = useState("");
  const [paySearch, setPaySearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("");
  const [reportPaymentFilter, setReportPaymentFilter] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const deferredEmpSearch = useDeferredValue(empSearch);
  const deferredOrdSearch = useDeferredValue(ordSearch);
  const deferredPaySearch = useDeferredValue(paySearch);
  const deferredReportSearch = useDeferredValue(reportSearch);
  const adminTopSearch = activeTab === "employees" ? empSearch : activeTab === "orders" ? ordSearch : activeTab === "payments" ? paySearch : "";
  const adminTopSearchSetter = activeTab === "employees" ? setEmpSearch : activeTab === "orders" ? setOrdSearch : activeTab === "payments" ? setPaySearch : null;
  const adminTopSearchPlaceholder = activeTab === "employees"
    ? "Search employees..."
    : activeTab === "orders"
      ? "Search orders..."
      : activeTab === "payments"
        ? "Search payments..."
        : "Search admin data...";

  const filteredEmployees = data.employees.filter(e => {
    const q = deferredEmpSearch.toLowerCase();
    return !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.department_name?.toLowerCase().includes(q);
  });
  const filteredOrders = data.orders.filter(o => {
    const q = deferredOrdSearch.toLowerCase();
    return !q || String(o.id).includes(q) || o.employee_name?.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q);
  });
  const filteredPayments = data.payments.filter(p => {
    const q = deferredPaySearch.toLowerCase();
    return !q || p.invoice_number?.toLowerCase().includes(q) || p.employee_name?.toLowerCase().includes(q) || p.status?.toLowerCase().includes(q);
  });
  const [departmentForm, setDepartmentForm] = useState({ department_name: "", description: "" });
  const [menuForm, setMenuForm] = useState({ food_name: "", meal_type: "lunch", description: "", price: "", image: null, availability_date: "", is_available: true });
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [updatingImageId, setUpdatingImageId] = useState(null);
  const menuPreviewImage = useMemo(() => {
    if (menuForm.image instanceof File) {
      try {
        return URL.createObjectURL(menuForm.image);
      } catch (e) { return null; }
    }
    return null;
  }, [menuForm.image]);

  useEffect(() => {
    return () => {
      if (menuPreviewImage?.startsWith("blob:")) {
        URL.revokeObjectURL(menuPreviewImage);
      }
    };
  }, [menuPreviewImage]);

  useEffect(() => {
    if (activeTab !== "reports") return;
    let cancelled = false;

    const loadReportRows = async () => {
      setReportLoading(true);
      try {
        const rows = await fetchAdminOrderReports({
          start_date: reportStartDate,
          end_date: reportEndDate,
          status: reportStatusFilter,
          payment_method: reportPaymentFilter,
        });
        if (!cancelled) {
          setReportRows(rows);
        }
      } catch (error) {
        if (!cancelled) {
          setReportRows([]);
        }
      } finally {
        if (!cancelled) {
          setReportLoading(false);
        }
      }
    };

    loadReportRows();
    return () => {
      cancelled = true;
    };
  }, [activeTab, reportStartDate, reportEndDate, reportStatusFilter, reportPaymentFilter]);

  useEffect(() => {
    setReportPage(1);
  }, [deferredReportSearch, reportStatusFilter, reportPaymentFilter, reportStartDate, reportEndDate]);

  const searchedReportRows = reportRows.filter((row) => {
    const q = deferredReportSearch.trim().toLowerCase();
    if (!q) return true;
    return row.employee_name?.toLowerCase().includes(q) || String(row.order_id).includes(q);
  });
  const reportPageSize = 10;
  const reportTotalPages = Math.max(1, Math.ceil(searchedReportRows.length / reportPageSize));
  const safeReportPage = Math.min(reportPage, reportTotalPages);
  const pagedReportRows = searchedReportRows.slice((safeReportPage - 1) * reportPageSize, safeReportPage * reportPageSize);
  const reportSummary = searchedReportRows.reduce((acc, row) => {
    acc.quantity += Number(row.quantity || 0);
    acc.total += Number(row.total_price || 0);
    return acc;
  }, { quantity: 0, total: 0 });

  const exportReportCsv = () => {
    const headers = ["Order ID", "Employee Name", "Food Item(s)", "Quantity", "Total Price", "Payment Method", "Order Status", "Order Date & Time"];
    const rows = searchedReportRows.map((row) => [
      row.order_id,
      row.employee_name,
      row.food_items,
      row.quantity,
      row.total_price,
      row.payment_method,
      row.status,
      new Date(row.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `admin-order-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportReportPdf = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    const filterLabels = [
      reportStartDate ? `From: ${reportStartDate}` : null,
      reportEndDate ? `To: ${reportEndDate}` : null,
      reportStatusFilter ? `Status: ${reportStatusFilter}` : null,
      reportPaymentFilter ? `Payment: ${reportPaymentFilter}` : null,
    ].filter(Boolean).join(" | ");
    const tableRows = searchedReportRows.map((row, index) => `
      <tr style="background:${index % 2 === 0 ? "#ffffff" : "#f8fafc"}">
        <td>${row.order_id}</td>
        <td>${row.employee_name}</td>
        <td>${row.food_items}</td>
        <td>${row.quantity}</td>
        <td>৳${Number(row.total_price || 0).toFixed(2)}</td>
        <td>${row.payment_method}</td>
        <td>${row.status}</td>
        <td>${new Date(row.created_at).toLocaleString()}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Admin Order Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #0f172a; }
            .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 18px; }
            .brand { font-size: 26px; font-weight: 700; margin: 0; }
            .meta { text-align:right; color:#475569; font-size:12px; }
            .sub { color: #475569; margin: 6px 0 18px; font-size: 13px; }
            .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom: 18px; }
            .card { border:1px solid #dbe4ff; background:#f8faff; border-radius:14px; padding:14px; }
            .label { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#6366f1; font-weight:700; }
            .value { margin-top:6px; font-size:22px; font-weight:700; color:#0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
            th { background: #eef2ff; color: #4338ca; font-size: 11px; letter-spacing:0.08em; text-transform:uppercase; }
          </style>
        </head>
        <body>
          <div class="top">
            <div>
              <h1 class="brand">Canteen Pro</h1>
              <p class="sub">Admin Order & Sales Report</p>
            </div>
            <div class="meta">
              <div>Generated on ${new Date().toLocaleString()}</div>
              <div>${filterLabels || "All orders included"}</div>
            </div>
          </div>
          <div class="stats">
            <div class="card"><div class="label">Orders</div><div class="value">${searchedReportRows.length}</div></div>
            <div class="card"><div class="label">Items Sold</div><div class="value">${reportSummary.quantity}</div></div>
            <div class="card"><div class="label">Sales Total</div><div class="value">৳${reportSummary.total.toFixed(2)}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Employee</th>
                <th>Items</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Shell brand="Admin Control" title="Admin Dashboard" user={user} tabs={adminTabs} activeTab={activeTab} onChangeTab={onChangeTab} onLogout={onLogout} searchValue={adminTopSearch} onSearchChange={adminTopSearchSetter} searchPlaceholder={adminTopSearchPlaceholder}>
      {activeTab === "overview" ? (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Employees" value={data.stats?.total_employees || 0} helper="Active employees" accent="bg-indigo-50 text-indigo-700" />
            <StatCard title="Orders Today" value={data.stats?.total_orders_today || 0} helper="Current day activity" accent="bg-sky-50 text-sky-700" />
            <StatCard title="Revenue" value={`৳${Number(data.stats?.monthly_revenue || 0).toFixed(2)}`} helper="This month" accent="bg-emerald-50 text-emerald-700" />
            <StatCard title="Pending Queue" value={data.stats?.pending_orders || 0} helper="Awaiting kitchen action" accent="bg-amber-50 text-amber-700" />
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <SectionCard title="Recent Orders" subtitle="Latest orders tracking with status">
                <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="pb-3">Order</th><th className="pb-3">Employee</th><th className="pb-3">Status</th><th className="pb-3">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{data.orders.slice(0, 5).map((order) => <tr key={order.id}><td className="py-4 font-semibold text-slate-900">ORD-{order.id}</td><td className="py-4 text-slate-500">{order.employee_name}</td><td className="py-4"><StatusBadge status={order.status} /></td><td className="py-4 font-semibold text-slate-900">৳{order.total_amount}</td></tr>)}</tbody></table></div>
              </SectionCard>
              <SectionCard title="Employee Management" subtitle="View and monitor employee records">
                <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="pb-3">Employee</th><th className="pb-3">Department</th><th className="pb-3">Shift</th><th className="pb-3">Wallet</th></tr></thead><tbody className="divide-y divide-slate-100">{data.employees.slice(0, 5).map((employee) => <tr key={employee.id}><td className="py-4 font-semibold text-slate-900">{employee.name}</td><td className="py-4 text-slate-500">{employee.department_name || "Unassigned"}</td><td className="py-4 text-slate-500 capitalize">{employee.shift}</td><td className="py-4 text-slate-900">৳{employee.wallet_balance}</td></tr>)}</tbody></table></div>
              </SectionCard>
            </div>
            <SectionCard title="Overview" subtitle="Quick operational summary">
              <div className="space-y-4">{[{label:"Departments",value:data.stats?.total_departments || 0,icon:Building2},{label:"Menu Items",value:data.stats?.total_menu_items || 0,icon:Soup},{label:"Served Today",value:data.stats?.staff_served_today || 0,icon:ChefHat}].map((item) => { const Icon = item.icon; return <div key={item.label} className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-3"><div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600"><Icon size={18} /></div><span className="font-medium text-slate-700">{item.label}</span></div><span className="text-2xl font-bold text-slate-900">{item.value}</span></div>; })}</div>
            </SectionCard>
          </div>
        </>
      ) : null}

      {activeTab === "employees" ? (
        <SectionCard title="Employees" subtitle="Complete employee list">
          <div className="relative mb-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search by name, email or department..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEmployees.length === 0 && <div className="col-span-full rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No employees match your search.</div>}
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                <div className="mb-4 flex items-center gap-4">
                  {employee.profile_image ? (
                    <img src={employee.profile_image} alt={employee.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                      <User size={24} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="break-words text-lg font-semibold leading-6 text-slate-900">{employee.name}</p>
                    <p className="mt-1 break-words text-sm text-slate-500">{employee.department_name || "No department"}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-500">
                  <p className="break-all">Email: {employee.email}</p>
                  <p>Phone: {employee.phone || "N/A"}</p>
                  <p>Shift: <span className="capitalize">{employee.shift}</span></p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "departments" ? <SectionCard title="Departments" subtitle="Create and organize employee teams"><div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]"><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onCreateDepartment(departmentForm).then(() => setDepartmentForm({ department_name: "", description: "" })); }}><input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none" placeholder="Department name" value={departmentForm.department_name} onChange={(event) => setDepartmentForm((current) => ({ ...current, department_name: event.target.value }))} /><textarea className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none" placeholder="Description" value={departmentForm.description} onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))} /><button className="w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white">Add Department</button></form><div className="grid gap-4 md:grid-cols-2">{data.departments.map((department) => <div key={department.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"><p className="text-lg font-semibold text-slate-900">{department.department_name}</p><p className="mt-2 text-sm leading-6 text-slate-500">{department.description || "No description provided."}</p></div>)}</div></div></SectionCard> : null}

      {activeTab === "menu" ? (
        <SectionCard title="Menu Management" subtitle="Upload food pictures cleanly and keep every card readable">
          <div className="grid gap-6 2xl:grid-cols-[0.82fr_1.18fr]">
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (editingMenuId && !updatingImageId) {
                  onUpdateMenu(editingMenuId, menuForm).then(() => {
                    setMenuForm({ food_name: "", meal_type: "lunch", description: "", price: "", image: null, availability_date: "", is_available: true });
                    setEditingMenuId(null);
                  });
                } else {
                  onCreateMenu(menuForm).then(() =>
                    setMenuForm({ food_name: "", meal_type: "lunch", description: "", price: "", image: null, availability_date: "", is_available: true }),
                  );
                }
              }}
            >
              <div className="md:col-span-2 rounded-[28px] border border-slate-200 bg-slate-50 p-5 flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{editingMenuId && !updatingImageId ? "Edit menu item" : "Create a menu item"}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Add or edit the food name, price, meal type, description, and active visibility.</p>
                </div>
                {editingMenuId && !updatingImageId && (
                  <button type="button" onClick={() => { setEditingMenuId(null); setMenuForm({ food_name: "", meal_type: "lunch", description: "", price: "", image: null, availability_date: "", is_available: true }); }} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Cancel Edit</button>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Food name</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-violet-400"
                  placeholder="Vegetable Khichuri"
                  value={menuForm.food_name}
                  onChange={(event) => setMenuForm((current) => ({ ...current, food_name: event.target.value }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Meal type</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-violet-400"
                  value={menuForm.meal_type}
                  onChange={(event) => setMenuForm((current) => ({ ...current, meal_type: event.target.value }))}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Price</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-violet-400"
                  placeholder="220"
                  value={menuForm.price}
                  onChange={(event) => setMenuForm((current) => ({ ...current, price: event.target.value }))}
                />
              </div>

              <label className="md:col-span-2 block cursor-pointer overflow-hidden rounded-[28px] border border-slate-200 bg-white transition hover:border-violet-300">
                <div className="bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Food picture</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Upload a food image from your device. This keeps the admin layout clean and avoids overlapped text.</p>
                </div>
                <div className="border-t border-slate-200 p-4">
                  <UploadImageFrame
                    src={menuPreviewImage}
                    alt="Menu preview"
                    label="Upload food picture"
                    sublabel="The bordered image area stays clean until admin adds a photo"
                    className="h-56 w-full rounded-[22px] object-cover"
                  />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => setMenuForm((current) => ({ ...current, image: event.target.files?.[0] || null }))} />
              </label>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Availability date</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-violet-400"
                  placeholder="YYYY-MM-DD"
                  value={menuForm.availability_date}
                  onChange={(event) => setMenuForm((current) => ({ ...current, availability_date: event.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-violet-400"
                  placeholder="Comfort meal with lentils and vegetables"
                  value={menuForm.description}
                  onChange={(event) => setMenuForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Show in employee dashboard and landing page</p>
                  <p className="text-xs text-slate-400">Keep this on if you want the new food item to appear immediately for employees.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={menuForm.is_available !== false}
                    onChange={(event) => setMenuForm((current) => ({ ...current, is_available: event.target.checked }))}
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <button className="md:col-span-2 rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500">
                {editingMenuId && !updatingImageId ? "Save Changes" : "Add Menu Item"}
              </button>
            </form>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-900">Current menu cards</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Each card keeps a fixed picture zone and wraps long names properly, so the writing never overlaps the image or price.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {data.menuItems.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 p-4">
                      <UploadImageFrame
                        src={item.image}
                        alt={item.food_name}
                        label={item.food_name}
                        sublabel="No food image uploaded yet"
                        className="h-44 w-full rounded-[22px] object-cover"
                        loading={updatingImageId === item.id}
                      />
                    </div>
                    <div className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="max-w-[70%] break-words text-lg font-semibold leading-6 text-slate-900">{item.food_name}</h3>
                        <span className="shrink-0 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">${item.price}</span>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.meal_type_display}</p>
                      <p className="min-h-[48px] break-words text-sm leading-6 text-slate-500">{item.description || "No description added yet."}</p>
                      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-200">
                            Photo
                            <input type="file" accept="image/*" className="hidden" onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                setEditingMenuId(item.id); setUpdatingImageId(item.id);
                                onUpdateMenuImage(item.id, file).finally(() => { setUpdatingImageId(null); setEditingMenuId(null); event.target.value = ""; });
                              }
                            }} />
                          </label>
                          <button onClick={() => {
                            setEditingMenuId(item.id);
                            setMenuForm({ food_name: item.food_name, meal_type: item.meal_type, description: item.description || "", price: item.price, image: null, availability_date: item.availability_date || "", is_available: item.is_available !== false });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 transition hover:bg-indigo-100">Edit</button>
                          <button onClick={() => {
                            if (window.confirm(`Delete ${item.food_name}?`)) onDeleteMenu(item.id);
                          }} className="rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 transition hover:bg-rose-100">Delete</button>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active</span>
                          <div className="relative inline-flex items-center">
                            <input type="checkbox" className="sr-only peer" checked={item.is_available !== false} onChange={(e) => onUpdateMenu(item.id, { is_available: e.target.checked })} />
                            <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3"></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "orders" ? (
        <SectionCard title="Order Monitoring" subtitle="All employee orders">
          <div className="relative mb-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={ordSearch} onChange={e => setOrdSearch(e.target.value)} placeholder="Search by order ID, employee name or status..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white" />
          </div>
          <div className="space-y-4">
            {filteredOrders.length === 0 && <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No orders match your search.</div>}
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div><p className="text-lg font-semibold text-slate-900">ORD-{order.id} • {order.employee_name}</p><p className="mt-1 text-sm text-slate-500">{new Date(order.order_date).toLocaleString()}</p></div>
                  <div className="flex items-center gap-4"><StatusBadge status={order.status} /><span className="font-semibold text-slate-900">৳{order.total_amount}</span></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">{order.items.map((item) => <span key={item.id} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{item.food_name} × {item.quantity}</span>)}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "payments" ? (
        <SectionCard title="Payments" subtitle="Monthly bills and payment updates">
          <div className="relative mb-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={paySearch} onChange={e => setPaySearch(e.target.value)} placeholder="Search by invoice, employee name or status..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white" />
          </div>
          <div className="space-y-4">
            {filteredPayments.length === 0 && <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No payments match your search.</div>}
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{payment.employee_name}</p>
                  <p className="mt-1 text-sm text-slate-500">Invoice {payment.invoice_number} • ৳{payment.amount}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={payment.status} />
                  <span className="font-semibold text-slate-900">৳{payment.amount}</span>
                  {getInvoiceUrl && (
                    <a href={getInvoiceUrl(payment.id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition">
                      <Receipt size={12} /> Invoice
                    </a>
                  )}
                  {payment.status !== "paid" && (
                    <button onClick={() => onMarkPaid(payment.id)} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition">Mark Paid</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "reports" ? (
        <>
          <SectionCard title="Order & Sales Report" subtitle="Admin-only joined report with table filters, pagination, and professional export">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_0.9fr_auto_auto]">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  placeholder="Search by employee or order ID..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white"
                />
              </div>
              <input type="date" value={reportStartDate} onChange={(event) => setReportStartDate(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white" />
              <input type="date" value={reportEndDate} onChange={(event) => setReportEndDate(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white" />
              <select value={reportStatusFilter} onChange={(event) => setReportStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="served">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={reportPaymentFilter} onChange={(event) => setReportPaymentFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white">
                <option value="">All Payments</option>
                <option value="sslcommerz">SSLCommerz</option>
                <option value="cash">Cash</option>
                <option value="monthly_bill">Monthly Bill</option>
                <option value="wallet">Wallet</option>
                <option value="card">Card</option>
              </select>
              <button onClick={exportReportCsv} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">Export CSV</button>
              <button onClick={exportReportPdf} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Export PDF</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Matching Orders</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{searchedReportRows.length}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total Quantity</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{reportSummary.quantity}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total Sales</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">৳{reportSummary.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
              <div className="max-h-[560px] overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Order ID</th>
                      <th className="px-4 py-4 font-semibold">Employee</th>
                      <th className="px-4 py-4 font-semibold">Items</th>
                      <th className="px-4 py-4 font-semibold">Qty</th>
                      <th className="px-4 py-4 font-semibold">Price</th>
                      <th className="px-4 py-4 font-semibold">Payment</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-4 py-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-slate-400">Loading report data...</td>
                      </tr>
                    ) : pagedReportRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-slate-400">No orders match the selected filters.</td>
                      </tr>
                    ) : (
                      pagedReportRows.map((row, index) => (
                        <tr key={`${row.order_id}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                          <td className="px-4 py-4 font-semibold text-slate-900">#{row.order_id}</td>
                          <td className="px-4 py-4 text-slate-700">{row.employee_name}</td>
                          <td className="px-4 py-4 text-slate-600">{row.food_items || "—"}</td>
                          <td className="px-4 py-4 font-semibold text-slate-900">{row.quantity}</td>
                          <td className="px-4 py-4 font-semibold text-slate-900">৳{Number(row.total_price || 0).toFixed(2)}</td>
                          <td className="px-4 py-4 text-slate-600">{row.payment_method}</td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                              row.status_key === "served"
                                ? "bg-emerald-100 text-emerald-700"
                                : row.status_key === "cancelled"
                                  ? "bg-rose-100 text-rose-700"
                                  : row.status_key === "preparing"
                                    ? "bg-sky-100 text-sky-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{new Date(row.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-500">Page {safeReportPage} of {reportTotalPages}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setReportPage((current) => Math.max(1, current - 1))}
                  disabled={safeReportPage === 1}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setReportPage((current) => Math.min(reportTotalPages, current + 1))}
                  disabled={safeReportPage === reportTotalPages}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}
    </Shell>
  );
}

function StaffDashboard({ user, data, activeTab, onChangeTab, onLogout, onUpdateStatus, onUpdatePayment }) {
  const [orderSearch, setOrderSearch] = useState("");
  const deferredOrderSearch = useDeferredValue(orderSearch);
  const pending = data.orders.filter((order) => order.status === "pending").length;
  const preparing = data.orders.filter((order) => order.status === "preparing").length;
  const served = data.orders.filter((order) => order.status === "served").length;

  const searchedOrders = data.orders.filter(o => {
    const q = deferredOrderSearch.toLowerCase();
    return !q || String(o.id).includes(q) || o.employee_name?.toLowerCase().includes(q) || o.department_name?.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q);
  });

  return (
    <Shell brand="Canteen Operations" title="Canteen Staff Dashboard" user={user} tabs={staffTabs} activeTab={activeTab} onChangeTab={onChangeTab} onLogout={onLogout} searchValue={orderSearch} onSearchChange={setOrderSearch} searchPlaceholder="Search staff orders...">
      {activeTab === "overview" ? (
        <>
          <section className="grid gap-5 md:grid-cols-3">
            <StatCard title="Incoming Orders" value={pending} helper="Waiting in queue" accent="bg-amber-50 text-amber-700" />
            <StatCard title="Preparing" value={preparing} helper="Currently in kitchen" accent="bg-sky-50 text-sky-700" />
            <StatCard title="Served" value={served} helper="Completed today" accent="bg-emerald-50 text-emerald-700" />
          </section>
          <SectionCard title="Live Queue" subtitle="Orders requiring staff attention">
            <div className="space-y-4">
              {data.orders.slice(0, 6).map((order) => (
                <div key={order.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">ORD-{order.id} • {order.employee_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{new Date(order.order_date).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      {order.status === "pending" && <button onClick={() => onUpdateStatus(order.id, "preparing")} className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition">Start Preparing</button>}
                      {order.status === "preparing" && <button onClick={() => onUpdateStatus(order.id, "served")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition">Mark Served</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}

      {activeTab === "incoming" ? (
        <SectionCard title="Incoming Orders" subtitle="Full order queue — confirm cash payments and manage workflow">
          {/* Search bar */}
          <div className="relative mb-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
              placeholder="Search by order ID, employee name, department or status..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white"
            />
          </div>
          <div className="space-y-4">
            {searchedOrders.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No orders match your search.</div>
            )}
            {searchedOrders.map((order) => {
              const cashPayments = order.payments?.filter(p => p.payment_method === "cash") || [];
              const unpaidCashPayment = cashPayments.find(p => p.status === "unpaid");
              return (
                <div key={order.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">ORD-{order.id} • {order.employee_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{order.department_name || "No department"} • {new Date(order.order_date).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={order.status} />
                      <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 border border-slate-200">৳{order.total_amount}</span>
                      {unpaidCashPayment && (
                        <button
                          onClick={() => onUpdatePayment(unpaidCashPayment.id, { status: "paid", payment_method: "cash" })}
                          className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition"
                        >
                          ✓ Confirm Cash
                        </button>
                      )}
                      {order.status === "pending" && (
                        <button onClick={() => onUpdateStatus(order.id, "preparing")} className="rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition">Preparing</button>
                      )}
                      {order.status === "preparing" && (
                        <button onClick={() => onUpdateStatus(order.id, "served")} className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">Served</button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.items.map((item) => <span key={item.id} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{item.food_name} × {item.quantity}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "operations" ? (
        <SectionCard title="Daily Food Operations" subtitle="Kitchen workload snapshot">
          <div className="grid gap-5 md:grid-cols-3">
            {[{label:"Pending",value:pending,desc:"Need to start",color:"text-amber-700",bg:"bg-amber-50"},{label:"Preparing",value:preparing,desc:"In progress",color:"text-sky-700",bg:"bg-sky-50"},{label:"Served",value:served,desc:"Completed",color:"text-emerald-700",bg:"bg-emerald-50"}].map((item) => (
              <div key={item.label} className={`rounded-[28px] border border-slate-200 ${item.bg} p-6`}>
                <p className={`text-sm uppercase tracking-[0.25em] font-bold ${item.color}`}>{item.label}</p>
                <p className="mt-3 text-5xl font-bold text-slate-900">{item.value}</p>
                <p className="mt-3 text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </Shell>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("landing");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [publicDataLoaded, setPublicDataLoaded] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [paymentResult, setPaymentResult] = useState(() => readPaymentResultFromUrl());

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("canteen_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  const cartItemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const menuItemLookup = useMemo(() => data.menuItems.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {}), [data.menuItems]);
  const checkoutItems = useMemo(() => cartItems.map((item) => ({
    ...item,
    food_name: menuItemLookup[item.menu_item]?.food_name,
    price: Number(menuItemLookup[item.menu_item]?.price || 0),
  })), [cartItems, menuItemLookup]);

  const changeQuantity = (menuItemId, quantity) => {
    quantity = Math.max(0, quantity);
    setCartItems(current => {
      let next;
      const existing = current.find(i => i.menu_item === menuItemId);
      if (!existing && quantity > 0) next = [...current, { menu_item: menuItemId, quantity }];
      else if (existing && quantity === 0) next = current.filter(i => i.menu_item !== menuItemId);
      else next = current.map(i => i.menu_item === menuItemId ? { ...i, quantity } : i);
      
      localStorage.setItem("canteen_cart", JSON.stringify(next));
      return next;
    });
  };

  const cartSubtotal = cartItems.reduce((sum, item) => sum + Number(menuItemLookup[item.menu_item]?.price || 0) * item.quantity, 0);
  const cartTax = cartSubtotal * 0.05;
  const cartTotal = cartSubtotal + cartTax;

  const hasCheckoutIntent = () => {
    try {
      return localStorage.getItem(CHECKOUT_INTENT_KEY) === "true";
    } catch {
      return false;
    }
  };

  const clearCheckoutIntent = () => {
    try {
      localStorage.removeItem(CHECKOUT_INTENT_KEY);
    } catch {
      // ignore storage issues
    }
  };

  const setCheckoutIntent = () => {
    try {
      localStorage.setItem(CHECKOUT_INTENT_KEY, "true");
    } catch {
      // ignore storage issues
    }
  };

  const openCheckoutAfterAuth = (currentUser) => {
    if (currentUser?.role !== "employee") {
      clearCheckoutIntent();
      return;
    }
    if (!cartItems.length) {
      clearCheckoutIntent();
      return;
    }
    setIsCartSidebarOpen(false);
    setIsCheckoutOpen(true);
    clearCheckoutIntent();
  };

  const handleCheckoutRequest = () => {
    if (!cartItems.length) return;
    if (!user) {
      setCheckoutIntent();
      setIsCartSidebarOpen(false);
      setView("login");
      setMessage("Please sign in to continue to payment.");
      return;
    }
    setIsCartSidebarOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleConfirmOrder = async ({ method, paymentDetails }) => {
    const employeeId = String(user.employee_profile?.id || data.employees[0]?.id || "");
    const payload = { 
      employee: employeeId, 
      items: cartItems, 
      notes: `Payment: ${method}${paymentDetails ? ` (Details provided)` : ""}`,
      payment_method: method 
    };
    
    try {
      const order = await createOrder(payload);
      setCartItems([]);
      localStorage.removeItem("canteen_cart");
      
      if (["card", "mobile", "sslcommerz"].includes(method)) {
        if (order.latest_payment_id) {
          try {
            await handleStartPayment(order.latest_payment_id);
          } catch (payErr) {
            console.error("Payment initiation failed:", payErr);
            setMessage("Order placed, but redirected to dashboard. You can complete payment from 'My Orders' anytime.");
            await loadPrivateData(user);
          }
        } else {
          setMessage("Order placed. Please complete payment from your dashboard.");
          await loadPrivateData(user);
        }
      } else {
        await loadPrivateData(user);
        setMessage("Order placed successfully.");
      }
      return order;
    } catch (err) {
      const msg = getApiError(err, "Failed to place order.");
      setError(msg);
      throw err;
    }
  };

  const roleTabs = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return adminTabs;
    if (user.role === "staff") return staffTabs;
    return employeeTabs;
  }, [user]);

  const loadPublicData = async () => {
    setPublicDataLoaded(false);
    try {
      const requests = [fetchDepartments(), fetchMenuItems()];
      const [departments, menuItems] = await Promise.all(requests);
      setData((current) => ({ ...current, departments, menuItems }));
      localStorage.setItem(PUBLIC_DEPARTMENTS_CACHE_KEY, JSON.stringify(departments));
      localStorage.setItem(PUBLIC_MENU_CACHE_KEY, JSON.stringify(menuItems));
    } catch {
      try {
        const cachedDepartments = JSON.parse(localStorage.getItem(PUBLIC_DEPARTMENTS_CACHE_KEY) || "[]");
        const cachedMenuItems = JSON.parse(localStorage.getItem(PUBLIC_MENU_CACHE_KEY) || "[]");
        if (cachedDepartments.length || cachedMenuItems.length) {
          setData((current) => ({
            ...current,
            departments: current.departments.length ? current.departments : cachedDepartments,
            menuItems: current.menuItems.length ? current.menuItems : cachedMenuItems,
          }));
        }
      } catch {
        // keep auth screen usable
      }
    } finally {
      setPublicDataLoaded(true);
    }
  };

  const refreshMenuAndDepartments = async () => {
    const [departments, menuItems] = await Promise.all([fetchDepartments(), fetchMenuItems()]);
    setData((current) => ({ ...current, departments, menuItems }));
  };

  const refreshOrdersAndPayments = async () => {
    const [orders, payments] = await Promise.all([fetchOrders(), fetchPayments()]);
    setData((current) => ({ ...current, orders, payments }));
  };

  const refreshEmployees = async () => {
    const employees = await fetchEmployees();
    setData((current) => ({ ...current, employees }));
  };

  const refreshAdminSummary = async () => {
    const [stats, daily, monthly, weekly] = await Promise.all([
      fetchDashboardStats(),
      fetchDailyReport(),
      fetchMonthlyReport(),
      fetchWeeklyTrends(),
    ]);
    setData((current) => ({
      ...current,
      stats,
      reports: { daily, monthly, weekly },
    }));
  };

  const refreshStaffSummary = async () => {
    const stats = await fetchDashboardStats();
    setData((current) => ({ ...current, stats }));
  };

  const refreshEmployeeProfile = async () => {
    const employeeProfile = await fetchMyEmployeeProfile();
    setData((current) => ({
      ...current,
      employeeProfile,
      employees: employeeProfile ? [employeeProfile] : [],
    }));
    return employeeProfile;
  };

  const loadPrivateData = async (currentUser) => {
    setLoading(true);
    try {
      const requests = [fetchDepartments(), fetchMenuItems(), fetchOrders(), fetchPayments()];
      if (currentUser.role === "admin") {
        requests.push(fetchEmployees(), fetchDashboardStats(), fetchDailyReport(), fetchMonthlyReport(), fetchWeeklyTrends());
      } else if (currentUser.role === "staff") {
        requests.push(fetchDashboardStats());
      } else {
        requests.push(fetchMyEmployeeProfile());
      }
      const [departments, menuItems, orders, payments, extra1, extra2, extra3, extra4, extra5] = await Promise.all(requests);
      if (currentUser.role === "admin") {
        setData({ departments, menuItems, orders, payments, employees: extra1, stats: extra2, reports: { daily: extra3, monthly: extra4, weekly: extra5 }, employeeProfile: currentUser.employee_profile || null });
      } else if (currentUser.role === "staff") {
        setData({ departments, menuItems, orders, payments, employees: [], stats: extra1, reports: { daily: null, monthly: null, weekly: null }, employeeProfile: null });
      } else {
        setData({ departments, menuItems, orders, payments, employees: extra1 ? [extra1] : [], stats: null, reports: { daily: null, monthly: null, weekly: null }, employeeProfile: extra1 || null });
      }
      setError("");
    } catch (err) {
      setError(getApiError(err, "Unable to load dashboard data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      await loadPublicData();
      try {
        const profile = await fetchProfile();
        setUser(profile);
        setActiveTab("overview");
        await loadPrivateData(profile);
      } catch {
        clearTokens();
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!paymentResult) return;
    if (paymentResult.status === "success") {
      setMessage(`Payment completed${paymentResult.invoice ? ` for ${paymentResult.invoice}` : ""}.`);
    } else if (paymentResult.status === "failed") {
      setError(`Payment failed${paymentResult.invoice ? ` for ${paymentResult.invoice}` : ""}.`);
    } else if (paymentResult.status === "cancelled") {
      setError(`Payment cancelled${paymentResult.invoice ? ` for ${paymentResult.invoice}` : ""}.`);
    }
  }, [paymentResult]);

  useEffect(() => {
    if (user && paymentResult?.status === "success") {
      loadPrivateData(user);
    }
  }, [user, paymentResult]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    setError("");
    try {
      const response = await login(credentials);
      setUser(response.user);

      const shouldOpenCheckout = hasCheckoutIntent() && cartItems.length > 0;
      setActiveTab("overview");
      setMessage("Signed in successfully.");
      await loadPrivateData(response.user);
      if (shouldOpenCheckout) {
        openCheckoutAfterAuth(response.user);
      }
    } catch (err) {
      setError(getApiError(err, "Login failed."));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    setAuthLoading(true);
    setError("");
    try {
      const response = await register(payload);
      setUser(response.user);
      const shouldOpenCheckout = hasCheckoutIntent() && cartItems.length > 0;
      setActiveTab("overview");
      setMessage("Registration completed successfully.");
      await loadPrivateData(response.user);
      if (shouldOpenCheckout) {
        openCheckoutAfterAuth(response.user);
      }
    } catch (err) {
      setError(getApiError(err, "Registration failed."));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setData(initialData);
    setActiveTab("overview");
    setView("landing"); // Explicitly return to Landing Page
    clearCheckoutIntent();
    setMessage("");
    setError("");
    await loadPublicData();
  };

  const handleDismissPaymentResult = () => {
    setPaymentResult(null);
    window.history.replaceState({}, document.title, window.location.pathname);
    if (!user) {
      setView("landing");
    }
  };

  const handleCreateDepartment = async (payload) => {
    await createDepartment(payload);
    setMessage("Department added successfully.");
    await Promise.all([refreshMenuAndDepartments(), refreshEmployees(), refreshAdminSummary()]);
  };

  const handleCreateMenu = async (payload) => {
    await createMenuItem(buildFormData(payload));
    setMessage("Menu item added successfully.");
    await Promise.all([refreshMenuAndDepartments(), refreshAdminSummary()]);
  };

  const handleUpdateMenuImage = async (menuItemId, file) => {
    try {
      await updateMenuItem(menuItemId, buildFormData({ image: file }));
      setMessage("Menu image updated successfully.");
      setError("");
      await refreshMenuAndDepartments();
    } catch (err) {
      setError(getApiError(err, "Unable to update menu image."));
    }
  };

  const handleDeleteMenu = async (id) => {
    try {
      await deleteMenuItem(id);
      setMessage("Menu item deleted.");
      await Promise.all([refreshMenuAndDepartments(), refreshAdminSummary()]);
    } catch (err) {
      setError(getApiError(err, "Delete failed."));
    }
  };

  const handleUpdateMenu = async (id, payload) => {
    try {
      // Use JSON (not FormData) for boolean/text-only payloads so booleans aren't coerced to strings
      const hasFile = Object.values(payload).some((v) => v instanceof File);
      const body = hasFile ? buildFormData(payload) : payload;
      await updateMenuItem(id, body);
      setMessage("Menu item updated.");
      await Promise.all([refreshMenuAndDepartments(), refreshAdminSummary()]);
    } catch (err) {
      setError(getApiError(err, "Update failed."));
    }
  };

  const handleUpdatePaymentDirect = async (paymentId, payload) => {
    try {
      await updatePayment(paymentId, payload);
      setMessage("Payment updated successfully.");
      await Promise.all([refreshOrdersAndPayments(), refreshStaffSummary()]);
    } catch (err) {
      setError(getApiError(err, "Payment update failed."));
    }
  };

  const handlePlaceOrder = async (payload) => {
    await createOrder(payload);
    setMessage("Order placed successfully.");
    await Promise.all([refreshOrdersAndPayments(), refreshEmployeeProfile()]);
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    await updateOrderStatus(orderId, { status });
    setMessage("Order status updated.");
    await Promise.all([refreshOrdersAndPayments(), refreshStaffSummary()]);
  };

  const handleMarkPaid = async (paymentId) => {
    await updatePayment(paymentId, { status: "paid", payment_method: "monthly_bill" });
    setMessage("Payment marked as paid.");
    await Promise.all([refreshOrdersAndPayments(), refreshAdminSummary()]);
  };

  const handleUpdateProfile = async (payload) => {
    setIsUploadingProfile(true);
    try {
      await updateMyEmployeeProfile(buildFormData(payload));
      setMessage("Profile updated successfully.");
      setError("");
      const refreshedUser = await fetchProfile();
      setUser(refreshedUser);
      await Promise.all([refreshOrdersAndPayments(), refreshMenuAndDepartments(), refreshEmployeeProfile()]);
    } catch (err) {
      setError(getApiError(err, "Unable to update profile."));
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const handleStartPayment = async (paymentId) => {
    try {
      const response = await initiateSslPayment(paymentId);
      if (response?.payment_url) {
        window.location.href = response.payment_url;
        return;
      }
      setError("Payment gateway did not return a payment URL.");
    } catch (err) {
      setError(getApiError(err, "Unable to start SSLCommerz payment."));
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await cancelOrder(orderId);
      await refreshOrdersAndPayments();
      const refund = response?.refund;
      if (refund?.refund_amount && Number(refund.refund_amount) > 0) {
        setMessage(`Order cancelled. Refund: Tk ${Number(refund.refund_amount).toFixed(2)}.`);
      } else {
        setMessage("Order cancelled successfully.");
      }
    } catch (err) {
      setError(getApiError(err, "Unable to cancel this order."));
    }
  };

  if (paymentResult) {
    return (
      <>
        {message ? <div className="fixed right-4 top-4 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">{message}</div> : null}
        {error ? <div className="fixed left-4 top-4 z-50 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div> : null}
        <PaymentResultScreen result={paymentResult} user={user} onContinue={handleDismissPaymentResult} />
      </>
    );
  }

  if (!user) {
    if (view === "landing") {
      return (
        <>
          {message ? <div className="fixed right-4 top-4 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">{message}</div> : null}
          {error ? <div className="fixed left-4 top-4 z-50 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div> : null}
          <LandingPage 
            onNavigate={setView} 
            menuItems={data.menuItems} 
            cartItems={cartItems} 
            changeQuantity={changeQuantity} 
            onOpenCart={() => setIsCartSidebarOpen(true)}
            cartItemCount={cartItemCount}
            isLoading={!publicDataLoaded}
          />
          <CartSidebar 
            isOpen={isCartSidebarOpen} 
            onClose={() => setIsCartSidebarOpen(false)} 
            cartItems={cartItems} 
            changeQuantity={changeQuantity} 
            itemLookup={menuItemLookup} 
            subtotal={cartSubtotal} 
            tax={cartTax} 
            total={cartTotal} 
            onProceed={handleCheckoutRequest} 
          />
        </>
      );
    }
    return (
      <>
        {error ? <div className="fixed left-4 top-4 z-50 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div> : null}
        <AuthScreen 
          onLogin={handleLogin} 
          onRegister={handleRegister} 
          departments={data.departments} 
          loading={authLoading} 
          error={error} 
          initialMode={view === "register" ? "register" : "login"}
          onBack={() => setView("landing")}
        />
      </>
    );
  }

  return (
    <>
      {message ? <div className="fixed right-4 top-4 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">{message}</div> : null}
      {error ? <div className="fixed left-4 top-4 z-50 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div> : null}
      {loading ? <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] text-slate-500">Loading dashboard...</main> : null}
      {!loading && user.role === "employee" ? <EmployeeDashboard user={user} data={data} activeTab={activeTab} onChangeTab={setActiveTab} onLogout={handleLogout} onStartPayment={handleStartPayment} onCancelOrder={handleCancelOrder} onUpdateProfile={handleUpdateProfile} isUploadingProfile={isUploadingProfile} cartItems={cartItems} changeQuantity={changeQuantity} cartItemCount={cartItemCount} onOpenCart={() => setIsCartSidebarOpen(true)} getInvoiceUrl={getInvoiceUrl} /> : null}
      {!loading && user.role === "admin" ? <AdminDashboard user={user} data={data} activeTab={activeTab} onChangeTab={setActiveTab} onLogout={handleLogout} onCreateDepartment={handleCreateDepartment} onCreateMenu={handleCreateMenu} onMarkPaid={handleMarkPaid} onUpdateMenuImage={handleUpdateMenuImage} onDeleteMenu={handleDeleteMenu} onUpdateMenu={handleUpdateMenu} getInvoiceUrl={getInvoiceUrl} /> : null}
      {!loading && user.role === "staff" ? <StaffDashboard user={user} data={data} activeTab={activeTab} onChangeTab={setActiveTab} onLogout={handleLogout} onUpdateStatus={handleUpdateOrderStatus} onUpdatePayment={handleUpdatePaymentDirect} /> : null}

      <CartSidebar isOpen={isCartSidebarOpen} onClose={() => setIsCartSidebarOpen(false)} cartItems={cartItems} changeQuantity={changeQuantity} itemLookup={menuItemLookup} subtotal={cartSubtotal} tax={cartTax} total={cartTotal} onProceed={handleCheckoutRequest} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} cartItems={checkoutItems} subtotal={cartSubtotal} tax={cartTax} total={cartTotal} onConfirmOrder={handleConfirmOrder} />
    </>
  );
}
