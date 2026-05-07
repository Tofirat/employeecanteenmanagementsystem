import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, CreditCard, DollarSign, X } from "lucide-react";

export default function CheckoutModal({ isOpen, onClose, cartItems, subtotal, tax, total, onConfirmOrder }) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [autoClose, setAutoClose] = useState(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMethod("");
      setIsProcessing(false);
      setOrderId(null);
      setCountdown(3);
      setAutoClose(false);
    }
  }, [isOpen]);

  // 3-second auto-close countdown for COD success
  useEffect(() => {
    if (step === 4 && method === "cod" && autoClose) {
      if (countdown <= 0) {
        onClose();
        return;
      }
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, method, autoClose, countdown, onClose]);

  if (!isOpen) return null;

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const processPayment = async () => {
    setIsProcessing(true);
    try {
      const response = await onConfirmOrder({
        method,
        paymentDetails: null,
      });

      // SSLCommerz: redirect is handled in App.jsx — modal stays loading
      if (["sslcommerz"].includes(method)) {
        // App.jsx will redirect at this point — just keep spinner
        return;
      }

      // COD & other: show success screen
      setOrderId(response?.id || null);
      setStep(4);
      if (method === "cod") {
        setAutoClose(true);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      if (!["sslcommerz"].includes(method)) {
        setIsProcessing(false);
      }
    }
  };

  const stepTitle = {
    1: "Review Order",
    2: "Choose Payment",
    3: "Confirm Payment",
    4: "Order Confirmed!",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl">
        {/* Header */}
        {step < 4 && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2 className="text-lg font-bold text-slate-900">{stepTitle[step]}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Step indicator dots */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? "w-6 bg-[#5b50d6]" : s < step ? "w-3 bg-[#5b50d6]/40" : "w-3 bg-slate-200"
                }`}
              />
            ))}
          </div>
        )}

        <div className="p-6">
          {/* ── STEP 1: Review Order ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="max-h-[38vh] overflow-y-auto pr-2 space-y-3">
                {cartItems.map((item) => (
                  <div key={item.menu_item} className="flex items-center justify-between text-sm gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{item.food_name}</p>
                      <p className="text-slate-400 text-xs">Qty: {item.quantity} × ৳{item.price}</p>
                    </div>
                    <p className="font-bold text-slate-900 shrink-0">৳{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Tax (5%)</span><span>৳{tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Delivery Fee</span><span>Free</span></div>
                <div className="flex justify-between pt-3 text-xl font-bold text-slate-900 border-t border-slate-100">
                  <span>Total</span><span>৳{total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="w-full rounded-2xl bg-[#5b50d6] px-4 py-4 font-bold text-white shadow-lg shadow-[#5b50d6]/20 transition hover:bg-[#4638c4]"
              >
                Proceed to Payment
              </button>
            </div>
          )}

          {/* ── STEP 2: Choose Payment Method ── */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">Select how you'd like to pay for your order</p>
              <button
                onClick={() => { setMethod("sslcommerz"); handleNext(); }}
                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-[#5b50d6] hover:bg-[#f5f3ff]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5b50d6]/10 text-[#5b50d6]">
                  <CreditCard size={24} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-900">Online Payment</p>
                  <p className="text-sm text-slate-500">Card, Mobile Banking via SSLCommerz</p>
                </div>
                <div className="shrink-0 w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-[#5b50d6] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#5b50d6] opacity-0 group-hover:opacity-100 transition" />
                </div>
              </button>
              <button
                onClick={() => { setMethod("cod"); handleNext(); }}
                className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={24} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-900">Cash on Delivery</p>
                  <p className="text-sm text-slate-500">Pay at the canteen counter</p>
                </div>
                <div className="shrink-0 w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-emerald-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </button>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && (
            <div className="space-y-5">
              {method === "sslcommerz" && (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#5b50d6]/10 text-[#5b50d6]">
                    <CreditCard size={36} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">Online Payment via SSLCommerz</p>
                    <p className="text-sm text-slate-500 mt-2">
                      You'll be securely redirected to complete your payment. This is powered by SSLCommerz — Bangladesh's leading payment gateway.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#5b50d6]/20 bg-[#f5f3ff] p-4 text-left space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#5b50d6]">Order Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Amount</span>
                      <span className="font-bold text-slate-900">৳{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Payment Method</span>
                      <span className="font-semibold text-slate-700">Card / Mobile Banking</span>
                    </div>
                  </div>
                </div>
              )}

              {method === "cod" && (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <DollarSign size={36} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">Cash on Delivery</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Your order will be prepared immediately. Please bring <strong className="text-slate-700">৳{total.toFixed(2)}</strong> to the canteen counter when collecting.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Order Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Amount</span>
                      <span className="font-bold text-slate-900">৳{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Payment</span>
                      <span className="font-semibold text-slate-700">Pay at counter</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={processPayment}
                disabled={isProcessing}
                className={`w-full rounded-2xl px-4 py-4 font-bold text-white shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-60 ${
                  method === "cod"
                    ? "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700"
                    : "bg-[#5b50d6] shadow-[#5b50d6]/20 hover:bg-[#4638c4]"
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {method === "sslcommerz" ? "Redirecting to Gateway..." : "Placing Order..."}
                  </>
                ) : method === "cod" ? (
                  "Confirm Order"
                ) : (
                  "Pay Now with SSLCommerz"
                )}
              </button>
            </div>
          )}

          {/* ── STEP 4: COD Success Toast ── */}
          {step === 4 && (
            <div className="text-center py-8 space-y-5">
              {/* Animated check circle */}
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 size={48} className="text-emerald-600" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">Order Confirmed!</h2>
                <p className="text-slate-500 mt-2 text-sm">
                  {method === "cod"
                    ? "Your order is placed. Please pay at the canteen counter when collecting."
                    : "Your order has been successfully placed."}
                </p>
              </div>

              {orderId && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Order ID</span>
                    <span className="font-bold text-slate-900">ORD-{orderId}</span>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Amount Due</span>
                    <span className="font-bold text-emerald-700">৳{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Est. Prep Time</span>
                    <span className="font-bold text-slate-800">10 – 15 mins</span>
                  </div>
                </div>
              )}

              {/* Auto-close countdown for COD */}
              {method === "cod" && autoClose && (
                <div className="text-xs text-slate-400">
                  Closing automatically in{" "}
                  <span className="font-bold text-[#5b50d6]">{countdown}s</span>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full rounded-2xl bg-[#5b50d6] px-4 py-4 font-bold text-white shadow-lg shadow-[#5b50d6]/20 transition hover:bg-[#4638c4]"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
