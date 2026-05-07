import { Bell, ChevronDown, LogOut, Search, Soup } from "lucide-react";

function Sidebar({ brand, items, activeTab, onChange, onLogout }) {
  return (
    <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:w-[270px] lg:flex-col">
      <div className="border-b border-slate-200 px-8 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
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
            <button key={item.key} onClick={() => onChange(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium transition ${active ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
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

function Topbar({ title, user, onLogout }) {
  const initials = `${user.first_name?.[0] || user.username?.[0] || "U"}${user.last_name?.[0] || ""}`.toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 py-5 backdrop-blur xl:px-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="hidden min-w-[320px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:flex">
          <Search size={18} className="text-slate-400" />
          <input className="w-full bg-transparent text-sm text-slate-700 outline-none" placeholder="Search..." />
        </div>
        <button className="relative rounded-2xl p-3 text-slate-500 transition hover:bg-slate-50">
          <Bell size={22} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">{initials || "U"}</div>
          <div className="hidden md:block">
            <p className="font-semibold text-slate-900">{`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username}</p>
            <p className="text-sm capitalize text-slate-500">{user.role === "staff" ? "Canteen Staff" : user.role}</p>
          </div>
          <ChevronDown size={18} className="hidden text-slate-400 md:block" />
        </div>
        <button onClick={onLogout} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 lg:hidden">
          Logout
        </button>
      </div>
    </header>
  );
}

export default function Shell({ brand, title, user, tabs, activeTab, onChangeTab, onLogout, children }) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] lg:flex">
      <Sidebar brand={brand} items={tabs} activeTab={activeTab} onChange={onChangeTab} onLogout={onLogout} />
      <div className="min-h-screen flex-1">
        <Topbar title={title} user={user} onLogout={onLogout} />
        <div className="space-y-6 p-5 xl:p-8">{children}</div>
      </div>
    </div>
  );
}
