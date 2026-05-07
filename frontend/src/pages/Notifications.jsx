import { useState } from 'react';
import { Bell, CheckCircle2, ShoppingBag, Utensils, AlertCircle, CalendarClock, MoreVertical } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'order', title: 'Order Ready', text: 'Your order #1024 is ready for pickup at Counter 2.', time: '5 mins ago', read: false },
    { id: 2, type: 'menu', title: 'Special Menu Available', text: 'Checkout the new vegan options added today!', time: '1 hour ago', read: false },
    { id: 3, type: 'system', title: 'Scheduled Maintenance', text: 'Canteen system will be offline tonight from 2 AM to 4 AM.', time: 'yesterday', read: true },
    { id: 4, type: 'order', title: 'Order Placed', text: 'Order #1023 has been received and is being prepared.', time: 'yesterday', read: true },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'order': return <ShoppingBag className="w-5 h-5 text-indigo-400" />;
      case 'menu': return <Utensils className="w-5 h-5 text-emerald-400" />;
      case 'system': return <AlertCircle className="w-5 h-5 text-amber-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'order': return 'bg-indigo-500/10 border-indigo-500/20';
      case 'menu': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'system': return 'bg-amber-500/10 border-amber-500/20';
      default: return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Bell className="w-6 h-6 text-indigo-400" /> Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length} New
              </span>
            )}
          </h1>
        </div>
        <button 
          onClick={markAllAsRead} 
          className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
             <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
             <p>You have no notifications at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => markAsRead(notif.id)}
                className={`p-5 hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-4 ${notif.read ? 'opacity-70' : 'bg-slate-800/20'}`}
              >
                <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${getBgColor(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold ${notif.read ? 'text-slate-300' : 'text-slate-100'}`}>
                      {notif.title}
                    </p>
                    <span className="shrink-0 text-xs text-slate-500">{notif.time}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{notif.text}</p>
                </div>
                
                {!notif.read && (
                  <div className="shrink-0 self-center">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                  </div>
                )}
                
                <button className="self-center p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700 transition">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
