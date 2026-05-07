import { useEffect, useMemo, useState } from "react";
import { CreditCard, ImagePlus, LayoutDashboard, Soup, ClipboardList, UserCircle2, Wallet } from "lucide-react";
import Shell from "../components/dashboard/Shell";
import OrderBuilder from "../components/OrderBuilder";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import UploadPlaceholder from "../components/UploadPlaceholder";
import UploadImageFrame from "../components/UploadImageFrame";

const employeeTabs = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "menu", label: "View Menu", icon: Soup },
  { key: "orders", label: "My Orders", icon: ClipboardList },
  { key: "billing", label: "Payment / Billing", icon: CreditCard },
  { key: "profile", label: "Profile", icon: UserCircle2 },
];

export default function EmployeeDashboard({ user, data, activeTab, onChangeTab, onLogout, onPlaceOrder, onStartPayment, onUpdateProfile }) {
  const profile = data.employeeProfile || user.employee_profile;
  const totalOrders = data.orders.length;
  const monthlySpending = data.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const pendingOrders = data.orders.filter((order) => ["pending", "preparing"].includes(order.status)).length;
  const currentStatus = data.payments.some((payment) => ["unpaid", "overdue", "failed", "cancelled"].includes(payment.status)) ? "Action Needed" : "Paid";
  const latestOpenPayment = data.payments.find((payment) => ["unpaid", "overdue", "failed", "cancelled"].includes(payment.status));
  const recentOrders = data.orders.slice(0, 5);
  const pendingQueue = data.orders.filter((order) => ["pending", "preparing"].includes(order.status)).slice(0, 5);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", profile_image: null, shift: "morning" });

  useEffect(() => {
    setProfileForm({
      name: profile?.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
      email: profile?.email || user.email || "",
      phone: profile?.phone || user.phone || "",
      profile_image: null,
      shift: profile?.shift || "morning",
    });
  }, [profile, user]);

  const profilePreviewImage = useMemo(() => {
    if (profileForm.profile_image instanceof File) return URL.createObjectURL(profileForm.profile_image);
    return profile?.profile_image || null;
  }, [profile, profileForm.profile_image]);

  useEffect(() => {
    return () => {
      if (profilePreviewImage?.startsWith("blob:")) URL.revokeObjectURL(profilePreviewImage);
    };
  }, [profilePreviewImage]);

  return (
    <Shell brand="Employee Portal" title="Employee Dashboard" user={user} tabs={employeeTabs} activeTab={activeTab} onChangeTab={onChangeTab} onLogout={onLogout}>
      {activeTab === "overview" ? (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border border-indigo-100">
              <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-indigo-100/50 blur-2xl transition-all group-hover:bg-indigo-200/50"></div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-100 px-3 py-2 text-indigo-600">
                <ShoppingBag size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total Orders</span>
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900">{totalOrders}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">This month</p>
            </div>

            <div className="group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border border-emerald-100">
              <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl transition-all group-hover:bg-emerald-200/50"></div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-3 py-2 text-emerald-600">
                <Wallet size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Monthly Spending</span>
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900">৳{monthlySpending.toFixed(2)}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Current billing period</p>
            </div>

            <div className="group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border border-amber-100">
              <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-amber-100/50 blur-2xl transition-all group-hover:bg-amber-200/50"></div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-amber-100 px-3 py-2 text-amber-600">
                <ChefHat size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Orders</span>
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900">{pendingOrders}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium">Kitchen queue</p>
            </div>

            <div className="group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-green-50 to-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border border-green-100">
              <div className="absolute right-[-10%] top-[-10%] h-24 w-24 rounded-full bg-green-100/50 blur-2xl transition-all group-hover:bg-green-200/50"></div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-green-100 px-3 py-2 text-green-600">
                <CreditCard size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-green-700">Payment Status</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 truncate" title={currentStatus}>{currentStatus}</h3>
              <p className="mt-2 text-sm text-slate-500 font-medium truncate">{latestOpenPayment ? latestOpenPayment.invoice_number : "Current month"}</p>
            </div>
          </section>

          <SectionCard title="Today's Menu" subtitle="Choose food from the first section and place your order directly here">
            <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-violet-100 bg-[linear-gradient(135deg,#f5f3ff_0%,#eef4ff_100%)] p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">Food cards are ready to order</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Pick quantity from the menu cards below, review the cart, then press `Place Order`.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => onChangeTab("billing")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">View Billing</button>
                <button onClick={() => onChangeTab("profile")} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white">Edit Profile</button>
              </div>
            </div>

            <OrderBuilder employees={data.employees} menuItems={data.menuItems} onSubmit={onPlaceOrder} loading={false} lockedEmployeeId={profile?.id} />
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <SectionCard title="Billing Snapshot" subtitle="Monthly invoice and quick payment access">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"><Wallet /></div><p className="text-lg text-slate-500">Current Month Bill</p><p className="mt-2 text-4xl font-bold text-slate-900">৳{monthlySpending.toFixed(2)}</p><p className="mt-4 text-sm leading-7 text-slate-500">{totalOrders} orders placed this month.</p></div>
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><CreditCard /></div><p className="text-lg text-slate-500">Latest Invoice</p><p className="mt-2 text-2xl font-bold text-slate-900">{latestOpenPayment?.invoice_number || "All settled"}</p><div className="mt-4 flex flex-wrap items-center gap-3"><StatusBadge status={latestOpenPayment?.status || "paid"} />{latestOpenPayment ? <button onClick={() => onStartPayment(latestOpenPayment.id)} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white">Pay with SSLCommerz</button> : null}</div></div>
              </div>
            </SectionCard>

            <SectionCard title="Profile Snapshot" subtitle="Your account and canteen identity">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                {profilePreviewImage ? <img src={profilePreviewImage} alt="Profile" className="h-28 w-28 rounded-[28px] object-cover" /> : <UploadPlaceholder label="Your photo" sublabel="Upload from profile settings" className="h-28 w-28 rounded-[28px]" />}
                <div className="grid flex-1 gap-4 md:grid-cols-2">
                  {[{ label: "Name", value: profile?.name || user.username }, { label: "Department", value: profile?.department_name || "Not assigned" }, { label: "Phone", value: profile?.phone || "Not provided" }, { label: "Shift", value: profile?.shift || "morning" }].map((field) => <div key={field.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">{field.label}</p><p className="mt-2 text-lg font-semibold capitalize text-slate-900">{field.value}</p></div>)}
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Pending Queue" subtitle="Orders still moving through the canteen">
              <div className="space-y-4">
                {pendingQueue.length ? pendingQueue.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><ClipboardList size={18} /></div>
                        <div>
                          <p className="font-bold text-slate-900">ORD-{order.id}</p>
                          <p className="text-xs font-medium text-slate-500">{new Date(order.order_date).toLocaleString()}</p>
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.items.map((item) => <span key={item.id} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-100">{item.food_name} <span className="text-slate-400">× {item.quantity}</span></span>)}
                    </div>
                  </div>
                )) : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No pending orders right now.</div>}
              </div>
            </SectionCard>
            <SectionCard title="Order History" subtitle="Recent orders appear last on the dashboard">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                    <tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Items</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="transition hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-bold text-slate-900">ORD-{order.id}</td>
                        <td className="px-5 py-4 text-slate-500">{order.items.length} items</td>
                        <td className="px-5 py-4 text-slate-500">{new Date(order.order_date).toLocaleDateString()}</td>
                        <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-4 font-bold text-slate-900">৳{order.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
      {activeTab === "menu" ? <SectionCard title="Order Food" subtitle="Choose your meal and place an order"><div className="mb-5 rounded-[24px] border border-violet-100 bg-violet-50 px-5 py-4 text-sm text-violet-700">This is the same order builder used in Today&apos;s Menu.</div><OrderBuilder employees={data.employees} menuItems={data.menuItems} onSubmit={onPlaceOrder} loading={false} lockedEmployeeId={profile?.id} /></SectionCard> : null}
      {activeTab === "orders" ? <SectionCard title="My Orders" subtitle="Complete order history"><div className="space-y-4">{data.orders.map((order) => <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4"><div><div className="flex items-center gap-2"><ClipboardList size={18} className="text-indigo-500"/><p className="text-lg font-bold text-slate-900">ORD-{order.id}</p></div><p className="mt-1 text-sm text-slate-500">{new Date(order.order_date).toLocaleString()}</p></div><div className="flex items-center gap-4"><StatusBadge status={order.status} /><span className="rounded-xl bg-slate-100 px-3 py-1.5 font-bold text-slate-900 border border-slate-200">৳{order.total_amount}</span></div></div><div className="mt-4 flex flex-wrap gap-2">{order.items.map((item) => <span key={item.id} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-100">{item.food_name} <span className="text-slate-400">× {item.quantity}</span></span>)}</div></div>)}</div></SectionCard> : null}
      {activeTab === "billing" ? (
        <SectionCard title="Payment / Billing" subtitle="Invoices, billing status, and SSLCommerz payment">
          <div className="space-y-4">
            {data.payments.length ? data.payments.map((payment) => (
              <div key={payment.id} className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition hover:shadow-md lg:flex-row lg:items-center lg:justify-between ${payment.status === 'paid' ? 'bg-green-50/30 border-green-100' : 'bg-white border-slate-200'}`}>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-slate-900">{payment.invoice_number}</p>
                    {payment.status === 'paid' && <div className="rounded-full bg-green-500 p-1 text-white"><CheckCircle2 size={12} /></div>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Billing: {new Date(payment.billing_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} • 
                    Method: <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <StatusBadge status={payment.status} />
                  <span className="rounded-xl bg-white px-4 py-2 text-lg font-bold text-slate-900 shadow-sm border border-slate-200">৳{payment.amount}</span>
                  <div className="flex gap-2">
                    {["unpaid", "overdue", "failed", "cancelled"].includes(payment.status) ? (
                      <button onClick={() => onStartPayment(payment.id)} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 hover:-translate-y-0.5">
                        Pay Now
                      </button>
                    ) : null}
                    <a 
                      href={getInvoiceUrl(payment.id)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 transition hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Receipt size={16} />
                      Invoice
                    </a>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400"><CreditCard size={32} /></div>
                <p className="font-bold text-slate-900">No billing history</p>
                <p className="text-sm text-slate-500">Your monthly invoices will appear here.</p>
              </div>
            )}
          </div>
        </SectionCard>
      ) : null}
      {activeTab === "profile" ? <SectionCard title="Profile" subtitle="Edit your employee information after login"><div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]"><div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">{profilePreviewImage ? <img src={profilePreviewImage} alt="Profile" className="h-56 w-full rounded-2xl object-cover shadow-sm" /> : <UploadPlaceholder label="Upload your picture" sublabel="Your own photo will appear here" className="h-56 w-full" />}<div className="mt-6 space-y-4 text-sm text-slate-600"><div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-semibold text-slate-700">Department</span> <span>{profile?.department_name || "Not assigned"}</span></div><div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-semibold text-slate-700">Employee ID</span> <span>{profile?.employee_id || "Pending"}</span></div><div className="flex justify-between pb-2"><span className="font-semibold text-slate-700">Username</span> <span>{user.username}</span></div></div></div><form className="grid gap-5 md:grid-cols-2 bg-white rounded-[28px] border border-slate-200 p-6 shadow-sm" onSubmit={(event) => { event.preventDefault(); onUpdateProfile(profileForm); }}><div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Full Name</label><input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Full name" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} /></div><div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Email Address</label><input type="email" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} /></div><div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Phone</label><input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white" placeholder="Phone" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} /></div><div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">Work Shift</label><select className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white appearance-none" value={profileForm.shift} onChange={(event) => setProfileForm((current) => ({ ...current, shift: event.target.value }))}><option value="morning">Morning</option><option value="evening">Evening</option><option value="night">Night</option></select></div><label className="md:col-span-2 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30"><ImagePlus size={32} className="text-indigo-400" /><p className="mt-4 text-sm font-semibold text-slate-700">Upload profile picture</p><p className="mt-1 text-xs text-slate-400">Choose a JPG, PNG, or WEBP file</p><input type="file" accept="image/*" className="hidden" onChange={(event) => setProfileForm((current) => ({ ...current, profile_image: event.target.files?.[0] || null }))} /></label><div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2"><button className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 hover:-translate-y-0.5">Save Profile</button><button type="button" onClick={() => setProfileForm({ name: profile?.name || user.username, email: profile?.email || user.email || "", phone: profile?.phone || user.phone || "", profile_image: null, shift: profile?.shift || "morning" })} className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">Reset</button></div></form></div></SectionCard> : null}
    </Shell>
  );
}
