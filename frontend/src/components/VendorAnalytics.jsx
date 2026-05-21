import React from 'react';
import { DollarSign, ShoppingBag, Clock, AlertTriangle } from 'lucide-react'; // Har card ke liye icons

const VendorAnalytics = ({ orders = [], products = [] }) => {
  
  // 1. Total Revenue: Saare 'DELIVERED' ya completed orders ka total cost
  const totalRevenue = orders
    .filter(order => order.status === 'DELIVERED' || order.status === 'COMPLETED')
    .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

  // 2. Total Orders Count
  const totalOrders = orders.length;

  // 3. Pending Deliveries: Jo abhi PENDING ya PROCESSING hain
  const pendingDeliveries = orders.filter(
    order => order.status === 'PENDING' || order.status === 'PROCESSING'
  ).length;

  // 4. Low Stock Alert: Aise products jinki stock_qty 5 se kam hai
  const lowStockCount = products.filter(
    product => (product.stock_qty || product.stock) < 5
  ).length;

  // Cards Data Array for clean rendering
  const cards = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Pending Deliveries",
      value: pendingDeliveries,
      icon: <Clock className="w-6 h-6 text-amber-600" />,
      bgColor: "bg-amber-50",
      textColor: "text-amber-600"
    },
    {
      title: "Low Stock Alert",
      value: lowStockCount,
      icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
      bgColor: "bg-rose-50",
      textColor: "text-rose-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
          </div>
          <div className={`p-3 rounded-lg ${card.bgColor} ${card.textColor}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VendorAnalytics;