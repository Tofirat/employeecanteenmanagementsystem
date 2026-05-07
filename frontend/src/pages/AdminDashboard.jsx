import { useEffect, useMemo, useState } from "react";
import { Building2, ChefHat, ClipboardList, CreditCard, LayoutDashboard, Receipt, Soup, Users, Plus, Search, ChevronLeft, ChevronRight, X, Edit, Trash2 } from "lucide-react";
import Shell from "../components/dashboard/Shell";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import UploadPlaceholder from "../components/UploadPlaceholder";
import UploadImageFrame from "../components/UploadImageFrame";

const adminTabs = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "employees", label: "Employees", icon: Users },
  { key: "departments", label: "Departments", icon: Building2 },
  { key: "menu", label: "Menu", icon: Soup },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "reports", label: "Reports", icon: Receipt },
];

function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 bg-slate-50">
      <span className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-700">{currentPage}</span> of <span className="font-semibold text-slate-700">{totalPages}</span>
      </span>
      <div className="flex gap-2">
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
        >
          <ChevronLeft size={18} />
        </button>
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard({ user, data, activeTab, onChangeTab, onLogout, onCreateDepartment, onCreateMenu, onMarkPaid, onUpdateMenuImage }) {
  // Forms & Modals
  const [departmentForm, setDepartmentForm] = useState({ department_name: "", description: "" });
  const [isDepartmentModalOpen, setDepartmentModalOpen] = useState(false);

  const [menuForm, setMenuForm] = useState({ food_name: "", meal_type: "lunch", description: "", price: "", image: null, availability_date: "" });
  const [isMenuModalOpen, setMenuModalOpen] = useState(false);

  // Loaders & Interactivity
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [updatingImageId, setUpdatingImageId] = useState(null);

  // Pagination & Search States
  const [searchEmployees, setSearchEmployees] = useState("");
  const [employeePage, setEmployeePage] = useState(1);

  const [searchMenu, setSearchMenu] = useState("");
  const [menuPage, setMenuPage] = useState(1);

  const [orderFilter, setOrderFilter] = useState("all");
  const [orderPage, setOrderPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  const menuPreviewImage = useMemo(() => (menuForm.image instanceof File ? URL.createObjectURL(menuForm.image) : null), [menuForm.image]);

  useEffect(() => () => {
    if (menuPreviewImage?.startsWith("blob:")) URL.revokeObjectURL(menuPreviewImage);
  }, [menuPreviewImage]);

  // Filters
  const filteredEmployees = useMemo(() => {
    return data.employees.filter((emp) => emp.name?.toLowerCase().includes(searchEmployees.toLowerCase()) || emp.email?.toLowerCase().includes(searchEmployees.toLowerCase()));
  }, [data.employees, searchEmployees]);

  const filteredMenu = useMemo(() => {
    return data.menuItems.filter((item) => item.food_name?.toLowerCase().includes(searchMenu.toLowerCase()) || item.meal_type?.toLowerCase().includes(searchMenu.toLowerCase()));
  }, [data.menuItems, searchMenu]);

  const filteredOrders = useMemo(() => {
    return data.orders.filter((order) => orderFilter === "all" || order.status === orderFilter);
  }, [data.orders, orderFilter]);

  // Paginated Data
  const paginatedEmployees = filteredEmployees.slice((employeePage - 1) * ITEMS_PER_PAGE, employeePage * ITEMS_PER_PAGE);
  const paginatedMenu = filteredMenu.slice((menuPage - 1) * ITEMS_PER_PAGE, menuPage * ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ITEMS_PER_PAGE, orderPage * ITEMS_PER_PAGE);

  return (
    <Shell brand="Admin Control" title="Admin Dashboard" user={user} tabs={adminTabs} activeTab={activeTab} onChangeTab={onChangeTab} onLogout={onLogout}>
      {activeTab === "overview" ? (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border border-indigo-100">
              <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-indigo-100/50 blur-2xl transition-all group-hover:bg-indigo-200/50"></div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-100 px-3 py-2 text-indigo-600">
                <Users size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total Employees</span>
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900">{data.stats?.total_employees || 0}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Active platform users</p>
            </div>

            <div className="group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border border-emerald-100">
              <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl transition-all group-hover:bg-emerald-200/50"></div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-3 py-2 text-emerald-600">
                <ClipboardList size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Orders Today</span>
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900">{data.stats?.total_orders_today || 0}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Current day activity</p>
            </div>

            <div className="group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border border-sky-100">
              <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-sky-100/50 blur-2xl transition-all group-hover:bg-sky-200/50"></div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-sky-100 px-3 py-2 text-sky-600">
                <CreditCard size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Total Revenue</span>
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900">${Number(data.stats?.monthly_revenue || 0).toFixed(2)}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">This month</p>
            </div>

            <div className="group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border border-amber-100">
              <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-amber-100/50 blur-2xl transition-all group-hover:bg-amber-200/50"></div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-amber-100 px-3 py-2 text-amber-600">
                <ChefHat size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Queue</span>
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900">{data.stats?.pending_orders || 0}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Awaiting kitchen action</p>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard title="Employee Management" subtitle="Recent employees overview">
              <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                    <tr><th className="px-5 py-4">Employee</th><th className="px-5 py-4">Department</th><th className="px-5 py-4">Shift</th><th className="px-5 py-4">Wallet</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.employees.slice(0, 5).map((employee) => (
                      <tr key={employee.id} className="transition hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-bold text-slate-900">{employee.name}</td>
                        <td className="px-5 py-4 text-slate-500">{employee.department_name || "Unassigned"}</td>
                        <td className="px-5 py-4 text-slate-500 capitalize">{employee.shift}</td>
                        <td className="px-5 py-4 text-slate-900 font-semibold">${employee.wallet_balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
            <SectionCard title="Quick Overview" subtitle="High altitude operational metrics">
              <div className="space-y-4">
                {[
                  { label: "Departments", value: data.stats?.total_departments || 0, icon: Building2 }, 
                  { label: "Menu Items", value: data.stats?.total_menu_items || 0, icon: Soup }, 
                  { label: "Served Today", value: data.stats?.staff_served_today || 0, icon: ChefHat }
                ].map((item) => { 
                  const Icon = item.icon; 
                  return (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><Icon size={20} /></div>
                        <span className="font-bold text-slate-700">{item.label}</span>
                      </div>
                      <span className="text-2xl font-extrabold text-slate-900">{item.value}</span>
                    </div>
                  ); 
                })}
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}

      {activeTab === "employees" ? (
        <SectionCard title="Employees" subtitle="Complete employee administrative list">
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 w-full md:w-96 rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-100">
              <Search size={18} className="text-slate-400" />
              <input 
                className="w-full bg-transparent text-sm text-slate-700 outline-none" 
                placeholder="Search employees by name or email..." 
                value={searchEmployees}
                onChange={(e) => {setSearchEmployees(e.target.value); setEmployeePage(1);}}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {paginatedEmployees.map((employee) => (
              <div key={employee.id} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex flex-col items-center text-center">
                  {employee.profile_image ? (
                    <img src={employee.profile_image} alt={employee.name} className="h-20 w-20 rounded-full object-cover shadow-sm mb-4" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-2xl shadow-sm mb-4">
                      {(employee.name?.[0] || "E").toUpperCase()}
                    </div>
                  )}
                  <p className="text-lg font-bold text-slate-900">{employee.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mt-1 bg-indigo-50 px-3 py-1 rounded-full">{employee.department_name || "Unassigned"}</p>
                </div>
                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <p className="flex justify-between"><span>Email:</span> <span className="font-medium text-slate-900 truncate ml-2" title={employee.email}>{employee.email}</span></p>
                  <p className="flex justify-between"><span>Phone:</span> <span className="font-medium text-slate-900">{employee.phone || "N/A"}</span></p>
                  <p className="flex justify-between"><span>Shift:</span> <span className="font-medium text-slate-900 capitalize">{employee.shift}</span></p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Pagination currentPage={employeePage} totalItems={filteredEmployees.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setEmployeePage} />
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "departments" ? (
        <SectionCard title="Departments" subtitle="Create and organize employee teams">
          <div className="mb-6 flex justify-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <button onClick={() => setDepartmentModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500">
                <Plus size={18} /> Add Department
             </button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.departments.map((department) => (
              <div key={department.id} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                <div className="flex items-center gap-4 mb-3">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><Building2 size={24} /></div>
                  <p className="text-lg font-bold text-slate-900">{department.department_name}</p>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">{department.description || "No description provided."}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* DEPARTMENT MODAL */}
      <Modal title="Create Department" isOpen={isDepartmentModalOpen} onClose={() => setDepartmentModalOpen(false)}>
        <form className="space-y-4" onSubmit={(event) => { 
          event.preventDefault(); 
          onCreateDepartment(departmentForm).then(() => {
            setDepartmentForm({ department_name: "", description: "" });
            setDepartmentModalOpen(false);
          }); 
        }}>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Department Name</label>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-indigo-400 outline-none transition" placeholder="e.g. Engineering" value={departmentForm.department_name} onChange={(event) => setDepartmentForm((current) => ({ ...current, department_name: event.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Description</label>
            <textarea className="min-h-32 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-indigo-400 outline-none transition" placeholder="Short description..." value={departmentForm.description} onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500">Add Department</button>
        </form>
      </Modal>

      {activeTab === "menu" ? (
        <SectionCard title="Menu Management" subtitle="Manage available items and uploads">
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3 w-full md:w-96 rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-100">
               <Search size={18} className="text-slate-400" />
               <input 
                 className="w-full bg-transparent text-sm text-slate-700 outline-none" 
                 placeholder="Search menu items..." 
                 value={searchMenu}
                 onChange={(e) => {setSearchMenu(e.target.value); setMenuPage(1);}}
               />
             </div>
             <button onClick={() => setMenuModalOpen(true)} className="flex items-center gap-2 max-md:w-full justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500">
                <Plus size={18} /> Add Menu Item
             </button>
          </div>

          <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white shadow-sm mb-6">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-5 py-4">Image</th>
                  <th className="px-5 py-4">Menu Item</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMenu.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                       {item.image ? (
                          <img src={item.image} alt={item.food_name} className="h-12 w-16 rounded-lg object-cover shadow-sm" />
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 flex-col"><Soup size={18}/></div>
                        )}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                       <span className="block">{item.food_name}</span>
                       <span className="text-xs text-slate-500 font-normal truncate max-w-[200px] block">{item.description || "No description"}</span>
                    </td>
                    <td className="px-5 py-4"><span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100">{item.meal_type_display}</span></td>
                    <td className="px-5 py-4 font-bold text-slate-900">${item.price}</td>
                    <td className="px-5 py-4 text-center">
                       <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600 shadow-sm">
                          {editingMenuId === item.id ? (updatingImageId === item.id ? "..." : "✓") : <Edit size={14} />} {item.image ? "Change Image" : "Upload Image"}
                          <input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setEditingMenuId(item.id); setUpdatingImageId(item.id); onUpdateMenuImage(item.id, file).finally(() => { setUpdatingImageId(null); setEditingMenuId(null); event.target.value = ""; }); } }} />
                       </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination currentPage={menuPage} totalItems={filteredMenu.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setMenuPage} />
          </div>
        </SectionCard>
      ) : null}

      {/* MENU MODAL */}
      <Modal title="Add Menu Item" isOpen={isMenuModalOpen} onClose={() => setMenuModalOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onCreateMenu(menuForm).then(() => { setMenuForm({ food_name: "", meal_type: "lunch", description: "", price: "", image: null, availability_date: "" }); setMenuModalOpen(false); }); }}>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Food Name</label>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400" placeholder="e.g. Pasta" value={menuForm.food_name} onChange={(event) => setMenuForm((current) => ({ ...current, food_name: event.target.value }))} required/>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Meal Type</label>
            <select className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 appearance-none" value={menuForm.meal_type} onChange={(event) => setMenuForm((current) => ({ ...current, meal_type: event.target.value }))}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Price</label>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400" placeholder="e.g. 150" type="number" step="0.01" value={menuForm.price} onChange={(event) => setMenuForm((current) => ({ ...current, price: event.target.value }))} required/>
          </div>
          <label className="md:col-span-2 flex flex-col justify-center items-center cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition hover:border-indigo-300">
             <div className="text-center">
               <UploadImageFrame src={menuPreviewImage} alt="Menu preview" label="Upload Food Picture" sublabel="Supported: JPG, PNG, WEBP" className="h-32 w-full rounded-xl object-cover mb-2 mx-auto max-w-[200px]" />
             </div>
             <input type="file" accept="image/*" className="hidden" onChange={(event) => setMenuForm((current) => ({ ...current, image: event.target.files?.[0] || null }))} />
          </label>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Availability Date</label>
            <input type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400" value={menuForm.availability_date} onChange={(event) => setMenuForm((current) => ({ ...current, availability_date: event.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
            <textarea className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400" placeholder="A short tasty description..." value={menuForm.description} onChange={(event) => setMenuForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <button className="md:col-span-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-500 shadow-md shadow-indigo-600/20">Save Menu Item</button>
        </form>
      </Modal>

      {activeTab === "orders" ? (
        <SectionCard title="Order Monitoring" subtitle="All employee orders across the platform">
           <div className="mb-6 flex flex-col md:flex-row gap-4 justify-end items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3">
               <span className="text-sm font-semibold text-slate-600">Filter By Status:</span>
               <select 
                 className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 appearance-none pr-8 cursor-pointer"
                 value={orderFilter}
                 onChange={(e) => { setOrderFilter(e.target.value); setOrderPage(1); }}
               >
                 <option value="all">All Orders</option>
                 <option value="pending">Pending</option>
                 <option value="preparing">Preparing</option>
                 <option value="served">Served</option>
                 <option value="cancelled">Cancelled</option>
               </select>
             </div>
           </div>
           
           <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white shadow-sm mb-6">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-5 py-4">Order ID</th>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Date & Time</th>
                    <th className="px-5 py-4">Summary</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-bold text-slate-900">ORD-{order.id}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{order.employee_name}</td>
                      <td className="px-5 py-4 text-slate-500">{new Date(order.order_date).toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-500">{order.items.length} items</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-4 font-bold text-slate-900">${order.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination currentPage={orderPage} totalItems={filteredOrders.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setOrderPage} />
            </div>
        </SectionCard>
      ) : null}

      {activeTab === "payments" ? (
        <SectionCard title="Payments Control" subtitle="Review monthly bills and mark collections">
          <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white shadow-sm mb-6">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-5 py-4">Invoice</th>
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Month</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payments.map((payment) => (
                  <tr key={payment.id} className={`transition hover:bg-slate-50/50 ${payment.status === 'paid' ? 'bg-green-50/10' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{payment.invoice_number}</span>
                        <a href={getInvoiceUrl(payment.id)} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400">
                          <Receipt size={14} />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{payment.employee_name}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(payment.billing_month).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}</td>
                    <td className="px-5 py-4 text-slate-500 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">৳{payment.amount}</td>
                    <td className="px-5 py-4"><StatusBadge status={payment.status} /></td>
                    <td className="px-5 py-4 text-center">
                      {payment.status !== "paid" ? (
                        <button onClick={() => onMarkPaid(payment.id)} className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-200 border border-green-200">
                           Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "reports" ? (
        <SectionCard title="Proper Analytics Dashboard" subtitle="Visual data representation of canteen performance">
          <div className="grid gap-6">
            {/* 1. Weekly Trends Visual Diagram (SVG) */}
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600"><LayoutDashboard size={20}/></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Weekly Order Trends</h3>
                    <p className="text-xs text-slate-500">Order volume over the last 7 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Orders</div>
                </div>
              </div>
              
              <div className="relative h-64 w-full px-4">
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[4, 3, 2, 1, 0].map(i => <div key={i} className="w-full border-t border-slate-100 h-0"></div>)}
                </div>
                <div className="absolute inset-0 flex items-end justify-between px-6 pt-4">
                  {/* Mock Trends from data.reports.trends or fallback */}
                  {(data.reports.trends || [
                    { date: "Mon", orders: 12 }, { date: "Tue", orders: 18 }, { date: "Wed", orders: 15 },
                    { date: "Thu", orders: 25 }, { date: "Fri", orders: 22 }, { date: "Sat", orders: 8 }, { date: "Sun", orders: 5 }
                  ]).map((point, index) => {
                    const height = (point.orders / 30) * 100; // Normalize 0-30
                    return (
                      <div key={index} className="group relative flex flex-col items-center flex-1 h-full">
                        <div className="absolute bottom-full mb-2 hidden group-hover:block transition-all z-10">
                          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg">{point.orders} orders</div>
                        </div>
                        <div 
                          className="w-8 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-700 hover:opacity-80 cursor-pointer"
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{point.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {/* 2. Daily Consumption Diagram */}
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="rounded-xl bg-orange-50 p-2 text-orange-600"><Soup size={20}/></div>
                  <h3 className="text-xl font-bold text-slate-900">Food Consumption</h3>
                </div>
                <div className="space-y-6">
                  {(data.reports.daily?.items || []).slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                         <span className="font-bold text-slate-700">{item.menu_item__food_name}</span>
                         <span className="text-indigo-600 font-extrabold">{item.total_quantity} qty</span>
                      </div>
                      <div className="relative w-full bg-slate-100 rounded-full h-3">
                         <div className="absolute top-0 left-0 bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min((item.total_quantity / 20) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Spenders Diagram */}
              <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="rounded-xl bg-green-50 p-2 text-green-600"><Users size={20}/></div>
                  <h3 className="text-xl font-bold text-slate-900">Top Revenue Generators</h3>
                </div>
                <div className="space-y-4">
                  {(data.reports.monthly?.employees || []).slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition hover:scale-[1.02] hover:bg-white hover:shadow-md cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs">{idx + 1}</div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none">{item.employee__name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{item.employee__department__department_name || "Staff"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-indigo-600 text-lg">৳{item.total_amount}</p>
                        <p className="text-[10px] text-slate-400">{item.total_orders} meals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </Shell>
  );
}
