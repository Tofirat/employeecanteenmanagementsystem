import { ChefHat, ClipboardList, LayoutDashboard, CreditCard, Receipt } from "lucide-react";
import Shell from "../components/dashboard/Shell";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

const staffTabs = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "incoming", label: "Incoming Orders", icon: ClipboardList },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "operations", label: "Daily Operations", icon: ChefHat },
];

export default function StaffDashboard({ user, data, activeTab, onChangeTab, onLogout, onUpdateStatus, onUpdatePayment, getInvoiceUrl }) {
  const pending = data.orders.filter((order) => order.status === "pending").length;
  const preparing = data.orders.filter((order) => order.status === "preparing").length;
  const served = data.orders.filter((order) => order.status === "served").length;

  return (
    <Shell brand="Canteen Operations" title="Canteen Staff Dashboard" user={user} tabs={staffTabs} activeTab={activeTab} onChangeTab={onChangeTab} onLogout={onLogout}>
      {activeTab === "overview" ? (
        <>
          <section className="grid gap-5 md:grid-cols-3">
            <StatCard title="Incoming Orders" value={pending} helper="Waiting in queue" accent="bg-amber-50 text-amber-700" />
            <StatCard title="Preparing" value={preparing} helper="Currently in kitchen" accent="bg-sky-50 text-sky-700" />
            <StatCard title="Served" value={served} helper="Completed today" accent="bg-emerald-50 text-emerald-700" />
          </section>
          <SectionCard title="Live Queue" subtitle="Orders requiring staff attention"><div className="space-y-4">{data.orders.slice(0, 6).map((order) => <div key={order.id} className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-lg font-semibold text-slate-900">ORD-{order.id} • {order.employee_name}</p><p className="mt-1 text-sm text-slate-500">{new Date(order.order_date).toLocaleString()}</p></div><div className="flex items-center gap-3"><StatusBadge status={order.status} />{order.status === "pending" ? <button onClick={() => onUpdateStatus(order.id, "preparing")} className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">Start Preparing</button> : null}{order.status === "preparing" ? <button onClick={() => onUpdateStatus(order.id, "served")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Mark Served</button> : null}</div></div></div>)}</div></SectionCard>
        </>
      ) : null}

      {activeTab === "incoming" ? <SectionCard title="Incoming Orders" subtitle="Full order queue for the canteen team"><div className="space-y-4">{data.orders.map((order) => <div key={order.id} className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-lg font-semibold text-slate-900">ORD-{order.id} • {order.employee_name}</p><p className="mt-1 text-sm text-slate-500">{order.department_name || "No department"}</p></div><div className="flex items-center gap-3"><StatusBadge status={order.status} />{order.status === "pending" ? <button onClick={() => onUpdateStatus(order.id, "preparing")} className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">Preparing</button> : null}{order.status === "preparing" ? <button onClick={() => onUpdateStatus(order.id, "served")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Served</button> : null}</div></div><div className="mt-4 flex flex-wrap gap-2">{order.items.map((item) => <span key={item.id} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{item.food_name} x {item.quantity}</span>)}</div></div>)}</div></SectionCard> : null}

      {activeTab === "payments" ? (
        <SectionCard title="Collect Payments" subtitle="Confirm cash collections and view billing history">
          <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white shadow-sm mb-6">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-5 py-4">Invoice</th>
                  <th className="px-5 py-4">Employee</th>
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
                    <td className="px-5 py-4 text-slate-500 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">৳{payment.amount}</td>
                    <td className="px-5 py-4"><StatusBadge status={payment.status} /></td>
                    <td className="px-5 py-4 text-center">
                      {payment.status !== "paid" ? (
                        <button onClick={() => onUpdatePayment(payment.id)} className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-200 border border-green-200">
                           Confirm Paid
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">Collected</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.payments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400 italic">No payment records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}

      {activeTab === "operations" ? <SectionCard title="Daily Food Operations" subtitle="Kitchen workload snapshot"><div className="grid gap-5 md:grid-cols-3">{[{ label: "Pending", value: pending, desc: "Need to start" }, { label: "Preparing", value: preparing, desc: "In progress" }, { label: "Served", value: served, desc: "Completed" }].map((item) => <div key={item.label} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6"><p className="text-sm uppercase tracking-[0.25em] text-slate-400">{item.label}</p><p className="mt-3 text-4xl font-bold text-slate-900">{item.value}</p><p className="mt-3 text-sm text-slate-500">{item.desc}</p></div>)}</div></SectionCard> : null}
    </Shell>
  );
}
