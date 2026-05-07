import { useMemo, useState } from "react";
import { CheckCircle2, Layers3, Minus, Plus, Search, ShoppingBag, Store } from "lucide-react";

const LANDING_CATEGORIES = ["All", "Breakfast", "Lunch", "Snack", "Drinks"];

function FoodCard({ item, quantity, changeQuantity }) {
  const inCart = quantity > 0;
  const category = item.meal_type_display || item.meal_type || "Food";

  return (
    <article className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)]">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.food_name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(event) => {
              event.target.onerror = null;
              event.target.style.display = "none";
              const fallback = event.target.nextElementSibling;
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}

        <div className={`${item.image ? "hidden" : "flex"} absolute inset-0 items-center justify-center bg-slate-100 text-slate-400`}>
          <div className="text-center">
            <Store size={34} className="mx-auto" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em]">No image</p>
          </div>
        </div>

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 backdrop-blur">
            {category}
          </span>
          <span className="rounded-full bg-slate-900/85 px-3 py-1.5 text-sm font-semibold text-white">
            Tk {Number(item.price || 0).toFixed(2)}
          </span>
        </div>

        {inCart ? (
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            <CheckCircle2 size={13} />
            In cart
          </div>
        ) : null}
      </div>

      <div className="flex h-[168px] flex-col p-4">
        <div className="flex-1">
          <h3 className="line-clamp-2 text-[15px] font-bold tracking-tight text-slate-900">{item.food_name}</h3>
          <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-500">
            {item.description || "Fresh food for the canteen menu."}
          </p>
        </div>

        <div className="mt-4">
          {inCart ? (
            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-2">
              <button
                type="button"
                onClick={() => changeQuantity(item.id, quantity - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Minus size={16} />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Qty</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{quantity}</p>
              </div>
              <button
                type="button"
                onClick={() => changeQuantity(item.id, quantity + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => changeQuantity(item.id, 1)}
              className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#5b50d6] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5b50d6]/20 transition hover:bg-[#4d43c8]"
            >
              <ShoppingBag size={16} />
              Add to cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function LandingPage({
  onNavigate,
  menuItems = [],
  cartItems = [],
  changeQuantity,
  onOpenCart,
  cartItemCount,
  isLoading = false,
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (menuItems || []).filter((item) => {
      const categoryLabel = item.meal_type_display || item.meal_type || "";
      const normalizedCategory = categoryLabel.toLowerCase() === "dinner" ? "lunch" : categoryLabel.toLowerCase();

      const matchesSearch =
        !query ||
        item.food_name?.toLowerCase().includes(query) ||
        categoryLabel.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      const matchesCategory =
        activeCategory === "All" || normalizedCategory === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, menuItems, search]);

  const currentQuantity = (id) =>
    cartItems.find((item) => String(item.menu_item) === String(id))?.quantity || 0;

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5b50d6] text-white shadow-lg shadow-[#5b50d6]/20">
              <Layers3 size={20} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">Canteen Pro</p>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Employee canteen system</p>
            </div>
          </button>

          <div className="hidden min-w-[300px] max-w-2xl flex-1 lg:flex">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search food, category, or dishes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-12 py-3 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white focus:ring-4 focus:ring-[#5b50d6]/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenCart}
              className="relative rounded-full border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-[#5b50d6]/20 hover:bg-[#5b50d6]/5 hover:text-[#5b50d6]"
            >
              <ShoppingBag size={19} />
              {cartItemCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#5b50d6] text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#5b50d6]"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onNavigate("register")}
              className="rounded-full bg-[#5b50d6] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#5b50d6]/20 transition hover:bg-[#4d43c8]"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Food menu</h1>
              <p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-500">
                A simple canteen ordering page where employees can browse meals, add items to cart, and continue to payment smoothly.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[250px] lg:hidden">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search in menu..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-12 py-3 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:ring-4 focus:ring-[#5b50d6]/10"
                />
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            {LANDING_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "bg-slate-900 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMenu.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                quantity={currentQuantity(item.id)}
                changeQuantity={changeQuantity}
              />
            ))}

            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                    <div className="h-44 animate-pulse bg-slate-100" />
                    <div className="space-y-4 p-4">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                      <div className="h-10 w-full animate-pulse rounded-[18px] bg-slate-100" />
                    </div>
                  </div>
                ))
              : null}

            {!isLoading && filteredMenu.length === 0 ? (
              <div className="col-span-full rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <p className="text-lg font-semibold text-slate-700">
                  {menuItems.length === 0 ? "No menu items are available right now." : "No meals found for your current search."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 text-[13px] text-slate-500 sm:px-6 lg:grid-cols-[1.15fr_0.85fr_0.85fr] lg:px-8">
          <div>
            <p className="font-semibold text-slate-700">Canteen Pro</p>
            <p className="mt-1">Employee canteen ordering with menu browsing, cart, and secure payment flow.</p>
            <p className="mt-3 text-[12px] leading-6 text-slate-400">
              Built for offices that want a cleaner daily meal experience for employees, canteen staff, and admins.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-700">Quick Links</p>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => onNavigate("login")} className="text-left transition hover:text-[#5b50d6]">Login</button>
              <button type="button" onClick={() => onNavigate("register")} className="text-left transition hover:text-[#5b50d6]">Register</button>
              <button type="button" onClick={onOpenCart} className="text-left transition hover:text-[#5b50d6]">Open Cart</button>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-700">Contact</p>
            <div className="mt-3 space-y-2 text-[13px]">
              <p>Support: +880 1816-467500</p>
              <p>Office: +880 1700-000111</p>
              <p>Email: support@canteenpro.com</p>
              <p>Billing: accounts@canteenpro.com</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
