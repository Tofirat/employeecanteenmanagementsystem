import { Minus, Plus, ShoppingBag, X } from "lucide-react";

export default function CartSidebar({ isOpen, onClose, cartItems, itemLookup, changeQuantity, subtotal, tax, total, onProceed }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 z-50 h-full w-full max-w-[380px] bg-white shadow-2xl transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ShoppingBag size={20} />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900">Your Order</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <ShoppingBag size={32} />
              </div>
              <p className="text-lg font-bold text-slate-900">Your cart is empty</p>
              <p className="mt-2 text-sm text-slate-500 max-w-[200px]">Add some delicious items from the menu to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => {
                const details = itemLookup[item.menu_item];
                if (!details) return null;
                
                return (
                  <div key={item.menu_item} className="flex gap-4">
                    {details.image ? (
                      <img src={details.image} alt={details.food_name} className="h-16 w-16 rounded-2xl object-cover shadow-sm flex-shrink-0" />
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-slate-900 line-clamp-1 flex-1">{details.food_name}</p>
                        <button onClick={() => changeQuantity(item.menu_item, 0)} className="text-slate-400 hover:text-rose-500 transition">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-bold text-blue-600">৳{(details.price * item.quantity).toFixed(2)}</p>
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
                          <button onClick={() => changeQuantity(item.menu_item, item.quantity - 1)} className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"><Minus size={12} /></button>
                          <span className="text-sm font-bold text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                          <button onClick={() => changeQuantity(item.menu_item, item.quantity + 1)} className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 p-6">
            <div className="space-y-3 mb-6 flex flex-col text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-900">৳0.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (5%)</span>
                <span className="font-semibold text-slate-900">৳{tax.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200/60 flex justify-between">
                <span className="text-base text-slate-500">Total</span>
                <span className="text-xl font-bold text-slate-900">৳{total.toFixed(2)}</span>
              </div>
            </div>
            
            <button onClick={onProceed} className="w-full rounded-2xl bg-blue-700 px-4 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 flex justify-center items-center gap-2">
              Proceed to Payment
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
