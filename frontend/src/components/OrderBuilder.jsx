import { useMemo, useState } from "react";
import { CheckCircle2, ImagePlus, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";

// Category → colour mapping for the badge
const CATEGORY_COLORS = {
  breakfast: "bg-amber-100 text-amber-700",
  lunch:     "bg-sky-100   text-sky-700",
  snack:     "bg-rose-100  text-rose-700",
  dinner:    "bg-indigo-100 text-indigo-700",
  drinks:    "bg-teal-100  text-teal-700",
};

const TABS = ["All", "Breakfast", "Lunch", "Snack", "Drinks"];

export default function OrderBuilder({ menuItems, cartItems, changeQuantity }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Category filter
    if (activeCategory !== "All") {
      const matchKey = activeCategory.toLowerCase();
      items = items.filter(
        (item) => item.meal_type?.toLowerCase() === matchKey
      );
    }

    // Search filter — matches food_name, description, meal_type_display
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.food_name?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.meal_type_display?.toLowerCase().includes(q) ||
          item.meal_type?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [menuItems, activeCategory, search]);

  const currentQuantity = (id) =>
    cartItems.find((item) => item.menu_item === id)?.quantity || 0;

  return (
    <div className="space-y-5">
      {/* ── Search Bar ── */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, category or description..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#5b50d6] focus:bg-white focus:ring-4 focus:ring-[#5b50d6]/10"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveCategory(tab)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
              activeCategory === tab
                ? "bg-[#5b50d6] text-white shadow-md shadow-[#5b50d6]/25"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Food Grid ── */}
      {filteredItems.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
          <Search size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">
            {search ? `No results for "${search}"` : "No items in this category yet."}
          </p>
          {search && (
            <button onClick={() => setSearch("")} className="mt-3 text-xs font-semibold text-[#5b50d6] hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredItems.map((item) => {
            const quantity = currentQuantity(item.id);
            const inCart = quantity > 0;
            // is_available may be undefined for older data — treat undefined as true
            const isAvailable = item.is_available !== false;
            const categoryKey = item.meal_type?.toLowerCase() || "";
            const badgeClass =
              CATEGORY_COLORS[categoryKey] || "bg-slate-100 text-slate-600";

            return (
              <div
                key={item.id}
                className={`group relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[18px] border bg-white shadow-sm transition-all duration-300 ${
                  isAvailable
                    ? "border-slate-200 hover:-translate-y-1 hover:shadow-lg"
                    : "border-slate-100 opacity-55 cursor-not-allowed"
                }`}
              >
                {/* ── Food Image ── */}
                {item.image ? (
                  <div className="relative h-28 w-full shrink-0 overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.food_name}
                      className={`h-full w-full object-cover transition-transform duration-500 ${isAvailable ? "group-hover:scale-105" : "grayscale"}`}
                    />
                    {/* Price pill */}
                    <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-sm font-bold text-slate-900 shadow-sm">
                      ৳{item.price}
                    </div>
                    {/* In-cart indicator */}
                    {inCart && isAvailable && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                        <CheckCircle2 size={12} />
                        In Cart
                      </div>
                    )}
                    {/* Unavailable badge */}
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                        <span className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-bold text-white shadow">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative flex h-28 w-full shrink-0 items-center justify-center border-b border-slate-100 bg-slate-50">
                    <div className="text-center p-4">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm mb-3">
                        <ImagePlus size={20} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{item.food_name}</p>
                      <p className="text-xs text-slate-400 mt-1">No image yet</p>
                    </div>
                    {/* Price pill (no-image state) */}
                    <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-slate-900 shadow-sm">
                      ৳{item.price}
                    </div>
                    {inCart && isAvailable && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                        <CheckCircle2 size={12} />
                        In Cart
                      </div>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-t-[22px]">
                        <span className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-bold text-white shadow">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Card Body ── */}
                <div className="flex flex-1 flex-col p-3.5">
                  {/* Category badge */}
                  <span
                    className={`mb-2 inline-block self-start rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}
                  >
                    {item.meal_type_display || item.meal_type || "Food"}
                  </span>

                  <h4 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-snug text-slate-900">
                    {item.food_name}
                  </h4>
                  <p className="mt-1 min-h-[2rem] line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                    {item.description || "Freshly prepared by the canteen kitchen."}
                  </p>

                  {/* ── Add to Cart / Counter ── */}
                  <div className="mt-auto border-t border-slate-100 pt-2.5">
                    {!isAvailable ? (
                      <div className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-slate-400">
                        Not Available
                      </div>
                    ) : inCart ? (
                      <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, quantity - 1)}
                            className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-5 text-center text-[11px] font-bold text-slate-900">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, quantity + 1)}
                            className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm transition hover:bg-[#f0eeff] hover:text-[#5b50d6]"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 size={13} /> In Cart
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, 1)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#5b50d6] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4638c4] hover:-translate-y-0.5"
                      >
                        <ShoppingBag size={15} />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
